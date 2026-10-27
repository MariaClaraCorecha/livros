import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { Book, Shelf } from '../../core/domain';

export interface ShelfBooksData {
  shelf: Shelf;
  books: readonly Book[];
}

/** Escolha de quais livros da estante geral fazem parte de uma biblioteca. */
@Component({
  selector: 'app-shelf-books-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shelf-books-dialog.html',
  styleUrl: './shelf-books-dialog.scss',
})
export class ShelfBooksDialog {
  protected readonly data = inject<ShelfBooksData>(MAT_DIALOG_DATA);
  protected readonly query = signal('');
  protected readonly selected = signal(
    new Set(
      this.data.books
        .filter((book) => book.shelfIds?.includes(this.data.shelf.id))
        .map((book) => book.id),
    ),
  );
  protected readonly visible = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.data.books.filter(
      (book) => !query || `${book.title} ${book.author}`.toLowerCase().includes(query),
    );
  });

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }
}

export function openShelfBooksDialog(
  dialog: MatDialog,
  data: ShelfBooksData,
): Promise<Set<string> | undefined> {
  const ref = dialog.open<ShelfBooksDialog, ShelfBooksData, Set<string>>(ShelfBooksDialog, {
    data,
    width: '520px',
    maxWidth: '94vw',
    maxHeight: '90dvh',
  });
  return firstValueFrom(ref.afterClosed());
}
