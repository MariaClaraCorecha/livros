import { DOCUMENT, inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthProvider, AuthUser } from '../../domain';

interface GoogleIdentity {
  initialize(config: object): void;
  renderButton(host: HTMLElement, options: object): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

interface GoogleIdToken {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

/** Login com Google Identity Services (botão oficial + ID token JWT). */
@Injectable()
export class GoogleAuthProvider extends AuthProvider {
  private readonly document = inject(DOCUMENT);
  private readonly clientId = environment.googleClientId;
  private script?: Promise<GoogleIdentity>;

  get configured(): boolean {
    return !!this.clientId;
  }

  async renderButton(host: HTMLElement, onSignIn: (user: AuthUser) => void): Promise<void> {
    if (!this.configured) {
      throw new Error('Defina googleClientId em src/environments para habilitar o login com Google.');
    }
    const identity = await this.loadIdentity();
    identity.initialize({
      client_id: this.clientId,
      callback: ({ credential }: { credential: string }) => onSignIn(this.toUser(credential)),
      ux_mode: 'popup',
    });
    identity.renderButton(host, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      locale: 'pt-BR',
      width: 280,
    });
  }

  signOut(): void {
    this.document.defaultView?.google?.accounts.id.disableAutoSelect();
  }

  private loadIdentity(): Promise<GoogleIdentity> {
    this.script ??= new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = GIS_SCRIPT;
      script.async = true;
      script.onload = () => resolve(this.document.defaultView!.google!.accounts.id);
      script.onerror = () => {
        this.script = undefined;
        reject(new Error('Não foi possível carregar o login do Google. Verifique sua conexão.'));
      };
      this.document.head.appendChild(script);
    });
    return this.script;
  }

  private toUser(credential: string): AuthUser {
    const token = decodeJwtPayload<GoogleIdToken>(credential);
    return { id: token.sub, name: token.name, email: token.email, picture: token.picture, provider: 'google' };
  }
}

function decodeJwtPayload<T>(jwt: string): T {
  const base64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
