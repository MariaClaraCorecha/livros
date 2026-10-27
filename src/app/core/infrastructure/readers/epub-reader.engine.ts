import type { Book as EpubBook, Contents, Location, NavItem, Rendition } from 'epubjs';
import {
  colorHex,
  Highlight,
  HIGHLIGHT_COLORS,
  Locator,
  ReaderAppearance,
  ReaderEngine,
  READER_FONTS_STYLESHEET,
  readerFont,
  ReaderEvents,
  ReaderPosition,
  ReaderTheme,
  TocEntry,
} from '../../domain';
import { debounce, Disposables, normalizeText } from './dom-listeners';

type EpubModule = typeof import('epubjs');

const THEMES: Record<ReaderTheme, { background: string; color: string }> = {
  paper: { background: '#fdfbf6', color: '#2b2a28' },
  sepia: { background: '#f4ecd8', color: '#4a3b2a' },
  night: { background: '#1e1f22', color: '#d9d4ca' },
};

/** Elementos de texto que recebem a fonte e o espaçamento escolhidos (mesmo se o livro definir outros). */
const TEXT_ELEMENTS =
  'body, p, li, blockquote, dd, dt, td, th, div, span, a, em, i, b, strong, h1, h2, h3, h4, h5, h6';

/**
 * Regras base aplicadas a todo capítulo. Fonte e altura de linha vêm de variáveis CSS
 * definidas no <body> (setAppearance), assim mudam sem recriar o estilo.
 */
const BASE_STYLES = {
  [TEXT_ELEMENTS]: { 'font-family': 'var(--reader-font) !important' },
  'p, li, blockquote, dd': { 'line-height': 'var(--reader-line-height) !important' },
  'img, svg, video': {
    'max-width': '100% !important',
    'max-height': '95vh !important',
    'object-fit': 'contain',
  },
  p: { hyphens: 'auto', '-webkit-hyphens': 'auto', orphans: '2', widows: '2' },
  a: { color: 'inherit !important', 'text-decoration-color': 'currentColor' },
};

const TURN_DISTANCE = 48;
const TURN_OUT = { duration: 140, easing: 'cubic-bezier(0.4, 0, 1, 1)' };
const TURN_IN = { duration: 240, easing: 'cubic-bezier(0, 0, 0.2, 1)' };

/** Fração da largura, em cada lateral, que vira página ao tocar/clicar. */
const TAP_ZONE = 0.22;
const SWIPE_DISTANCE = 50;

/** Leitor de EPUB paginado baseado no epub.js; locators usam CFI (ou href de capítulo). */
export class EpubReaderEngine implements ReaderEngine {
  readonly supportsZoom = false;

  private lib!: EpubModule;
  private book?: EpubBook;
  private rendition?: Rendition;
  private host?: HTMLElement;
  private stage?: HTMLElement;
  private events!: ReaderEvents;
  private location?: Location;
  private locationsReady = false;
  private turning = false;
  private destroyed = false;
  private appearance?: ReaderAppearance;
  private highlights: readonly Highlight[] = [];
  private readonly painted = new Map<string, { cfi: string; color: string }>();
  private readonly disposables = new Disposables();

  async open(host: HTMLElement, file: Blob, events: ReaderEvents, start?: Locator): Promise<void> {
    this.events = events;
    this.lib = await import('epubjs');
    this.book = this.lib.default(await file.arrayBuffer());

    // O epub.js mede o próprio container (incluindo padding); por isso renderizamos numa área
    // interna sem padding, posicionada via CSS dentro do "papel".
    const stage = document.createElement('div');
    stage.className = 'epub-stage';
    host.classList.add('epub-reader');
    host.replaceChildren(stage);
    this.host = host;
    this.stage = stage;

    const rendition = this.book.renderTo(stage, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'auto',
      minSpreadWidth: 960,
      allowScriptedContent: false,
    });
    this.rendition = rendition;

