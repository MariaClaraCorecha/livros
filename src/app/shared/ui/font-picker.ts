import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  input,
  output,
} from '@angular/core';
import { READER_FONTS, READER_FONTS_STYLESHEET, ReaderFont } from '../../core/domain';
import { ensureStylesheet } from '../utils/stylesheet';

/** Grade de fontes de leitura, cada opção desenhada na própria fonte. */
@Component({
  selector: 'app-font-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './font-picker.html',
  host: { role: 'radiogroup', 'aria-label': 'Fonte de leitura', '[class.compact]': 'compact()' },
  styleUrl: './font-picker.scss',
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
