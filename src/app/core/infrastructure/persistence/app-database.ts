import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Book, Bookmark, Highlight, LEGACY_SHELF_EMOJI_ICONS, Shelf, SHELF_ICONS, UserProfile } from '../../domain';

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
  readonly connection: Promise<LeitorDb> = openDB<LeitorSchema>('leitor', 3, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
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
      if (oldVersion < 3) {
        // Bibliotecas deixam de usar emoji e passam a usar ícones do Material Symbols.
        let cursor = await transaction.objectStore('shelves').openCursor();
        while (cursor) {
          const { emoji, ...shelf } = cursor.value as Shelf & { emoji?: string };
          if (!shelf.icon) await cursor.update({ ...shelf, icon: LEGACY_SHELF_EMOJI_ICONS[emoji ?? ''] ?? SHELF_ICONS[0] });
          cursor = await cursor.continue();
        }
      }
    },
  });
}
