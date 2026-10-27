import { Highlight } from './models/annotation';
import { BookFormat, BookMetadata } from './models/book';
import { Locator, LocatorPlacement } from './models/locator';
import { AuthUser, ReaderPreferences } from './models/user';

/* Portas para serviços externos (Google, PDF.js, epub.js), implementadas na infraestrutura. */

/** O provedor de login ainda não recebeu suas credenciais (ex.: Client ID do Google). */
export class AuthNotConfiguredError extends Error {
  constructor() {
    super('O login com Google ainda não foi configurado.');
  }
}

export abstract class AuthProvider {
  /** Desenha o botão oficial de login dentro de `host` e notifica cada login concluído. */
  abstract renderButton(host: HTMLElement, onSignIn: (user: AuthUser) => void): Promise<void>;
  abstract signOut(): void;
}

export abstract class BookMetadataReader {
  abstract read(file: Blob, format: BookFormat): Promise<BookMetadata>;
}

export interface ReaderPosition extends LocatorPlacement {
  page?: number;
  totalPages?: number;
}

export interface ReaderSelection extends LocatorPlacement {
  text: string;
  /** Retângulo da seleção em coordenadas da janela, usado para posicionar menus. */
  anchor: DOMRect;
}

export type ReaderAppearance = ReaderPreferences;

export interface TocEntry {
  label: string;
  depth: number;
  locator: Locator;
}

export interface ReaderEvents {
  position(position: ReaderPosition): void;
  selection(selection: ReaderSelection | null): void;
  highlightClick(highlightId: string): void;
}

/** Motor de renderização de um formato de documento. */
export interface ReaderEngine {
  readonly supportsZoom: boolean;
  open(host: HTMLElement, file: Blob, events: ReaderEvents, start?: Locator): Promise<void>;
  goTo(locator: Locator): Promise<void>;
  goToProgress(progress: number): Promise<void>;
  /** Vai para a página `page` (1..totalPages informado em `ReaderPosition`). */
  goToPage(page: number): Promise<void>;
  next(): void;
  prev(): void;
  zoom(factor: number): void;
  tableOfContents(): Promise<TocEntry[]>;
  setHighlights(highlights: readonly Highlight[]): void;
  setAppearance(appearance: ReaderAppearance): void;
  /** Indica se o locator está na área visível atualmente. */
  isVisible(locator: Locator): boolean;
  clearSelection(): void;
  destroy(): void;
}

export abstract class ReaderEngineFactory {
  abstract create(format: BookFormat): Promise<ReaderEngine>;
}