    rendition.on('relocated', (location: Location) => {
      this.location = location;
      this.emitPosition();
    });
    rendition.on('selected', (cfiRange: string, contents: Contents) =>
      this.emitSelection(cfiRange, contents),
    );
    rendition.on('keyup', (event: KeyboardEvent) => this.handleKey(event));
    rendition.on('click', (event: MouseEvent) => this.handleTap(event));
    this.bindSwipe(rendition);
    rendition.themes.default(BASE_STYLES);
    rendition.hooks.content.register((contents: Contents) => {
      void contents.addStylesheet(READER_FONTS_STYLESHEET);
      contents.document.addEventListener('selectionchange', () => {
        if (contents.window.getSelection()?.isCollapsed) this.events.selection(null);
      });
    });

    if (this.appearance) this.setAppearance(this.appearance);
    await this.display(start?.kind === 'epub' ? start.cfi : undefined);
    this.setHighlights(this.highlights);
    this.observeResize(stage);

    // Gera as "localizações" em segundo plano para calcular progresso global preciso.
    void this.book.ready
      .then(() => this.book?.locations.generate(1200))
      .then(() => {
        if (this.destroyed) return;
        this.locationsReady = true;
        this.emitPosition();
      })
      .catch(() => undefined);
  }

  async goTo(locator: Locator): Promise<void> {
    if (locator.kind === 'epub') await this.display(locator.cfi);
  }

  async goToProgress(progress: number): Promise<void> {
    const book = this.book;
    if (!book) return;
    const clamped = Math.min(Math.max(progress, 0), 1);
    // Enquanto as localizações não ficam prontas, salta para o capítulo proporcional.
    const target = this.locationsReady
      ? book.locations.cfiFromPercentage(clamped)
      : book.spine.get(Math.min(Math.floor(clamped * this.chapterCount()), this.chapterCount() - 1))
          ?.href;
    await this.display(target);
  }

  async goToPage(page: number): Promise<void> {
    const locations = this.book?.locations;
    if (!this.locationsReady || !locations) return;
    const index = Math.min(Math.max(page - 1, 0), locations.length() - 1);
    await this.display(locations.cfiFromLocation(index));
  }

  next(): void {
    void this.turn('next');
  }

  prev(): void {
    void this.turn('prev');
  }

  zoom(): void {
    // Em EPUB o tamanho é controlado pela fonte (setAppearance).
  }

  async tableOfContents(): Promise<TocEntry[]> {
    const navigation = await this.book?.loaded.navigation;
    const entries: TocEntry[] = [];
    const walk = (items: NavItem[], depth: number) =>
      items.forEach((item) => {
        entries.push({
          label: item.label.trim(),
          depth,
          locator: { kind: 'epub', cfi: item.href },
        });
        walk(item.subitems ?? [], depth + 1);
      });
    walk(navigation?.toc ?? [], 0);
    return entries;
  }

  setHighlights(highlights: readonly Highlight[]): void {
    this.highlights = highlights;
    const rendition = this.rendition;
    if (!rendition) return;

    const next = new Map(highlights.filter((h) => h.locator.kind === 'epub').map((h) => [h.id, h]));
    for (const [id, mark] of this.painted) {
      if (next.get(id)?.color !== mark.color) {
        rendition.annotations.remove(mark.cfi, 'highlight');
        this.painted.delete(id);
      }
    }
    for (const highlight of next.values()) {
      if (this.painted.has(highlight.id) || highlight.locator.kind !== 'epub') continue;
      const cfi = highlight.locator.cfi;
      rendition.annotations.highlight(
        cfi,
        { id: highlight.id },
        () => this.events.highlightClick(highlight.id),
        'epub-highlight',
        { fill: colorHex(HIGHLIGHT_COLORS, highlight.color), 'fill-opacity': '0.45' },
      );
      this.painted.set(highlight.id, { cfi, color: highlight.color });
    }
  }

  setAppearance(appearance: ReaderAppearance): void {
    this.appearance = appearance;
    const themes = this.rendition?.themes;
    if (!themes) return;
    const palette = THEMES[appearance.theme];
    themes.override('background', palette.background, true);
    themes.override('color', palette.color, true);
    themes.override('--reader-font', readerFont(appearance.font).family);
    themes.override('--reader-line-height', String(appearance.lineHeight));
    themes.fontSize(`${appearance.fontSize}%`);
  }

  isVisible(locator: Locator): boolean {
    return locator.kind === 'epub' && this.isOnScreen(locator.cfi);
  }

  clearSelection(): void {
    for (const contents of (this.rendition?.getContents() ?? []) as unknown as Contents[]) {
      contents.window.getSelection()?.removeAllRanges();
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.disposables.dispose();
    this.rendition?.destroy();
    this.book?.destroy();
    this.host?.classList.remove('epub-reader');
    this.host?.replaceChildren();
  }

  /**
   * Exibe o alvo (CFI ou href). Ao abrir outro capítulo, o epub.js escolhe a coluna antes de o
   * texto terminar de se acomodar (fontes e tema), e a tela fica algumas páginas antes do alvo.
   * Nesse caso, espera o layout assentar e exibe de novo.
   */
  private async display(target?: string): Promise<void> {
    const rendition = this.rendition;
    if (!rendition) return;
    await rendition.display(target);
    if (!target?.startsWith('epubcfi(') || this.isOnScreen(target)) return;
    await this.layoutSettled();
    if (!this.destroyed) await rendition.display(target);
  }

  private async layoutSettled(): Promise<void> {
    const contents = (this.rendition?.getContents() ?? []) as unknown as Contents[];
    await Promise.all(contents.map((item) => item.document.fonts.ready));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  private isOnScreen(cfi: string): boolean {
    const location = this.location;
    if (!location) return false;
    const compare = new this.lib.EpubCFI();
    try {
      return (
        compare.compare(cfi, location.start.cfi) >= 0 && compare.compare(cfi, location.end.cfi) <= 0
      );
    } catch {
      return false;
    }
  }

  /** Vira a página com uma transição curta (deslizar ou esmaecer), conforme a preferência. */
  private async turn(direction: 'next' | 'prev'): Promise<void> {
    const rendition = this.rendition;
    const stage = this.stage;
    if (!rendition || this.turning) return;
    const go = () => (direction === 'next' ? rendition.next() : rendition.prev());
    const style = this.appearance?.pageAnimation ?? 'slide';
    const atEdge = direction === 'next' ? this.location?.atEnd : this.location?.atStart;
    if (
      !stage ||
      style === 'none' ||
      atEdge ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      await go();
      return;
    }

    const shift = (direction === 'next' ? -1 : 1) * TURN_DISTANCE;
    const [exit, enter] =
      style === 'slide'
        ? [
            [
              { transform: 'none', opacity: 1 },
              { transform: `translateX(${shift}px)`, opacity: 0 },
            ],
            [
              { transform: `translateX(${-shift}px)`, opacity: 0 },
              { transform: 'none', opacity: 1 },
            ],
          ]
        : [
            [{ opacity: 1 }, { opacity: 0 }],
            [{ opacity: 0 }, { opacity: 1 }],
          ];

    this.turning = true;
    try {
      const out = stage.animate(exit, { ...TURN_OUT, fill: 'forwards' });
      await out.finished;
      await go();
      const back = stage.animate(enter, TURN_IN);
      out.cancel();
      await back.finished;
    } catch {
      // Animação interrompida (ex.: leitor fechado no meio da transição).
    } finally {
      this.turning = false;
    }
  }

  private observeResize(host: HTMLElement): void {
    const resize = debounce(() => this.rendition?.resize(host.clientWidth, host.clientHeight), 150);
    const observer = new ResizeObserver(() => resize());
    observer.observe(host);
    this.disposables.add(() => {
      resize.cancel();
      observer.disconnect();
    });
  }

  /** Toque/clique nas laterais da página vira a página (exceto em links ou com texto selecionado). */
  private handleTap(event: MouseEvent): void {
    const view = event.view;
    const target = event.target as Element | null;
    if (!view || !this.stage || !view.getSelection()?.isCollapsed || target?.closest?.('a')) return;
    const frame = (view.frameElement as HTMLElement | null)?.getBoundingClientRect();
    const box = this.stage.getBoundingClientRect();
    const x = (event.clientX + (frame?.left ?? 0) - box.left) / box.width;
    if (x < TAP_ZONE) this.prev();
    else if (x > 1 - TAP_ZONE) this.next();
  }

  private bindSwipe(rendition: Rendition): void {
    let startX = 0;
    let startY = 0;
    rendition.on('touchstart', (event: TouchEvent) => {
      startX = event.changedTouches[0].screenX;
      startY = event.changedTouches[0].screenY;
    });
    rendition.on('touchend', (event: TouchEvent) => {
      const dx = event.changedTouches[0].screenX - startX;
      const dy = event.changedTouches[0].screenY - startY;
      if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) this.next();
      else this.prev();
    });
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
  }

  private progressOf(cfi: string): number {
    if (!this.locationsReady || !this.book) return this.estimatedProgress();
    try {
      return this.book.locations.percentageFromCfi(cfi);
    } catch {
      return this.estimatedProgress();
    }
  }

  /** Estimativa pelo capítulo atual e pela página dentro dele (antes das localizações). */
  private estimatedProgress(): number {
    const start = this.location?.start;
    if (!start) return 0;
    const { page, total } = start.displayed;
    return Math.min((start.index + (page - 1) / Math.max(total, 1)) / this.chapterCount(), 1);
  }

  private chapterCount(): number {
    return (this.book?.spine.last()?.index ?? 0) + 1;
  }

  /**
   * "Páginas" do livro: cada localização gerada tem ~1200 caracteres, mais ou menos uma página
   * impressa. Fica indefinido até as localizações ficarem prontas.
   */
  private visiblePages(): Pick<ReaderPosition, 'page' | 'lastPage' | 'totalPages'> {
    const location = this.location;
    const totalPages = this.book?.locations.length() ?? 0;
    if (!this.locationsReady || !location || !totalPages) return {};
    return {
      page: this.pageAt(location.start.cfi, totalPages),
      lastPage: location.atEnd ? totalPages : this.pageAt(location.end.cfi, totalPages),
      totalPages,
    };
  }

  /**
   * Página (1..total) que contém o CFI. `locationFromCfi` devolve o índice do primeiro trecho que
   * começa no CFI ou depois dele; logo, o CFI está no trecho anterior, salvo se cair no início exato.
   */
  private pageAt(cfi: string, totalPages: number): number {
    const locations = this.book!.locations;
    const index = locations.locationFromCfi(cfi) as unknown as number;
    const exact =
      index < totalPages &&
      new this.lib.EpubCFI().compare(locations.cfiFromLocation(index), cfi) === 0;
    return Math.min(Math.max(index + (exact ? 1 : 0), 1), totalPages);
  }

  private chapterLabel(href?: string): string {
    const target = href?.split('#')[0];
    if (!target) return '';
    const find = (items: NavItem[]): NavItem | undefined => {
      for (const item of items) {
        if (item.href.split('#')[0].endsWith(target) || target.endsWith(item.href.split('#')[0]))
          return item;
        const child = find(item.subitems ?? []);
        if (child) return child;
      }
      return undefined;
    };
    return find(this.book?.navigation?.toc ?? [])?.label.trim() ?? '';
  }

  private placementLabel(progress: number, href?: string): string {
    const chapter = this.chapterLabel(href);
    const percent = `${Math.round(progress * 100)}%`;
    return chapter ? `${chapter} · ${percent}` : percent;
  }

  private emitPosition(): void {
    const start = this.location?.start;
    if (!start) return;
    const progress = this.location?.atEnd ? 1 : this.progressOf(start.cfi);
    this.events.position({
      locator: { kind: 'epub', cfi: start.cfi },
      position: progress,
      label: this.placementLabel(progress, start.href),
      ...this.visiblePages(),
    });
  }

  private emitSelection(cfiRange: string, contents: Contents): void {
    const range = this.rendition?.getRange(cfiRange);
    const text = normalizeText(range?.toString() ?? '');
    if (!range || !text) return;

    const frame = (contents.window.frameElement as HTMLElement | null)?.getBoundingClientRect();
    const rect = range.getBoundingClientRect();
    const progress = this.progressOf(cfiRange);
    this.events.selection({
      text,
      locator: { kind: 'epub', cfi: cfiRange },
      position: progress,
      label: this.placementLabel(progress, this.location?.start.href),
      anchor: new DOMRect(
        rect.left + (frame?.left ?? 0),
        rect.top + (frame?.top ?? 0),
        rect.width,
        rect.height,
      ),
    });
  }
}
