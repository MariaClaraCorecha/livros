import { BookmarkColor, HighlightColor } from './colors';
import { LocatorPlacement } from './locator';

export interface AnnotationComment {
  id: string;
  text: string;
  audio?: Blob;
  /** Duração do áudio em segundos. */
  audioDuration?: number;
  createdAt: number;
}

export interface Highlight extends LocatorPlacement {
  id: string;
  bookId: string;
  ownerId: string;
  color: HighlightColor;
  text: string;
  comments: AnnotationComment[];
  reactions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Bookmark extends LocatorPlacement {
  id: string;
  bookId: string;
  ownerId: string;
  color: BookmarkColor;
  title: string;
  createdAt: number;
}

export const byPosition = (a: LocatorPlacement, b: LocatorPlacement) => a.position - b.position;
