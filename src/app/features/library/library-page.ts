import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../core/application/library.service';
import { ProfileService } from '../../core/application/profile.service';
import { ShelfService } from '../../core/application/shelf.service';
import {
  Book,
  BOOK_SORTS,
  BookQuery,
  DEFAULT_BOOK_QUERY,
  isFiltered,
  queryBooks,
} from '../../core/domain';
import { confirmAction } from '../../shared/ui/confirm-dialog';
import { isTyping } from '../../shared/utils/keyboard';
import { EmptyState } from '../../shared/ui/empty-state';
import { BookCard } from './book-card';
import { openShelfBooksDialog } from './shelf-books-dialog';
import { openShelfDialog } from './shelf-dialog';

@Component({
  selector: 'app-library-page',
  imports: [
    RouterLink,
    PercentPipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    BookCard,
    EmptyState,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library-page.html',
  styleUrl: './library-page.scss',
  host: {
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class LibraryPage {
  private readonly library = inject(LibraryService);
  private readonly shelfService = inject(ShelfService);
  private readonly profiles = inject(ProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Query param `?estante=<id>`: biblioteca selecionada. */
  readonly estante = input<string>();

  protected readonly accept = '.pdf,.epub,application/pdf,application/epub+zip';
  protected readonly loading = this.library.loading;
  protected readonly sorts = BOOK_SORTS;
  /** Arquivos já processados na importação em andamento (`null` quando parada). */
  protected readonly importProgress = signal<{ done: number; total: number } | null>(null);
  protected readonly importing = computed(() => this.importProgress() !== null);
  protected readonly dragging = signal(false);
  protected readonly filters = signal<BookQuery>(DEFAULT_BOOK_QUERY);
  protected readonly hasFilters = computed(() => isFiltered(this.filters()));
  protected readonly sortLabel = computed(
    () => BOOK_SORTS.find((sort) => sort.id === this.filters().sort)?.label,
  );
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly firstName = computed(() => this.profiles.displayName().split(' ')[0]);
  protected readonly books = this.library.library;
  protected readonly shelves = this.shelfService.shelves;
  protected readonly shelf = computed(() => this.shelfService.find(this.estante()));
  protected readonly continueReading = computed(() =>
    this.shelf()
      ? undefined
      : this.books().find((book) => book.lastOpenedAt && book.progress < 0.98),
  );
  protected readonly shelfBooks = computed(() => {
    const shelf = this.shelf();
    return shelf ? this.books().filter((book) => book.shelfIds?.includes(shelf.id)) : this.books();
  });
  protected readonly filtered = computed(() => queryBooks(this.shelfBooks(), this.filters()));

  protected patchFilters(changes: Partial<BookQuery>): void {
    this.filters.update((filters) => ({ ...filters, ...changes }));
  }

  protected clearFilters(): void {
    this.patchFilters({ text: '', format: 'all' });
  }

  /** Atalho "/" para buscar, como em muitos apps de leitura e sites. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== '/' || isTyping(event)) return;
    const search = this.search()?.nativeElement;
    if (!search) return;
    event.preventDefault();
    search.focus();
  }

  // ---------- Livros ----------

  protected async onFilesSelected(input: HTMLInputElement): Promise<void> {
    await this.importFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  /** O dragleave também dispara ao passar entre elementos filhos; só esconde ao sair da página. */
  protected onDragLeave(event: DragEvent): void {
    const target = event.relatedTarget as Node | null;
    if (!target || !this.host.nativeElement.contains(target)) this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    void this.importFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  protected async remove(book: Book): Promise<void> {
    const confirmed = await confirmAction(this.dialog, {
      title: 'Remover livro?',
      message: `"${book.title}" e todas as suas anotações serão apagados deste dispositivo.`,
      confirmLabel: 'Remover',
    });
    if (!confirmed) return;
    await this.library.remove(book.id);
    this.snackBar.open('Livro removido.');
  }

  protected toggleShelf({ book, shelfId }: { book: Book; shelfId: string }): void {
    void this.library.toggleShelf(book, shelfId);
  }

  // ---------- Bibliotecas ----------

  /** Cria uma biblioteca; se vier de um livro, ele já entra nela. */
  protected async createShelf(book?: Book): Promise<void> {
    const draft = await openShelfDialog(this.dialog);
    if (!draft) return;
    const shelf = await this.shelfService.create(draft);
    if (book) await this.library.toggleShelf(book, shelf.id);
    this.snackBar.open(`Biblioteca "${shelf.name}" criada.`);
    if (!book) void this.router.navigate(['/biblioteca'], { queryParams: { estante: shelf.id } });
  }

  protected async editShelf(): Promise<void> {
    const shelf = this.shelf();
    if (!shelf) return;
    const draft = await openShelfDialog(this.dialog, shelf);
    if (draft) await this.shelfService.update(shelf, draft);
  }

  protected async deleteShelf(): Promise<void> {
    const shelf = this.shelf();
    if (!shelf) return;
    const confirmed = await confirmAction(this.dialog, {
      title: 'Excluir biblioteca?',
      message: `"${shelf.name}" será excluída. Os livros continuam disponíveis em "Todos os livros".`,
    });
    if (!confirmed) return;
    await this.shelfService.remove(shelf);
    void this.router.navigate(['/biblioteca']);
  }

  protected async manageShelfBooks(): Promise<void> {
    const shelf = this.shelf();
    if (!shelf) return;
    const selected = await openShelfBooksDialog(this.dialog, { shelf, books: this.books() });
    if (selected) await this.library.setShelfMembers(shelf.id, selected);
  }

  private async importFiles(files: File[]): Promise<void> {
    if (!files.length) return;
    const total = files.length;
    this.importProgress.set({ done: 0, total });
    try {
      const { imported, rejected } = await this.library.import(files, this.shelf()?.id, (done) =>
        this.importProgress.set({ done, total }),
      );
      const parts = [];
      if (imported)
        parts.push(`${imported} ${imported === 1 ? 'livro adicionado' : 'livros adicionados'}`);
      if (rejected.length) parts.push(`${rejected.length} ignorado(s): use PDF ou EPUB`);
      this.snackBar.open(parts.join(' · '), 'OK');
    } catch {
      this.snackBar.open('Não foi possível importar o arquivo.', 'OK');
    } finally {
      this.importProgress.set(null);
    }
  }
}
