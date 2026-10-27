/** Retângulo normalizado (0–1) relativo às dimensões da página. */
export interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Endereço de um ponto ou trecho dentro de um documento, independente do formato. */
export type Locator =
  | { kind: 'pdf'; page: number; rects?: NormalizedRect[] }
  | { kind: 'epub'; cfi: string };

/** Posição exibível de um locator: progresso (0–1) e rótulo legível. */
export interface LocatorPlacement {
  locator: Locator;
  position: number;
  label: string;
}
