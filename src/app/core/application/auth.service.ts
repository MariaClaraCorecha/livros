import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthProvider, AuthUser } from '../domain';

const SESSION_KEY = 'leitor.session';

/** Mantém a sessão do usuário (persistida no localStorage). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly provider = inject(AuthProvider);
  private readonly current = signal<AuthUser | null>(restoreSession());

  readonly user = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);

  signIn(user: AuthUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.current.set(user);
  }

  signInAsGuest(): void {
    this.signIn({
      id: 'guest',
      name: 'Leitor Convidado',
      email: 'convidado@local',
      provider: 'guest',
    });
  }

  signOut(): void {
    this.provider.signOut();
    localStorage.removeItem(SESSION_KEY);
    this.current.set(null);
  }
}

function restoreSession(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}
