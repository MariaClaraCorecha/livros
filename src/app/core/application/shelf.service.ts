import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Shelf, ShelfDraft, ShelfRepository } from '../domain';
import { createId } from '../../shared/utils/id';
import { AuthService } from './auth.service';
import { LibraryService } from './library.service';

export interface ShelfSummary extends Shelf {
  count: number;
}

/** Bibliotecas (estantes) criadas pelo usuário para organizar os livros por categoria. */
@Injectable({ providedIn: 'root' })
export class ShelfService {
  private readonly repository = inject(ShelfRepository);
  private readonly library = inject(LibraryService);
  private readonly auth = inject(AuthService);
  private readonly items = signal<Shelf[]>([]);

  /** Estantes em ordem alfabética, com a contagem de livros. */
  readonly shelves = computed<ShelfSummary[]>(() => {
    const books = this.library.library();
    return [...this.items()]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((shelf) => ({
        ...shelf,
        count: books.filter((book) => book.shelfIds?.includes(shelf.id)).length,
      }));
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => void this.load(user?.id));
    });
  }

  find(id: string | null | undefined): ShelfSummary | undefined {
    return id ? this.shelves().find((shelf) => shelf.id === id) : undefined;
  }

  async create(draft: ShelfDraft): Promise<Shelf> {
    const ownerId = this.auth.user()?.id;
    if (!ownerId) throw new Error('Usuário não autenticado.');
    const shelf: Shelf = { ...normalize(draft), id: createId(), ownerId, createdAt: Date.now() };
    await this.repository.save(shelf);
    this.items.update((list) => [...list, shelf]);
    return shelf;
  }

  async update(shelf: Shelf, draft: ShelfDraft): Promise<void> {
    const { id, ownerId, createdAt } = shelf;
    const updated: Shelf = { id, ownerId, createdAt, ...normalize(draft) };
    await this.repository.save(updated);
    this.items.update((list) => list.map((item) => (item.id === id ? updated : item)));
  }

  /** Exclui a biblioteca; os livros continuam na estante geral. */
  async remove(shelf: Shelf): Promise<void> {
    await this.library.removeShelfFromBooks(shelf.id);
    await this.repository.remove(shelf.id);
    this.items.update((list) => list.filter((item) => item.id !== shelf.id));
  }

  private async load(ownerId?: string): Promise<void> {
    this.items.set(ownerId ? await this.repository.list(ownerId) : []);
  }
}

function normalize(draft: ShelfDraft): ShelfDraft {
  return { ...draft, name: draft.name.trim(), description: draft.description.trim() };
}
