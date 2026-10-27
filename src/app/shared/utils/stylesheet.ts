/** Adiciona uma folha de estilo externa ao <head> uma única vez. */
export function ensureStylesheet(document: Document, href: string): void {
  if (document.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}
