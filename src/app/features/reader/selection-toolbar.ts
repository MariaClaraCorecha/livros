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
  templateUrl: './selection-toolbar.html',
  host: {
    role: 'toolbar',
    'aria-label': 'Ações da seleção',
    '[class.expanded]': 'expanded()',
    '[style.top.px]': 'placement().top',
    '[style.left.px]': 'placement().left',
    '(mousedown)': '$event.preventDefault()',
  },
  styleUrl: './selection-toolbar.scss',
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
    const top =
      above > MARGIN ? above : Math.min(anchor.bottom + MARGIN, innerHeight - height - MARGIN);
    const left = anchor.left + anchor.width / 2 - WIDTH / 2;
    return {
      top,
      left: Math.min(Math.max(left, MARGIN), Math.max(MARGIN, innerWidth - WIDTH - MARGIN)),
    };
  });
}
