import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  colorHex,
  Highlight,
  HIGHLIGHT_COLORS,
  Locator,
  NormalizedRect,
  ReaderAppearance,
  ReaderEngine,
  ReaderEvents,
  TocEntry,
} from '../../domain';
import { loadPdfJs, openPdf } from '../documents/pdfjs';
import { debounce, Disposables, normalizeText } from './dom-listeners';

interface PageView {
  number: number;
  el: HTMLDivElement;
  textLayer: HTMLDivElement;
  highlightLayer: HTMLDivElement;
  renderedScale: number;
  rendering: boolean;
}

interface OutlineNode {
  title: string;
  dest: string | unknown[] | null;
  items: OutlineNode[];
}

const MAX_PAGE_WIDTH = 920;
const RENDER_MARGIN = '1000px 0px';

/**
 * Leitor de PDF com rolagem contínua: cada página é renderizada sob demanda
 * (canvas + camada de texto selecionável) e os destaques são desenhados numa camada própria.
 */
export class PdfReaderEngine implements ReaderEngine {
  readonly supportsZoom = true;

  private pdf?: PDFDocumentProxy;
  private host!: HTMLElement;
  private events!: ReaderEvents;
  private pages: PageView[] = [];
  private highlights: readonly Highlight[] = [];
  private readonly disposables = new Disposables();
  private baseWidth = 612;
  private pageRatio = Math.SQRT2;
  private zoomLevel = 1;
  private scale = 1;
  private current = 1;

  async open(host: HTMLElement, file: Blob, events: ReaderEvents, start?: Locator): Promise<void> {
    this.host = host;
    this.events = events;
    this.pdf = await openPdf(file);

    const viewport = (await this.pdf.getPage(1)).getViewport({ scale: 1 });
    this.baseWidth = viewport.width;
    this.pageRatio = viewport.height / viewport.width;
    this.scale = this.fitScale();

    host.classList.add('pdf-reader');
    this.pages = Array.from({ length: this.pdf.numPages }, (_, index) =>
      this.createPage(index + 1),
    );
    host.replaceChildren(...this.pages.map((page) => page.el));
    this.setHighlights(this.highlights);
    this.observePages();
    this.bindEvents();

    if (start?.kind === 'pdf') this.scrollToPage(start.page);
    this.emitPosition();
  }

  async goTo(locator: Locator): Promise<void> {
    if (locator.kind !== 'pdf') return;
    this.scrollToPage(locator.page, locator.rects?.[0]?.y);
  }

  async goToProgress(progress: number): Promise<void> {
    this.scrollToPage(Math.round(progress * this.pages.length));
  }

  next(): void {
    this.scrollToPage(this.current + 1);
  }

  prev(): void {
    this.scrollToPage(this.current - 1);
  }

  zoom(factor: number): void {
    this.zoomLevel = Math.min(3, Math.max(0.5, this.zoomLevel * factor));
    this.relayout();
  }

  async tableOfContents(): Promise<TocEntry[]> {
    const outline = ((await this.pdf?.getOutline()) ?? []) as OutlineNode[];
    const entries: TocEntry[] = [];
    const walk = async (nodes: OutlineNode[], depth: number) => {
      for (const node of nodes) {
        const page = await this.resolveDestination(node.dest);
        if (page) entries.push({ label: node.title, depth, locator: { kind: 'pdf', page } });
        if (node.items?.length) await walk(node.items, depth + 1);
      }
    };
    await walk(outline, 0);
    return entries;
  }

  setHighlights(highlights: readonly Highlight[]): void {
    this.highlights = highlights;
    this.pages.forEach((page) => this.paintHighlights(page));
  }

  setAppearance(_appearance: ReaderAppearance): void {
    // O PDF tem layout fixo: o tema é aplicado via CSS pelo container ([data-theme]).
  }

  isVisible(locator: Locator): boolean {
    return locator.kind === 'pdf' && locator.page === this.current;
  }

  clearSelection(): void {
    document.getSelection()?.removeAllRanges();
  }

  destroy(): void {
    this.disposables.dispose();
    void this.pdf?.loadingTask.destroy();
    this.host?.replaceChildren();
    this.host?.classList.remove('pdf-reader');
  }

  // ---------- Layout e renderização ----------

