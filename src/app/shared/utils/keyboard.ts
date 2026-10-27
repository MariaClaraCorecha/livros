/** O usuário está digitando num campo? (o alvo pode nem ser um elemento, ex.: `document`) */
export const isTyping = (event: KeyboardEvent): boolean =>
  event.target instanceof Element && !!event.target.closest('input, textarea, [contenteditable]');
