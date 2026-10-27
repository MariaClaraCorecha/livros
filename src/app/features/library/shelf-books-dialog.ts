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
  template: `
    <h2 mat-dialog-title>{{ data.shelf.emoji }} Livros em “{{ data.shelf.name }}”</h2>
    <mat-dialog-content class="content">
      <mat-form-field>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput placeholder="Filtrar livros" [value]="query()" (input)="query.set($any($event.target).value)" />
      </mat-form-field>
      <ul role="listbox" aria-multiselectable="true">
        @for (book of visible(); track book.id) {
          <li>
            <button type="button" role="option" [attr.aria-selected]="selected().has(book.id)" (click)="toggle(book.id)">
              @if (book.cover) {
                <img [src]="book.cover" alt="" />
              } @else {
                <span class="cover"><mat-icon>menu_book</mat-icon></span>
              }
              <span class="text">
                <strong>{{ book.title }}</strong>
                <span>{{ book.author }}</span>
              </span>
              <mat-icon class="check" [class.filled]="selected().has(book.id)">
                {{ selected().has(book.id) ? 'check_circle' : 'radio_button_unchecked' }}
              </mat-icon>
            </button>
          </li>
        } @empty {
          <li class="empty">Nenhum livro encontrado.</li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions>
      <span class="count">{{ selected().size }} selecionado(s)</span>
      <span class="spacer"></span>
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [mat-dialog-close]="selected()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    li button {
      inline-size: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: inherit;
      text-align: start;
      cursor: pointer;
    }
    li button:hover {
      background: var(--mat-sys-surface-container-high);
    }
    li button[aria-selected='true'] {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    img,
    .cover {
      inline-size: 36px;
      block-size: 54px;
      flex: none;
      border-radius: 6px;
      object-fit: cover;
    }
    .cover {
      display: grid;
      place-items: center;
      background: var(--mat-sys-tertiary-container);
    }
    .text {
      flex: 1;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
    }
    .text strong,
    .text span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .text span {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .check {
      color: var(--mat-sys-primary);
    }
    .empty {
      padding: 24px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .count {
      padding-inline-start: 12px;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class ShelfBooksDialog {
  protected readonly data = inject<ShelfBooksData>(MAT_DIALOG_DATA);
  protected readonly query = signal('');
  protected readonly selected = signal(
    new Set(this.data.books.filter((book) => book.shelfIds?.includes(this.data.shelf.id)).map((book) => book.id)),
  );
  protected readonly visible = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.data.books.filter((book) => !query || `${book.title} ${book.author}`.toLowerCase().includes(query));
  });

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }
}

export function openShelfBooksDialog(dialog: MatDialog, data: ShelfBooksData): Promise<Set<string> | undefined> {
  const ref = dialog.open<ShelfBooksDialog, ShelfBooksData, Set<string>>(ShelfBooksDialog, {
    data,
    width: '520px',
    maxWidth: '94vw',
    maxHeight: '90dvh',
  });
  return firstValueFrom(ref.afterClosed());
}
