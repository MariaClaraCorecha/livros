import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HIGHLIGHT_COLORS, HighlightColor, QUICK_HIGHLIGHT_COUNT } from '../../core/domain';

const WIDTH = 344;
const ROW_HEIGHT = 52;
const MARGIN = 8;

/** Barra flutuante exibida sobre o texto selecionado. */
@Component({
  selector: 'app-selection-toolbar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="colors" [class.expanded]="expanded()">
      @for (color of visibleColors(); track color.id) {
        <button
          type="button"
          class="dot"
          [style.--dot]="color.hex"
          [attr.aria-label]="'Destacar em ' + color.label"
          [matTooltip]="color.label"
          (click)="highlight.emit(color.id)"
        ></button>
      }
    </div>
    <span class="divider"></span>
    <button
      mat-icon-button
      [matTooltip]="expanded() ? 'Menos cores' : 'Mais cores'"
      [attr.aria-label]="expanded() ? 'Menos cores' : 'Mais cores'"
      [attr.aria-expanded]="expanded()"
      (click)="expanded.set(!expanded())"
    >
      <mat-icon>{{ expanded() ? 'unfold_less' : 'palette' }}</mat-icon>
    </button>
    <button mat-icon-button matTooltip="Comentar" aria-label="Comentar" (click)="comment.emit()">
      <mat-icon>add_comment</mat-icon>
    </button>
    <button mat-icon-button matTooltip="Copiar" aria-label="Copiar" (click)="copy.emit()">
      <mat-icon>content_copy</mat-icon>
    </button>
  `,
  host: {
    role: 'toolbar',
    'aria-label': 'Ações da seleção',
    '[class.expanded]': 'expanded()',
    '[style.top.px]': 'placement().top',
    '[style.left.px]': 'placement().left',
    '(mousedown)': '$event.preventDefault()',
  },
  styles: `
    :host {
      position: fixed;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 4px;
      inline-size: 344px;
      max-inline-size: calc(100vw - 16px);
      padding: 6px 6px 6px 14px;
      border-radius: 26px;
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      box-shadow: 0 12px 32px -8px rgb(0 0 0 / 0.45);
      animation: pop 140ms ease-out;
      --mat-icon-button-icon-color: var(--mat-sys-inverse-on-surface);
    }
    .colors {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .colors.expanded {
      display: grid;
      grid-template-columns: repeat(6, 24px);
      gap: 8px 6px;
      padding-block: 4px;
    }
    .dot {
      inline-size: 24px;
      block-size: 24px;
      border-radius: 50%;
      border: 2px solid color-mix(in srgb, var(--dot) 60%, black);
      background: var(--dot);
      padding: 0;
      cursor: pointer;
      transition: transform 100ms ease;
      animation: pop 160ms ease-out backwards;
    }
    .dot:hover,
    .dot:focus-visible {
      transform: scale(1.2);
      outline: none;
    }
    .divider {
      inline-size: 1px;
      align-self: stretch;
      margin: 6px 2px;
      background: color-mix(in srgb, currentColor 30%, transparent);
    }
    @keyframes pop {
      from {
        opacity: 0;
        scale: 0.85;
      }
    }
  `,
})
export class SelectionToolbar {
  readonly anchor = input.required<DOMRect>();
  readonly highlight = output<HighlightColor>();
  readonly comment = output<void>();
  readonly copy = output<void>();
  protected readonly expanded = signal(false);
  protected readonly visibleColors = computed(() =>
    this.expanded() ? HIGHLIGHT_COLORS : HIGHLIGHT_COLORS.slice(0, QUICK_HIGHLIGHT_COUNT),
  );

  protected readonly placement = computed(() => {
    const anchor = this.anchor();
    const height = ROW_HEIGHT * (this.expanded() ? 2 : 1);
    const above = anchor.top - height - MARGIN;
    const top = above > MARGIN ? above : Math.min(anchor.bottom + MARGIN, innerHeight - height - MARGIN);
    const left = anchor.left + anchor.width / 2 - WIDTH / 2;
    return { top, left: Math.min(Math.max(left, MARGIN), Math.max(MARGIN, innerWidth - WIDTH - MARGIN)) };
  });
}
