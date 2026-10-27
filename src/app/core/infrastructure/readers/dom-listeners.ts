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

export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
