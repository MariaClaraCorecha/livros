import { inject, Injectable } from '@angular/core';
import {
  AnnotationRepository,
  Book,
  Bookmark,
  BookRepository,
  Highlight,
  ProfileRepository,
  Shelf,
  ShelfRepository,
  UserProfile,
} from '../../domain';
import { AppDatabase } from './app-database';

@Injectable()
export class IdbBookRepository extends BookRepository {
  private readonly db = inject(AppDatabase).connection;

  async list(ownerId: string): Promise<Book[]> {
    return (await this.db).getAllFromIndex('books', 'ownerId', ownerId);
  }

  async get(id: string): Promise<Book | undefined> {
    return (await this.db).get('books', id);
  }

  async getFile(id: string): Promise<Blob | undefined> {
    return (await (await this.db).get('files', id))?.blob;
  }

  async add(book: Book, file: Blob): Promise<void> {
    const tx = (await this.db).transaction(['books', 'files'], 'readwrite');
    await Promise.all([
      tx.objectStore('books').put(book),
      tx.objectStore('files').put({ id: book.id, blob: file }),
      tx.done,
    ]);
  }

  async update(book: Book): Promise<void> {
    await (await this.db).put('books', book);
  }

  async remove(id: string): Promise<void> {
    const tx = (await this.db).transaction(['books', 'files'], 'readwrite');
    await Promise.all([tx.objectStore('books').delete(id), tx.objectStore('files').delete(id), tx.done]);
  }
}

@Injectable()
export class IdbAnnotationRepository extends AnnotationRepository {
  private readonly db = inject(AppDatabase).connection;

  async listHighlights(bookId: string): Promise<Highlight[]> {
    return (await this.db).getAllFromIndex('highlights', 'bookId', bookId);
  }

  async saveHighlight(highlight: Highlight): Promise<void> {
    await (await this.db).put('highlights', highlight);
  }

  async removeHighlight(id: string): Promise<void> {
    await (await this.db).delete('highlights', id);
  }

  async listBookmarks(bookId: string): Promise<Bookmark[]> {
    return (await this.db).getAllFromIndex('bookmarks', 'bookId', bookId);
  }

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    await (await this.db).put('bookmarks', bookmark);
  }

  async removeBookmark(id: string): Promise<void> {
    await (await this.db).delete('bookmarks', id);
  }

  async removeAllForBook(bookId: string): Promise<void> {
    const db = await this.db;
    for (const store of ['highlights', 'bookmarks'] as const) {
      const keys = await db.getAllKeysFromIndex(store, 'bookId', bookId);
      await Promise.all(keys.map((key) => db.delete(store, key)));
    }
  }

  async countByOwner(ownerId: string): Promise<{ highlights: number; bookmarks: number }> {
    const db = await this.db;
    const [highlights, bookmarks] = await Promise.all([
      db.countFromIndex('highlights', 'ownerId', ownerId),
      db.countFromIndex('bookmarks', 'ownerId', ownerId),
    ]);
    return { highlights, bookmarks };
  }
}

@Injectable()
export class IdbProfileRepository extends ProfileRepository {
  private readonly db = inject(AppDatabase).connection;

  async get(userId: string): Promise<UserProfile | undefined> {
    return (await this.db).get('profiles', userId);
  }

  async save(profile: UserProfile): Promise<void> {
    await (await this.db).put('profiles', profile);
  }
}

@Injectable()
export class IdbShelfRepository extends ShelfRepository {
  private readonly db = inject(AppDatabase).connection;

  async list(ownerId: string): Promise<Shelf[]> {
    return (await this.db).getAllFromIndex('shelves', 'ownerId', ownerId);
  }

  async save(shelf: Shelf): Promise<void> {
    await (await this.db).put('shelves', shelf);
  }

  async remove(id: string): Promise<void> {
    await (await this.db).delete('shelves', id);
  }
}
