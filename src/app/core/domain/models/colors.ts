export interface ColorOption<T extends string = string> {
  id: T;
  label: string;
  hex: string;
}

export type HighlightColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'pink'
  | 'purple'
  | 'orange'
  | 'red'
  | 'teal'
  | 'lime'
  | 'indigo'
  | 'brown'
  | 'gray';
export type BookmarkColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

/** Tons pastel: legíveis sobre o texto sem cansar a vista. */
export const HIGHLIGHT_COLORS: readonly ColorOption<HighlightColor>[] = [
  { id: 'yellow', label: 'Amarelo', hex: '#f6dc74' },
  { id: 'green', label: 'Verde', hex: '#a6dca0' },
  { id: 'blue', label: 'Azul', hex: '#9ccbf0' },
  { id: 'pink', label: 'Rosa', hex: '#f3b0cc' },
  { id: 'purple', label: 'Lilás', hex: '#c9b4ef' },
  { id: 'orange', label: 'Pêssego', hex: '#f7c18b' },
  { id: 'red', label: 'Coral', hex: '#f4a29b' },
  { id: 'teal', label: 'Turquesa', hex: '#8fd8cf' },
  { id: 'lime', label: 'Lima', hex: '#d2e98b' },
  { id: 'indigo', label: 'Anil', hex: '#aab3f2' },
  { id: 'brown', label: 'Caramelo', hex: '#dfbc96' },
  { id: 'gray', label: 'Cinza', hex: '#cfcbc4' },
];

/** Quantas cores aparecem direto na barra de seleção; as demais ficam em "mais cores". */
export const QUICK_HIGHLIGHT_COUNT = 6;

/** Tons mais saturados: precisam se destacar como fitas de marcação. */
export const BOOKMARK_COLORS: readonly ColorOption<BookmarkColor>[] = [
  { id: 'red', label: 'Vermelho', hex: '#d9605f' },
  { id: 'orange', label: 'Laranja', hex: '#e48a3c' },
  { id: 'yellow', label: 'Mostarda', hex: '#d4a72c' },
  { id: 'green', label: 'Verde', hex: '#4f9d62' },
  { id: 'blue', label: 'Azul', hex: '#4a86cc' },
  { id: 'purple', label: 'Roxo', hex: '#8a6cc9' },
];

export const colorHex = <T extends string>(options: readonly ColorOption<T>[], id: T): string =>
  options.find((option) => option.id === id)?.hex ?? options[0].hex;
