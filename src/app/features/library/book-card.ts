import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { Book, Shelf } from '../../core/domain';

@Component({
  selector: 'app-book-card',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    PercentPipe,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
})
export class BookCard {
  readonly book = input.required<Book>();
  readonly shelves = input<readonly Shelf[]>([]);
  readonly remove = output<Book>();
  readonly toggleShelf = output<{ book: Book; shelfId: string }>();
  readonly newShelf = output<Book>();

  protected readonly memberOf = computed(() =>
    this.shelves().filter((shelf) => this.book().shelfIds?.includes(shelf.id)),
  );

  protected isMember(shelfId: string): boolean {
    return !!this.book().shelfIds?.includes(shelfId);
  }
}
