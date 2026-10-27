import { booleanAttribute, ChangeDetectionStrategy, Component, DOCUMENT, inject, input, output } from '@angular/core';
import { READER_FONTS, READER_FONTS_STYLESHEET, ReaderFont } from '../../core/domain';
import { ensureStylesheet } from '../utils/stylesheet';

/** Grade de fontes de leitura, cada opção desenhada na própria fonte. */
@Component({
  selector: 'app-font-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (font of fonts; track font.id) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="font.id === selected()"
        [style.font-family]="font.family"
        (click)="selectedChange.emit(font.id)"
      >
        <span class="sample">Aa</span>
        <span class="name">{{ font.label }}</span>
        @if (!compact()) {
          <span class="hint">{{ font.hint }}</span>
        }
      </button>
    }
  `,
  host: { role: 'radiogroup', 'aria-label': 'Fonte de leitura', '[class.compact]': 'compact()' },
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
      gap: 8px;
    }
    :host(.compact) {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    button {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1.5px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface);
      text-align: start;
      cursor: pointer;
      transition: border-color 120ms ease, background 120ms ease;
    }
    button:hover,
    button:focus-visible {
      background: var(--mat-sys-surface-container-high);
      outline: none;
    }
    button[aria-checked='true'] {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .sample {
      font-size: 24px;
      line-height: 1.1;
    }
    :host(.compact) .sample {
      font-size: 18px;
    }
    .name {
      font-size: 14px;
      font-weight: 600;
    }
    .hint {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
    :host(.compact) button {
      flex-direction: row;
      align-items: baseline;
      gap: 8px;
      padding: 8px 10px;
    }
  `,
})
export class FontPicker {
  readonly selected = input<ReaderFont>();
  readonly compact = input(false, { transform: booleanAttribute });
  readonly selectedChange = output<ReaderFont>();
  protected readonly fonts = READER_FONTS;

  constructor() {
    ensureStylesheet(inject(DOCUMENT), READER_FONTS_STYLESHEET);
  }
}
