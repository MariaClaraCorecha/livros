import { inject, Injectable } from '@angular/core';
import { AnnotationRepository } from '../domain';
import { AuthService } from './auth.service';
import { LibraryService } from './library.service';

export interface ReadingStats {
  books: number;
  finished: number;
  highlights: number;
  bookmarks: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly annotations = inject(AnnotationRepository);
  private readonly library = inject(LibraryService);
  private readonly auth = inject(AuthService);

  async load(): Promise<ReadingStats> {
    const userId = this.auth.user()?.id;
    const counts = userId
      ? await this.annotations.countByOwner(userId)
      : { highlights: 0, bookmarks: 0 };
    const books = this.library.library();
    return {
      books: books.length,
      finished: books.filter((book) => book.progress >= 0.98).length,
      ...counts,
    };
  }
}