  private fitScale(): number {
    const available = Math.max(this.host.clientWidth - 32, 240);
    return (Math.min(available, MAX_PAGE_WIDTH) / this.baseWidth) * this.zoomLevel;
  }

  private createPage(number: number): PageView {
    const el = document.createElement('div');
    el.className = 'pdf-page';
    el.dataset['page'] = String(number);
    const highlightLayer = document.createElement('div');
    highlightLayer.className = 'pdf-highlights';
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    el.append(highlightLayer, textLayer);
    const page: PageView = {
      number,
      el,
      textLayer,
      highlightLayer,
      renderedScale: 0,
      rendering: false,
    };
    this.applySize(page);
    return page;
  }

  private applySize(page: PageView): void {
    const width = this.baseWidth * this.scale;
    page.el.style.width = `${width}px`;
    page.el.style.height = `${width * this.pageRatio}px`;
    page.el.style.setProperty('--total-scale-factor', String(this.scale));
  }

  private observePages(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = this.pages[Number((entry.target as HTMLElement).dataset['page']) - 1];
          if (entry.isIntersecting) void this.renderPage(page);
          else this.releasePage(page);
        }
      },
      { root: this.host, rootMargin: RENDER_MARGIN },
    );
    this.pages.forEach((page) => observer.observe(page.el));
    this.disposables.add(() => observer.disconnect());
  }

  private async renderPage(view: PageView): Promise<void> {
    if (!this.pdf || view.rendering || view.renderedScale === this.scale) return;
    const scale = this.scale;
    view.rendering = true;
    try {
      const [{ TextLayer }, page] = await Promise.all([loadPdfJs(), this.pdf.getPage(view.number)]);
      const viewport = page.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      await page.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      }).promise;
      if (scale !== this.scale) return;

      view.el.style.width = `${viewport.width}px`;
      view.el.style.height = `${viewport.height}px`;
      view.el.querySelector('canvas')?.remove();
      view.el.prepend(canvas);
      view.textLayer.replaceChildren();
      await new TextLayer({
        textContentSource: page.streamTextContent(),
        container: view.textLayer,
        viewport,
      }).render();
      view.renderedScale = scale;
    } catch {
      // Renderização cancelada (documento fechado durante o carregamento).
    } finally {
      view.rendering = false;
      // A escala mudou (zoom/redimensionamento) durante a renderização: refaz na escala atual.
      if (scale !== this.scale && this.isNearViewport(view)) void this.renderPage(view);
    }
  }

  /** Libera canvas de páginas distantes para economizar memória em documentos grandes. */
  private releasePage(view: PageView): void {
    if (!view.renderedScale) return;
    view.el.querySelector('canvas')?.remove();
    view.textLayer.replaceChildren();
    view.renderedScale = 0;
  }

  private relayout(): void {
    const anchor = this.current;
    this.scale = this.fitScale();
    this.pages.forEach((page) => this.applySize(page));
    this.scrollToPage(anchor);
    this.pages
      .filter((page) => this.isNearViewport(page))
      .forEach((page) => void this.renderPage(page));
  }

  private isNearViewport(page: PageView): boolean {
    const top = page.el.offsetTop - this.host.scrollTop;
    return top < this.host.clientHeight + 1000 && top + page.el.offsetHeight > -1000;
  }

  private scrollToPage(number: number, offset = 0): void {
    const page = this.pages[Math.min(Math.max(number, 1), this.pages.length) - 1];
    if (!page) return;
    const extra = offset ? offset * page.el.offsetHeight - this.host.clientHeight / 3 : 0;
    this.host.scrollTo({ top: page.el.offsetTop - 12 + extra });
    this.setCurrent(page.number);
  }

  // ---------- Eventos ----------

  private bindEvents(): void {
    const emitSelection = debounce(() => this.emitSelection(), 250);
    this.disposables.add(() => emitSelection.cancel());

    this.disposables.listen(this.host, 'scroll', () => this.updateCurrentFromScroll(), {
      passive: true,
    });
    this.disposables.listen(document, 'selectionchange', () => {
      if (document.getSelection()?.isCollapsed) this.events.selection(null);
      else emitSelection();
    });
    this.disposables.listen<MouseEvent>(this.host, 'click', (event) =>
      this.detectHighlightClick(event),
    );

    const resize = debounce(() => this.relayout(), 150);
    let lastWidth = this.host.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(this.host.clientWidth - lastWidth) < 2) return;
      lastWidth = this.host.clientWidth;
      resize();
    });
    observer.observe(this.host);
    this.disposables.add(() => observer.disconnect());
  }

  private updateCurrentFromScroll(): void {
    const line = this.host.scrollTop + this.host.clientHeight / 3;
    const page = this.pages.filter((view) => view.el.offsetTop <= line).at(-1) ?? this.pages[0];
    this.setCurrent(page.number);
  }

  private setCurrent(number: number): void {
    if (number === this.current) return;
    this.current = number;
    this.emitPosition();
  }

  private emitPosition(): void {
    const total = this.pages.length;
    this.events.position({
      locator: { kind: 'pdf', page: this.current },
      position: this.current / total,
      label: `Página ${this.current} de ${total}`,
      page: this.current,
      totalPages: total,
    });
  }

  private emitSelection(): void {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const pageEl = range.startContainer.parentElement?.closest<HTMLElement>('.pdf-page');
    const text = normalizeText(selection.toString());
    if (!pageEl || !this.host.contains(pageEl) || !text) return;

    const box = pageEl.getBoundingClientRect();
    const rects = mergeLineRects(
      Array.from(range.getClientRects())
        .filter((rect) => rect.width > 1 && rect.height > 1 && rect.height < box.height * 0.2)
        .filter((rect) => rect.bottom > box.top && rect.top < box.bottom)
        .map((rect) => {
          const left = Math.max(rect.left, box.left);
          return {
            x: (left - box.left) / box.width,
            y: (rect.top - box.top) / box.height,
            w: (Math.min(rect.right, box.right) - left) / box.width,
            h: rect.height / box.height,
          };
        }),
    );
    if (!rects.length) return;

    const page = Number(pageEl.dataset['page']);
    this.events.selection({
      text,
      locator: { kind: 'pdf', page, rects },
      position: (page - 1 + rects[0].y) / this.pages.length,
      label: `Página ${page}`,
      anchor: range.getBoundingClientRect(),
    });
  }

  private detectHighlightClick(event: MouseEvent): void {
    if (!document.getSelection()?.isCollapsed) return;
    const pageEl = (event.target as HTMLElement).closest<HTMLElement>('.pdf-page');
    if (!pageEl) return;
    const box = pageEl.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    const page = Number(pageEl.dataset['page']);
    const hit = this.highlights.find(
      ({ locator }) =>
        locator.kind === 'pdf' &&
        locator.page === page &&
        locator.rects?.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h),
    );
    if (hit) this.events.highlightClick(hit.id);
  }

  private paintHighlights(view: PageView): void {
    const marks = this.highlights.flatMap((highlight) => {
      const { locator } = highlight;
      if (locator.kind !== 'pdf' || locator.page !== view.number) return [];
      return (locator.rects ?? []).map((rect) => {
        const mark = document.createElement('div');
        mark.className = 'pdf-highlight';
        mark.style.cssText = `left:${rect.x * 100}%;top:${rect.y * 100}%;width:${rect.w * 100}%;height:${rect.h * 100}%;background:${colorHex(HIGHLIGHT_COLORS, highlight.color)}`;
        return mark;
      });
    });
    view.highlightLayer.replaceChildren(...marks);
  }

  private async resolveDestination(dest: OutlineNode['dest']): Promise<number | null> {
    try {
      const explicit = typeof dest === 'string' ? await this.pdf!.getDestination(dest) : dest;
      const ref = explicit?.[0];
      if (ref == null) return null;
      return typeof ref === 'number' ? ref + 1 : (await this.pdf!.getPageIndex(ref as never)) + 1;
    } catch {
      return null;
    }
  }
}

/** Une os vários retângulos que a camada de texto gera para uma mesma linha. */
function mergeLineRects(rects: NormalizedRect[]): NormalizedRect[] {
  const merged: NormalizedRect[] = [];
  for (const rect of [...rects].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const last = merged.at(-1);
    if (last && Math.abs(last.y - rect.y) < last.h * 0.5 && rect.x <= last.x + last.w + 0.01) {
      const right = Math.max(last.x + last.w, rect.x + rect.w);
      last.y = Math.min(last.y, rect.y);
      last.h = Math.max(last.h, rect.h);
      last.w = right - last.x;
    } else {
      merged.push({ ...rect });
    }
  }
  return merged;
}
