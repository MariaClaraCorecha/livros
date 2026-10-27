let pdfjs: Promise<typeof import('pdfjs-dist')> | undefined;

/** Carrega o PDF.js sob demanda (fora do bundle inicial) e configura o worker. */
export function loadPdfJs(): Promise<typeof import('pdfjs-dist')> {
  pdfjs ??= import('pdfjs-dist').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.mjs', document.baseURI).href;
    return lib;
  });
  return pdfjs;
}

export async function openPdf(file: Blob) {
  const lib = await loadPdfJs();
  return lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}
