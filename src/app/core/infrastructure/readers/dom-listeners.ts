export { debounce } from '../../../shared/utils/debounce';

/** Agrupa listeners e callbacks de limpeza para liberar tudo de uma vez no `destroy()`. */
export class Disposables {
  private readonly items: (() => void)[] = [];

  listen<E extends Event>(
    target: EventTarget,
    type: string,
    handler: (event: E) => void,
    options?: AddEventListenerOptions,
  ): void {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, options);
    this.items.push(() => target.removeEventListener(type, listener, options));
  }

  add(dispose: () => void): void {
    this.items.push(dispose);
  }

  dispose(): void {
    this.items.splice(0).forEach((dispose) => dispose());
  }
}

/** Aplica uma animação curta de destaque (`.reader-flash`, em _reader-engines.scss). */
export function flash(elements: Iterable<Element>): void {
  for (const element of elements) {
    element.classList.remove('reader-flash');
    // Força o reinício da animação se o mesmo destaque piscar duas vezes seguidas.
    void (element as HTMLElement).getBoundingClientRect();
    element.classList.add('reader-flash');
    element.addEventListener('animationend', () => element.classList.remove('reader-flash'), {
      once: true,
    });
  }
}

export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
