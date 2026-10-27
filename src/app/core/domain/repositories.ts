import { Bookmark, Highlight } from './models/annotation';
import { Book } from './models/book';
import { Shelf } from './models/shelf';
import { UserProfile } from './models/user';

/*
 * Contratos de persistência. Classes abstratas servem como tokens de injeção:
 * a camada de aplicação depende apenas delas, e a infraestrutura fornece as implementações.
 */

export abstract class BookRepository {
  abstract list(ownerId: string): Promise<Book[]>;
  abstract get(id: string): Promise<Book | undefined>;
  abstract getFile(id: string): Promise<Blob | undefined>;
  abstract add(book: Book, file: Blob): Promise<void>;
  abstract update(book: Book): Promise<void>;
  abstract remove(id: string): Promise<void>;
}

export abstract class AnnotationRepository {
  abstract listHighlights(bookId: string): Promise<Highlight[]>;
  abstract saveHighlight(highlight: Highlight): Promise<void>;
  abstract removeHighlight(id: string): Promise<void>;
  abstract listBookmarks(bookId: string): Promise<Bookmark[]>;
  abstract saveBookmark(bookmark: Bookmark): Promise<void>;
  abstract removeBookmark(id: string): Promise<void>;
  abstract removeAllForBook(bookId: string): Promise<void>;
  abstract countByOwner(ownerId: string): Promise<{ highlights: number; bookmarks: number }>;
}

export abstract class ProfileRepository {
  abstract get(userId: string): Promise<UserProfile | undefined>;
  abstract save(profile: UserProfile): Promise<void>;
}

export abstract class ShelfRepository {
  abstract list(ownerId: string): Promise<Shelf[]>;
  abstract save(shelf: Shelf): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
