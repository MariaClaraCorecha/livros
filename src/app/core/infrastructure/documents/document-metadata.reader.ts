import { Injectable } from '@angular/core';
import { BookFormat, BookMetadata, BookMetadataReader } from '../../domain';
import { resizeImage } from '../../../shared/utils/image';
import { openPdf } from './pdfjs';

const COVER_WIDTH = 320;

/** Extrai título, autor e capa de arquivos PDF e EPUB. */
@Injectable()
export class DocumentMetadataReader extends BookMetadataReader {
  read(file: Blob, format: BookFormat): Promise<BookMetadata> {
    return format === 'pdf' ? this.readPdf(file) : this.readEpub(file);
  }

  private async readPdf(file: Blob): Promise<BookMetadata> {
    const pdf = await openPdf(file);
    try {
      const { info } = (await pdf.getMetadata()) as { info: { Title?: string; Author?: string } };
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: COVER_WIDTH / page.getViewport({ scale: 1 }).width });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      return {
        title: info.Title?.trim() ?? '',
        author: info.Author?.trim() ?? '',
        cover: canvas.toDataURL('image/jpeg', 0.8),
      };
    } finally {
      await pdf.loadingTask.destroy();
    }
  }

  private async readEpub(file: Blob): Promise<BookMetadata> {
    const { default: ePub } = await import('epubjs');
    const book = ePub(await file.arrayBuffer());
    try {
      await Promise.all([book.opened, book.loaded.navigation]);
      const metadata = await book.loaded.metadata;
      const coverUrl = await book.coverUrl();
      return {
        title: metadata.title?.trim() ?? '',
        author: metadata.creator?.trim() ?? '',
        cover: coverUrl ? await resizeImage(coverUrl, COVER_WIDTH) : undefined,
      };
    } finally {
      book.destroy();
    }
  }
}
