import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import {
  AuthUser,
  createDefaultProfile,
  normalizeProfile,
  ProfileRepository,
  ReaderPreferences,
  UserProfile,
} from '../domain';
import { AuthService } from './auth.service';

/** Perfil e preferências visuais do usuário logado. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly repository = inject(ProfileRepository);
  private readonly auth = inject(AuthService);
  private readonly current = signal<UserProfile | null>(null);

  readonly profile = this.current.asReadonly();
  readonly avatar = computed(() => this.current()?.avatar ?? this.auth.user()?.picture);
  readonly displayName = computed(() => this.current()?.displayName || this.auth.user()?.name || '');

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => void this.load(user));
    });
  }

  async update(changes: Partial<Omit<UserProfile, 'userId'>>): Promise<void> {
    const profile = this.current();
    if (!profile) return;
    const next = { ...profile, ...changes };
    this.current.set(next);
    await this.repository.save(next);
  }

  updateReader(changes: Partial<ReaderPreferences>): Promise<void> {
    const reader = this.current()?.reader;
    return reader ? this.update({ reader: { ...reader, ...changes } }) : Promise.resolve();
  }

  private async load(user: AuthUser | null): Promise<void> {
    if (!user) {
      this.current.set(null);
      return;
    }
    const stored = await this.repository.get(user.id);
    this.current.set(stored ? normalizeProfile(stored) : createDefaultProfile(user));
  }
}
