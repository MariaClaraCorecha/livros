import { ReaderFont } from './reader-fonts';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'guest';
}

export type ColorScheme = 'light' | 'dark' | 'system';
export type PaletteId = 'sage' | 'ocean' | 'lavender' | 'rose' | 'amber';
export type ReaderTheme = 'paper' | 'sepia' | 'night';
export type PageAnimation = 'slide' | 'fade' | 'none';

export interface ReaderPreferences {
  theme: ReaderTheme;
  font: ReaderFont;
  /** Tamanho da fonte em porcentagem (EPUB). */
  fontSize: number;
  /** Altura da linha (EPUB). */
  lineHeight: number;
  /** Animação ao virar a página (EPUB). */
  pageAnimation: PageAnimation;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  theme: 'paper',
  font: 'literata',
  fontSize: 100,
  lineHeight: 1.6,
  pageAnimation: 'slide',
};

export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  /** Avatar personalizado (data URL); quando ausente, usa a foto do Google. */
  avatar?: string;
  avatarRing: string;
  palette: PaletteId;
  scheme: ColorScheme;
  reader: ReaderPreferences;
}

export interface PaletteOption {
  id: PaletteId;
  label: string;
  hex: string;
}

export const PALETTES: readonly PaletteOption[] = [
  { id: 'sage', label: 'Sálvia', hex: '#4c7a5a' },
  { id: 'ocean', label: 'Oceano', hex: '#3a6e9a' },
  { id: 'lavender', label: 'Lavanda', hex: '#7562a8' },
  { id: 'rose', label: 'Rosé', hex: '#a4566c' },
  { id: 'amber', label: 'Âmbar', hex: '#9a6524' },
];

export const AVATAR_RINGS: readonly string[] = [
  '#4c7a5a',
  '#3a6e9a',
  '#7562a8',
  '#a4566c',
  '#d4a72c',
  '#e48a3c',
  '#5f6368',
];

export function createDefaultProfile(user: AuthUser): UserProfile {
  return {
    userId: user.id,
    displayName: user.name,
    bio: '',
    avatarRing: AVATAR_RINGS[0],
    palette: 'sage',
    scheme: 'system',
    reader: DEFAULT_READER_PREFERENCES,
  };
}

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** Completa perfis salvos em versões antigas com os campos novos. */
export function normalizeProfile(profile: UserProfile): UserProfile {
  return { ...profile, reader: { ...DEFAULT_READER_PREFERENCES, ...profile.reader } };
}
