import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AnnotationComment,
  AnnotationRepository,
  Book,
  Bookmark,
  BookmarkColor,
  byPosition,
  Highlight,
  HighlightColor,
  LocatorPlacement,
} from '../domain';
import { createId } from '../../shared/utils/id';
import { LibraryService } from './library.service';

export type NewComment = Pick<AnnotationComment, 'text' | 'audio' | 'audioDuration'>;

/**
 * Estado de uma sessão de leitura (livro aberto, destaques e marcadores).
 * Fornecido pela página do leitor, vive apenas enquanto o livro está aberto.
 */
@Injectable()
export class ReadingSessionStore {
  private readonly library = inject(LibraryService);
  private readonly annotations = inject(AnnotationRepository);
  private readonly highlightList = signal<Highlight[]>([]);
  private readonly bookmarkList = signal<Bookmark[]>([]);

  readonly book = signal<Book | null>(null);
  readonly highlights = computed(() => [...this.highlightList()].sort(byPosition));
  readonly bookmarks = computed(() => [...this.bookmarkList()].sort(byPosition));

  /** Abre o livro e retorna o arquivo para o motor de leitura; `null` se não existir. */
  async open(bookId: string): Promise<Blob | null> {
    const opened = await this.library.open(bookId);
    if (!opened) return null;
    const [highlights, bookmarks] = await Promise.all([
      this.annotations.listHighlights(bookId),
      this.annotations.listBookmarks(bookId),
    ]);
    this.book.set(opened.book);
    this.highlightList.set(highlights);
    this.bookmarkList.set(bookmarks);
    return opened.file;
  }

  async saveProgress(placement: LocatorPlacement): Promise<void> {
    const book = this.book();
    if (book)
      this.book.set(await this.library.saveProgress(book, placement.locator, placement.position));
  }

  // ---------- Destaques ----------

  async addHighlight(
    placement: LocatorPlacement & { text: string },
    color: HighlightColor,
  ): Promise<Highlight> {
    const book = this.requireBook();
    const now = Date.now();
    const highlight: Highlight = {
      ...placement,
      id: createId(),
      bookId: book.id,
      ownerId: book.ownerId,
      color,
      comments: [],
      reactions: [],
      createdAt: now,
      updatedAt: now,
    };
    await this.saveHighlight(highlight);
    return highlight;
  }

  findHighlight(id: string): Highlight | undefined {
    return this.highlightList().find((highlight) => highlight.id === id);
  }

  recolorHighlight(highlight: Highlight, color: HighlightColor): Promise<Highlight> {
    return this.saveHighlight({ ...highlight, color });
  }

  toggleReaction(highlight: Highlight, emoji: string): Promise<Highlight> {
    const reactions = highlight.reactions.includes(emoji)
      ? highlight.reactions.filter((item) => item !== emoji)
      : [...highlight.reactions, emoji];
    return this.saveHighlight({ ...highlight, reactions });
  }

  addComment(highlight: Highlight, comment: NewComment): Promise<Highlight> {
    const created: AnnotationComment = { ...comment, id: createId(), createdAt: Date.now() };
    return this.saveHighlight({ ...highlight, comments: [...highlight.comments, created] });
  }

  removeComment(highlight: Highlight, commentId: string): Promise<Highlight> {
    return this.saveHighlight({
      ...highlight,
      comments: highlight.comments.filter((c) => c.id !== commentId),
    });
  }

  async removeHighlight(id: string): Promise<void> {
    await this.annotations.removeHighlight(id);
    this.highlightList.update((list) => list.filter((item) => item.id !== id));
  }

  // ---------- Marcadores de página ----------

  async addBookmark(placement: LocatorPlacement, color: BookmarkColor): Promise<Bookmark> {
    const book = this.requireBook();
    const bookmark: Bookmark = {
      ...placement,
      id: createId(),
      bookId: book.id,
      ownerId: book.ownerId,
      color,
      title: placement.label,
      createdAt: Date.now(),
    };
    await this.saveBookmark(bookmark);
    return bookmark;
  }

  async saveBookmark(bookmark: Bookmark): Promise<Bookmark> {
    await this.annotations.saveBookmark(bookmark);
    this.bookmarkList.update((list) => upsert(list, bookmark));
    return bookmark;
  }

  async removeBookmark(id: string): Promise<void> {
    await this.annotations.removeBookmark(id);
    this.bookmarkList.update((list) => list.filter((item) => item.id !== id));
  }

  private async saveHighlight(highlight: Highlight): Promise<Highlight> {
    const saved = { ...highlight, updatedAt: Date.now() };
    await this.annotations.saveHighlight(saved);
    this.highlightList.update((list) => upsert(list, saved));
    return saved;
  }

  private requireBook(): Book {
    const book = this.book();
    if (!book) throw new Error('Nenhum livro aberto.');
    return book;
  }
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((existing) => existing.id === item.id)
    ? list.map((existing) => (existing.id === item.id ? item : existing))
    : [...list, item];
}
