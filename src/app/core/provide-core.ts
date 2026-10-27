import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { AppearanceService } from './application/appearance.service';
import {
  AnnotationRepository,
  AuthProvider,
  BookMetadataReader,
  BookRepository,
  ProfileRepository,
  ReaderEngineFactory,
  ShelfRepository,
} from './domain';
import { GoogleAuthProvider } from './infrastructure/auth/google-auth.provider';
import { DocumentMetadataReader } from './infrastructure/documents/document-metadata.reader';
import {
  IdbAnnotationRepository,
  IdbBookRepository,
  IdbProfileRepository,
  IdbShelfRepository,
} from './infrastructure/persistence/idb-repositories';
import { LazyReaderEngineFactory } from './infrastructure/readers/lazy-reader-engine.factory';

/** Composition root: liga as portas do domínio às implementações de infraestrutura. */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: BookRepository, useClass: IdbBookRepository },
    { provide: AnnotationRepository, useClass: IdbAnnotationRepository },
    { provide: ProfileRepository, useClass: IdbProfileRepository },
    { provide: ShelfRepository, useClass: IdbShelfRepository },
    { provide: AuthProvider, useClass: GoogleAuthProvider },
    { provide: BookMetadataReader, useClass: DocumentMetadataReader },
    { provide: ReaderEngineFactory, useClass: LazyReaderEngineFactory },
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
      inject(AppearanceService);
    }),
  ]);
}
