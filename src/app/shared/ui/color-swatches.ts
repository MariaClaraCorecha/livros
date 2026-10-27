import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ColorOption } from '../../core/domain';

/** Seletor de cor em bolinhas (destaques, marcadores, paletas e moldura do avatar). */
@Component({
  selector: 'app-color-swatches',
  imports: [MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './color-swatches.html',
  styleUrl: './color-swatches.scss',
})
export class ColorSwatches<T extends string> {
  readonly options = input.required<readonly ColorOption<T>[]>();
  readonly selected = input<T | null | undefined>(null);
  readonly label = input('Cores');
  readonly size = input<'sm' | 'md'>('md');
  readonly selectedChange = output<T>();
}
