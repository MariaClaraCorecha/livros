import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ColorOption } from '../../core/domain';

/** Seletor de cor em bolinhas (destaques, marcadores, paletas e moldura do avatar). */
@Component({
  selector: 'app-color-swatches',
  imports: [MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="swatches" role="radiogroup" [attr.aria-label]="label()" [class.small]="size() === 'sm'">
      @for (option of options(); track option.id) {
        <button
          type="button"
          class="swatch"
          role="radio"
          [attr.aria-checked]="option.id === selected()"
          [attr.aria-label]="option.label"
          [matTooltip]="option.label"
          [style.--swatch]="option.hex"
          (click)="selectedChange.emit(option.id)"
        >
          @if (option.id === selected()) {
            <mat-icon>check</mat-icon>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      --size: 34px;
    }
    .small {
      gap: 6px;
      --size: 26px;
    }
    .swatch {
      inline-size: var(--size);
      block-size: var(--size);
      border-radius: 50%;
      border: 2px solid color-mix(in srgb, var(--swatch) 70%, black);
      background: var(--swatch);
      display: grid;
      place-items: center;
      padding: 0;
      cursor: pointer;
      color: #1d1d1b;
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .swatch:hover,
    .swatch:focus-visible {
      transform: scale(1.12);
      outline: none;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--swatch) 40%, transparent);
    }
    .swatch[aria-checked='true'] {
      box-shadow: 0 0 0 3px var(--mat-sys-surface), 0 0 0 5px var(--swatch);
    }
    mat-icon {
      font-size: calc(var(--size) * 0.6);
      inline-size: auto;
      block-size: auto;
      mix-blend-mode: hard-light;
      color: white;
      filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.5));
    }
  `,
})
export class ColorSwatches<T extends string> {
  readonly options = input.required<readonly ColorOption<T>[]>();
  readonly selected = input<T | null | undefined>(null);
  readonly label = input('Cores');
  readonly size = input<'sm' | 'md'>('md');
  readonly selectedChange = output<T>();
}
