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
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule, PercentPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = book();
    <a class="cover" [routerLink]="['/ler', item.id]" [attr.aria-label]="'Abrir ' + item.title">
      @if (item.cover) {
        <img [src]="item.cover" alt="" loading="lazy" />
      } @else {
        <div class="placeholder" [attr.data-format]="item.format">
          <mat-icon>{{ item.format === 'pdf' ? 'picture_as_pdf' : 'menu_book' }}</mat-icon>
          <span>{{ item.title }}</span>
        </div>
      }
      <span class="format">{{ item.format }}</span>
      @if (item.progress >= 0.98) {
        <span class="done"><mat-icon>check</mat-icon></span>
      }
    </a>

    <div class="info">
      <div class="text">
        <h3 [title]="item.title">{{ item.title }}</h3>
        <p class="muted">{{ item.author }}</p>
        @if (memberOf().length) {
          <div class="tags">
            @for (shelf of memberOf(); track shelf.id) {
              <span class="tag" [style.--shelf]="shelf.color" [title]="shelf.name">{{ shelf.emoji }}</span>
            }
          </div>
        }
      </div>
      <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Opções do livro">
        <mat-icon>more_vert</mat-icon>
      </button>
    </div>

    <div class="progress">
      <mat-progress-bar mode="determinate" [value]="item.progress * 100" />
      <span>{{ item.progress | percent }}</span>
    </div>

    <mat-menu #menu xPosition="before">
      <a mat-menu-item [routerLink]="['/ler', item.id]"><mat-icon>chrome_reader_mode</mat-icon>Abrir</a>
      <button mat-menu-item [matMenuTriggerFor]="shelfMenu"><mat-icon>collections_bookmark</mat-icon>Bibliotecas</button>
      <button mat-menu-item disabled>
        <mat-icon>description</mat-icon>{{ item.size / 1048576 | number: '1.1-1' }} MB
      </button>
      <button mat-menu-item (click)="remove.emit(item)"><mat-icon>delete</mat-icon>Remover</button>
    </mat-menu>

    <mat-menu #shelfMenu>
      @for (shelf of shelves(); track shelf.id) {
        <button mat-menu-item (click)="toggleShelf.emit({ book: item, shelfId: shelf.id }); $event.stopPropagation()">
          <mat-icon [class.filled]="isMember(shelf.id)">{{ isMember(shelf.id) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
          {{ shelf.emoji }} {{ shelf.name }}
        </button>
      }
      <button mat-menu-item (click)="newShelf.emit(item)"><mat-icon>add</mat-icon>Nova biblioteca…</button>
    </mat-menu>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-inline-size: 0;
    }
    .cover {
      position: relative;
      display: block;
      aspect-ratio: 2 / 3;
      border-radius: 14px;
      overflow: hidden;
      background: var(--mat-sys-surface-container-high);
      box-shadow: var(--app-shadow);
      text-decoration: none;
      transition: transform 180ms ease, box-shadow 180ms ease;
    }
    .cover:hover,
    .cover:focus-visible {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px -12px rgb(0 0 0 / 0.35);
      outline: none;
    }
    img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }
    .placeholder {
      block-size: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 16px 16px;
      color: var(--mat-sys-on-tertiary-container);
      background: linear-gradient(160deg, var(--mat-sys-tertiary-container), var(--mat-sys-primary-container));
      font: 600 16px/1.3 var(--mat-sys-brand-family, serif);
      overflow-wrap: anywhere;
    }
    .format {
      position: absolute;
      inset-block-start: 10px;
      inset-inline-start: 10px;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgb(0 0 0 / 0.55);
      color: #fff;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      backdrop-filter: blur(4px);
    }
    .done {
      position: absolute;
      inset-block-start: 8px;
      inset-inline-end: 8px;
      display: grid;
      place-items: center;
      inline-size: 28px;
      block-size: 28px;
      border-radius: 50%;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .done mat-icon {
      font-size: 18px;
      inline-size: 18px;
      block-size: 18px;
    }
    .info {
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }
    .text {
      flex: 1;
      min-inline-size: 0;
    }
    h3 {
      font: var(--mat-sys-title-small);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    p {
      margin: 2px 0 0;
      font: var(--mat-sys-body-small);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    button[mat-icon-button] {
      margin-block-start: -8px;
      margin-inline-end: -8px;
    }
    .tags {
      display: flex;
      gap: 4px;
      margin-block-start: 6px;
    }
    .tag {
      display: grid;
      place-items: center;
      inline-size: 24px;
      block-size: 24px;
      border-radius: 8px;
      font-size: 13px;
      background: color-mix(in srgb, var(--shelf) 22%, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--shelf) 45%, transparent);
    }
    .progress {
      display: flex;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-progress-bar {
      border-radius: 999px;
    }
  `,
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
