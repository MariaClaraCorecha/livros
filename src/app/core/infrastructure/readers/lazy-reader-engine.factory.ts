import { Injectable } from '@angular/core';
import { BookFormat, ReaderEngine, ReaderEngineFactory } from '../../domain';

/** Carrega o motor do formato apenas quando um livro é aberto (PDF.js/epub.js ficam em chunks separados). */
@Injectable()
export class LazyReaderEngineFactory extends ReaderEngineFactory {
  async create(format: BookFormat): Promise<ReaderEngine> {
    if (format === 'pdf') {
      const { PdfReaderEngine } = await import('./pdf-reader.engine');
      return new PdfReaderEngine();
    }
    const { EpubReaderEngine } = await import('./epub-reader.engine');
    return new EpubReaderEngine();
  }
}
