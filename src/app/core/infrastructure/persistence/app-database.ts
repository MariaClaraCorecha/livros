import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Book, Bookmark, Highlight, Shelf, UserProfile } from '../../domain';

interface LeitorSchema extends DBSchema {
  books: { key: string; value: Book; indexes: { ownerId: string } };
  files: { key: string; value: { id: string; blob: Blob } };
  highlights: { key: string; value: Highlight; indexes: { bookId: string; ownerId: string } };
  bookmarks: { key: string; value: Bookmark; indexes: { bookId: string; ownerId: string } };
  profiles: { key: string; value: UserProfile };
  shelves: { key: string; value: Shelf; indexes: { ownerId: string } };
}

export type LeitorDb = IDBPDatabase<LeitorSchema>;

/** Conexão única com o IndexedDB (os arquivos e áudios ficam salvos como Blob). */
@Injectable({ providedIn: 'root' })
export class AppDatabase {
  readonly connection: Promise<LeitorDb> = openDB<LeitorSchema>('leitor', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('books', { keyPath: 'id' }).createIndex('ownerId', 'ownerId');
        db.createObjectStore('files', { keyPath: 'id' });
        for (const name of ['highlights', 'bookmarks'] as const) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          store.createIndex('bookId', 'bookId');
          store.createIndex('ownerId', 'ownerId');
        }
        db.createObjectStore('profiles', { keyPath: 'userId' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('shelves', { keyPath: 'id' }).createIndex('ownerId', 'ownerId');
      }
    },
  });
}
