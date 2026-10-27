import { ColorOption } from './colors';

/** Biblioteca (estante) criada pelo usuário para agrupar livros por categoria. */
export interface Shelf {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  /** Nome de um ícone do Material Symbols. */
  icon: string;
  color: string;
  createdAt: number;
}

export type ShelfDraft = Pick<Shelf, 'name' | 'description' | 'icon' | 'color'>;

export const SHELF_COLORS: readonly ColorOption[] = [
  { id: '#4c7a5a', label: 'Sálvia', hex: '#4c7a5a' },
  { id: '#3a6e9a', label: 'Oceano', hex: '#3a6e9a' },
  { id: '#7562a8', label: 'Lavanda', hex: '#7562a8' },
  { id: '#a4566c', label: 'Rosé', hex: '#a4566c' },
  { id: '#c0703a', label: 'Terracota', hex: '#c0703a' },
  { id: '#b8912c', label: 'Mostarda', hex: '#b8912c' },
  { id: '#3f8a86', label: 'Turquesa', hex: '#3f8a86' },
  { id: '#6b6259', label: 'Café', hex: '#6b6259' },
];

export const SHELF_ICONS: readonly string[] = [
  'auto_stories', 'menu_book', 'work', 'school', 'favorite', 'psychology', 'science', 'palette',
  'public', 'self_improvement', 'restaurant', 'savings', 'rocket_launch', 'search', 'castle', 'star',
  'history_edu', 'gavel', 'code', 'music_note', 'sports_soccer', 'theater_comedy', 'child_care', 'travel_explore',
];

/** Ícones equivalentes aos emojis usados antes nas bibliotecas (para migrar dados salvos). */
export const LEGACY_SHELF_EMOJI_ICONS: Readonly<Record<string, string>> = {
  '📚': 'auto_stories', '📖': 'menu_book', '💼': 'work', '🎓': 'school',
  '❤️': 'favorite', '🧠': 'psychology', '🔬': 'science', '🎨': 'palette',
  '🌍': 'public', '🧘': 'self_improvement', '🍳': 'restaurant', '💰': 'savings',
  '🚀': 'rocket_launch', '🔎': 'search', '🐉': 'castle', '⭐': 'star',
};
