import { Locator } from './locator';

export type BookFormat = 'pdf' | 'epub';

export interface Book {
  id: string;
  ownerId: string;
  title: string;
  author: string;
  format: BookFormat;
  size: number;
  /** Capa em data URL (miniatura). */
  cover?: string;
  addedAt: number;
  lastOpenedAt?: number;
  /** Progresso de leitura entre 0 e 1. */
  progress: number;
  lastLocator?: Locator;
  /** Bibliotecas (estantes) às quais o livro pertence. */
  shelfIds?: string[];
}

export interface BookMetadata {
  title: string;
  author: string;
  cover?: string;
}

const EXTENSIONS: Record<string, BookFormat> = { pdf: 'pdf', epub: 'epub' };
const MIME_TYPES: Record<string, BookFormat> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
};

export function detectBookFormat(fileName: string, mimeType = ''): BookFormat | null {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[mimeType] ?? EXTENSIONS[extension] ?? null;
}

export const fileTitle = (fileName: string): string =>
  fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
