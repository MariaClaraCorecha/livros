import { DOCUMENT, inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthNotConfiguredError, AuthProvider, AuthUser } from '../../domain';

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
const CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

/**
 * Login com Google Identity Services (botão oficial + ID token JWT).
 * O Client ID vem de `public/config.json` (editável sem recompilar) ou, na falta dele, de `environment`.
 */
@Injectable()
export class GoogleAuthProvider extends AuthProvider {
  private readonly document = inject(DOCUMENT);
  private clientId?: Promise<string>;
  private script?: Promise<GoogleIdentity>;

  async renderButton(host: HTMLElement, onSignIn: (user: AuthUser) => void): Promise<void> {
    const clientId = await this.resolveClientId();
    if (!clientId) throw new AuthNotConfiguredError();
    if (!clientId.endsWith(CLIENT_ID_SUFFIX)) {
      throw new Error(
        `O Client ID configurado parece inválido: ele deve terminar com "${CLIENT_ID_SUFFIX}".`,
      );
    }
    const identity = await this.loadIdentity();
    identity.initialize({
      client_id: clientId,
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

  private resolveClientId(): Promise<string> {
    this.clientId ??= fetch(new URL('config.json', this.document.baseURI), { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : {}))
      .then(
        (config: { googleClientId?: string }) =>
          config.googleClientId?.trim() || environment.googleClientId,
      )
      .catch(() => environment.googleClientId);
    return this.clientId;
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
    return {
      id: token.sub,
      name: token.name,
      email: token.email,
      picture: token.picture,
      provider: 'google',
    };
  }
}

function decodeJwtPayload<T>(jwt: string): T {
  const base64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
