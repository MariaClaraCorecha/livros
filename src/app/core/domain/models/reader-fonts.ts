export type ReaderFont =
  | 'literata'
  | 'serif'
  | 'merriweather'
  | 'lora'
  | 'source-serif'
  | 'sans'
  | 'inter'
  | 'nunito'
  | 'lexend'
  | 'atkinson';

export interface ReaderFontOption {
  id: ReaderFont;
  label: string;
  hint: string;
  family: string;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const READER_FONTS: readonly ReaderFontOption[] = [
  { id: 'literata', label: 'Literata', hint: 'Feita para e-books', family: `Literata, ${SERIF}` },
  { id: 'serif', label: 'Georgia', hint: 'Clássica', family: SERIF },
  { id: 'merriweather', label: 'Merriweather', hint: 'Robusta', family: `Merriweather, ${SERIF}` },
  { id: 'lora', label: 'Lora', hint: 'Elegante', family: `Lora, ${SERIF}` },
  { id: 'source-serif', label: 'Source Serif', hint: 'Editorial', family: `"Source Serif 4", ${SERIF}` },
  { id: 'sans', label: 'Sistema', hint: 'Sem serifa', family: SANS },
  { id: 'inter', label: 'Inter', hint: 'Moderna', family: `Inter, ${SANS}` },
  { id: 'nunito', label: 'Nunito', hint: 'Arredondada', family: `Nunito, ${SANS}` },
  { id: 'lexend', label: 'Lexend', hint: 'Leitura fluida', family: `Lexend, ${SANS}` },
  { id: 'atkinson', label: 'Atkinson', hint: 'Alta legibilidade', family: `"Atkinson Hyperlegible", ${SANS}` },
];

/** Uma única folha do Google Fonts: o navegador só baixa os arquivos das fontes realmente usadas. */
export const READER_FONTS_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400' +
  '&family=Inter:wght@400;600&family=Lexend:wght@400;600' +
  '&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400' +
  '&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400' +
  '&family=Nunito:ital,wght@0,400;0,700;1,400' +
  '&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400' +
  '&display=swap';

export const readerFont = (id: string): ReaderFontOption =>
  READER_FONTS.find((font) => font.id === id) ?? READER_FONTS[0];

export const LINE_HEIGHTS: readonly { value: number; label: string }[] = [
  { value: 1.4, label: 'Compacto' },
  { value: 1.6, label: 'Normal' },
  { value: 1.85, label: 'Amplo' },
  { value: 2.1, label: 'Extra' },
];
