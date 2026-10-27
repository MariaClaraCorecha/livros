import { Book, BookFormat } from './book';

export type BookSort = 'recent' | 'title' | 'author' | 'progress';

export interface BookQuery {
  text: string;
  format: BookFormat | 'all';
  sort: BookSort;
}

export const BOOK_SORTS: readonly { id: BookSort; label: string; icon: string }[] = [
  { id: 'recent', label: 'Lidos recentemente', icon: 'schedule' },
  { id: 'title', label: 'Título (A–Z)', icon: 'sort_by_alpha' },
  { id: 'author', label: 'Autor (A–Z)', icon: 'person' },
  { id: 'progress', label: 'Progresso', icon: 'donut_large' },
];

export const DEFAULT_BOOK_QUERY: BookQuery = { text: '', format: 'all', sort: 'recent' };

const byText = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const COMPARATORS: Record<BookSort, (a: Book, b: Book) => number> = {
  recent: (a, b) => (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt),
  title: (a, b) => byText(a.title, b.title),
  author: (a, b) => byText(a.author, b.author) || byText(a.title, b.title),
  progress: (a, b) => b.progress - a.progress,
};

/** Minúsculas e sem acentos, para a busca encontrar "joao" em "João". */
export const searchable = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Filtra por texto e formato e ordena conforme o critério escolhido. */
export function queryBooks(books: readonly Book[], query: BookQuery): Book[] {
  const text = searchable(query.text.trim());
  return books
    .filter((book) => query.format === 'all' || book.format === query.format)
    .filter((book) => !text || searchable(`${book.title} ${book.author}`).includes(text))
    .sort(COMPARATORS[query.sort]);
}

export const isFiltered = (query: BookQuery): boolean =>
  !!query.text.trim() || query.format !== 'all';
