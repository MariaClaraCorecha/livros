import { DOCUMENT, effect, inject, Injectable } from '@angular/core';
import { PALETTES } from '../domain';
import { ProfileService } from './profile.service';

/** Aplica paleta e esquema de cores do perfil no elemento <html>. */
@Injectable({ providedIn: 'root' })
export class AppearanceService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly profile = inject(ProfileService).profile;

  constructor() {
    effect(() => {
      const { palette = 'sage', scheme = 'system' } = this.profile() ?? {};
      PALETTES.forEach(({ id }) => this.root.classList.toggle(`palette-${id}`, id === palette));
      this.root.style.colorScheme = scheme === 'system' ? 'light dark' : scheme;
    });
  }
}
