import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import {
  AnnotationRepository,
  Book,
  BookMetadataReader,
  BookRepository,
  detectBookFormat,
  fileTitle,
  Locator,
} from '../domain';
import { createId } from '../../shared/utils/id';
import { AuthService } from './auth.service';

export interface ImportResult {
  imported: number;
  rejected: string[];
}

/** Casos de uso da biblioteca: listar, importar, remover e registrar progresso. */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly books = inject(BookRepository);
  private readonly annotations = inject(AnnotationRepository);
  private readonly metadata = inject(BookMetadataReader);
  private readonly auth = inject(AuthService);
  private readonly items = signal<Book[]>([]);

  readonly loading = signal(false);
  readonly library = computed(() =>
    [...this.items()].sort((a, b) => (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt)),
  );

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => void this.refresh(user?.id));
    });
  }

  async refresh(ownerId = this.auth.user()?.id): Promise<void> {
    if (!ownerId) {
      this.items.set([]);
      return;
    }
    this.loading.set(true);
    try {
      this.items.set(await this.books.list(ownerId));
    } finally {
      this.loading.set(false);
    }
  }

  /** Importa arquivos; se `shelfId` for informado, os livros já entram nessa biblioteca. */
  async import(files: readonly File[], shelfId?: string): Promise<ImportResult> {
    const ownerId = this.auth.user()?.id;
    const result: ImportResult = { imported: 0, rejected: [] };
    if (!ownerId) return result;

    for (const file of files) {
      const format = detectBookFormat(file.name, file.type);
      if (!format) {
        result.rejected.push(file.name);
        continue;
      }
      const metadata = await this.metadata
        .read(file, format)
        .catch(() => ({ title: '', author: '', cover: undefined }));
      const book: Book = {
        id: createId(),
        ownerId,
        title: metadata.title || fileTitle(file.name),
        author: metadata.author || 'Autor desconhecido',
        cover: metadata.cover,
        format,
        size: file.size,
        addedAt: Date.now(),
        progress: 0,
        shelfIds: shelfId ? [shelfId] : [],
      };
      await this.books.add(book, file);
      this.items.update((books) => [...books, book]);
      result.imported++;
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await Promise.all([this.books.remove(id), this.annotations.removeAllForBook(id)]);
    this.items.update((books) => books.filter((book) => book.id !== id));
  }

  async open(id: string): Promise<{ book: Book; file: Blob } | null> {
    const [book, file] = await Promise.all([this.books.get(id), this.books.getFile(id)]);
    if (!book || !file || book.ownerId !== this.auth.user()?.id) return null;
    return { book: await this.save({ ...book, lastOpenedAt: Date.now() }), file };
  }

  toggleShelf(book: Book, shelfId: string): Promise<Book> {
    const shelfIds = book.shelfIds ?? [];
    return this.save({
      ...book,
      shelfIds: shelfIds.includes(shelfId)
        ? shelfIds.filter((id) => id !== shelfId)
        : [...shelfIds, shelfId],
    });
  }

  /** Define exatamente quais livros pertencem à biblioteca `shelfId`. */
  async setShelfMembers(shelfId: string, bookIds: ReadonlySet<string>): Promise<void> {
    const changed = this.items().filter(
      (book) => (book.shelfIds ?? []).includes(shelfId) !== bookIds.has(book.id),
    );
    await Promise.all(changed.map((book) => this.toggleShelf(book, shelfId)));
  }

  async removeShelfFromBooks(shelfId: string): Promise<void> {
    await this.setShelfMembers(shelfId, new Set());
  }

  async saveProgress(book: Book, locator: Locator, progress: number): Promise<Book> {
    return this.save({ ...book, lastLocator: locator, progress });
  }

  private async save(book: Book): Promise<Book> {
    await this.books.update(book);
    this.items.update((books) => books.map((item) => (item.id === book.id ? book : item)));
    return book;
  }
}
