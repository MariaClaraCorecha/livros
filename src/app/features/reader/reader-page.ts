import { BreakpointObserver } from '@angular/cdk/layout';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ProfileService } from '../../core/application/profile.service';
import { ReadingSessionStore } from '../../core/application/reading-session.store';
import {
  BOOKMARK_COLORS,
  Bookmark,
  BookmarkColor,
  colorHex,
  HighlightColor,
  Locator,
  ReaderEngine,
  ReaderEngineFactory,
  ReaderFont,
  ReaderPosition,
  PageAnimation,
  LINE_HEIGHTS,
  DEFAULT_READER_PREFERENCES,
  ReaderSelection,
  ReaderTheme,
  TocEntry,
} from '../../core/domain';
import { debounce } from '../../shared/utils/debounce';
import { ColorSwatches } from '../../shared/ui/color-swatches';
import { FontPicker } from '../../shared/ui/font-picker';
import { AnnotationsPanel } from './annotations-panel';
import { HighlightDialog, HighlightDialogData } from './highlight-dialog';
import { SelectionToolbar } from './selection-toolbar';

@Component({
  selector: 'app-reader-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSliderModule,
    MatTooltipModule,
    AnnotationsPanel,
    ColorSwatches,
    FontPicker,
    SelectionToolbar,
  ],
  providers: [ReadingSessionStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader-page.html',
  styleUrl: './reader-page.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
    // No tema noturno, a interface do leitor também fica escura (os tokens M3 usam light-dark()).
    '[style.color-scheme]': "appearance().theme === 'night' ? 'dark' : null",
  },
})
export class ReaderPage {
  private readonly store = inject(ReadingSessionStore);
  private readonly engines = inject(ReaderEngineFactory);
  private readonly profiles = inject(ProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly injector = inject(Injector);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private engine?: ReaderEngine;
  private destroyed = false;

  /** Parâmetro de rota `:id`. */
  readonly id = input.required<string>();

  protected readonly book = this.store.book;
  protected readonly highlights = this.store.highlights;
  protected readonly bookmarks = this.store.bookmarks;
  protected readonly bookmarkColors = BOOKMARK_COLORS;
  protected readonly lineHeights = LINE_HEIGHTS;
  protected readonly pageAnimations: { value: PageAnimation; label: string }[] = [
    { value: 'slide', label: 'Deslizar' },
    { value: 'fade', label: 'Esmaecer' },
    { value: 'none', label: 'Sem efeito' },
  ];

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly ready = signal(false);
  protected readonly supportsZoom = signal(false);
  protected readonly position = signal<ReaderPosition | null>(null);
  protected readonly selection = signal<ReaderSelection | null>(null);
  protected readonly toc = signal<TocEntry[]>([]);
  protected readonly panelOpen = signal(false);
  protected readonly lastColor = signal<HighlightColor>('yellow');

  protected readonly wide = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1100px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly appearance = computed(
    () => this.profiles.profile()?.reader ?? DEFAULT_READER_PREFERENCES,
  );
  protected readonly progress = computed(() => Math.round((this.position()?.position ?? 0) * 100));
  protected readonly currentBookmark = computed(() => {
    this.position();
    return this.ready()
      ? this.bookmarks().find((bookmark) => this.engine?.isVisible(bookmark.locator))
      : undefined;
  });
  protected readonly currentBookmarkHex = computed(() => {
    const bookmark = this.currentBookmark();
    return bookmark ? colorHex(BOOKMARK_COLORS, bookmark.color) : null;
  });

  private readonly persistProgress = debounce(
    (position: ReaderPosition) => void this.store.saveProgress(position),
    1200,
  );

  constructor() {
    afterNextRender(() => void this.start());

    effect(() => {
      const highlights = this.highlights();
      if (this.ready()) this.engine?.setHighlights(highlights);
    });
    effect(() => {
      const appearance = this.appearance();
      if (this.ready()) this.engine?.setAppearance(appearance);
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.persistProgress.cancel();
      const position = this.position();
      if (position) void this.store.saveProgress(position);
      this.engine?.destroy();
    });
  }

  // ---------- Ciclo de vida ----------

  private async start(): Promise<void> {
    try {
      const file = await this.store.open(this.id());
      const book = this.book();
      if (!file || !book) {
        this.error.set('Este livro não foi encontrado na sua biblioteca.');
        return;
      }
      const engine = await this.engines.create(book.format);
      if (this.destroyed) return;
      this.engine = engine;
      this.supportsZoom.set(engine.supportsZoom);
      engine.setAppearance(this.appearance());
      engine.setHighlights(this.highlights());

      await engine.open(
        this.viewport().nativeElement,
        file,
        {
          position: (position) => {
            this.position.set(position);
            this.persistProgress(position);
          },
          selection: (selection) => {
            this.selection.set(selection);
          },
          highlightClick: (id) => this.openHighlight(id),
        },
        book.lastLocator,
      );
      if (this.destroyed) return;
      this.ready.set(true);
      this.toc.set(await engine.tableOfContents());
    } catch (error) {
      console.error(error);
      this.error.set(
        'Não foi possível abrir este arquivo. Ele pode estar corrompido ou protegido.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Navegação ----------

  protected next(): void {
    this.engine?.next();
  }

  protected prev(): void {
    this.engine?.prev();
  }

  protected zoom(factor: number): void {
    this.engine?.zoom(factor);
  }

  protected seek(percent: number): void {
    void this.engine?.goToProgress(percent / 100);
  }

  protected goTo(locator: Locator): void {
    void this.engine?.goTo(locator);
    if (!this.wide()) this.panelOpen.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (this.dialog.openDialogs.length || target.closest('input, textarea, [contenteditable]'))
      return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') this.next();
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') this.prev();
    else return;
    event.preventDefault();
  }

  // ---------- Destaques ----------

  protected async highlightSelection(color: HighlightColor): Promise<void> {
    const selection = this.selection();
    if (!selection) return;
    this.lastColor.set(color);
    await this.store.addHighlight(selection, color);
    this.clearSelection();
  }

  protected async commentSelection(): Promise<void> {
    const selection = this.selection();
    if (!selection) return;
    const highlight = await this.store.addHighlight(selection, this.lastColor());
    this.clearSelection();
    this.openHighlight(highlight.id);
  }

  protected async copySelection(): Promise<void> {
    const text = this.selection()?.text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.snackBar.open('Trecho copiado.');
    } catch {
      this.snackBar.open('Não foi possível copiar o trecho.', 'OK');
    }
    this.clearSelection();
  }

  protected openHighlight(highlightId: string): void {
    this.dialog.open<HighlightDialog, HighlightDialogData>(HighlightDialog, {
      data: { highlightId },
      injector: this.injector,
      width: '560px',
      maxWidth: '96vw',
      autoFocus: false,
    });
  }

  private clearSelection(): void {
    this.engine?.clearSelection();
    this.selection.set(null);
  }

  // ---------- Marcadores ----------

  protected async setBookmark(color: BookmarkColor): Promise<void> {
    const current = this.currentBookmark();
    const position = this.position();
    if (current) await this.store.saveBookmark({ ...current, color });
    else if (position) await this.store.addBookmark(position, color);
  }

  protected removeBookmark(bookmark: Bookmark | undefined): void {
    if (bookmark) void this.store.removeBookmark(bookmark.id);
  }

  protected recolorBookmark({
    bookmark,
    color,
  }: {
    bookmark: Bookmark;
    color: BookmarkColor;
  }): void {
    void this.store.saveBookmark({ ...bookmark, color });
  }

  // ---------- Aparência ----------

  protected setTheme(theme: ReaderTheme): void {
    void this.profiles.updateReader({ theme });
  }

  protected setFont(font: ReaderFont): void {
    void this.profiles.updateReader({ font });
  }

  protected setLineHeight(lineHeight: number): void {
    void this.profiles.updateReader({ lineHeight });
  }

  protected setPageAnimation(pageAnimation: PageAnimation): void {
    void this.profiles.updateReader({ pageAnimation });
  }

  protected changeFontSize(delta: number): void {
    const fontSize = Math.min(180, Math.max(70, this.appearance().fontSize + delta));
    void this.profiles.updateReader({ fontSize });
  }
}
