import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/application/auth.service';
import { AuthProvider, AuthUser } from '../../core/domain';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly provider = inject(AuthProvider);
  private readonly router = inject(Router);
  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly allowGuest = environment.allowGuest;

  protected readonly features = [
    { icon: 'picture_as_pdf', text: 'PDF e EPUB no mesmo lugar' },
    { icon: 'ink_highlighter', text: 'Destaques em várias cores' },
    { icon: 'mic', text: 'Comentários com áudio e emojis' },
    { icon: 'bookmarks', text: 'Marcadores coloridos de página' },
  ];

  constructor() {
    afterNextRender(() => {
      this.provider
        .renderButton(this.googleButton().nativeElement, (user) => this.enter(user))
        .catch((error: Error) => this.error.set(error.message))
        .finally(() => this.loading.set(false));
    });
  }

  protected enterAsGuest(): void {
    this.auth.signInAsGuest();
    void this.router.navigateByUrl('/biblioteca');
  }

  private enter(user: AuthUser): void {
    this.auth.signIn(user);
    void this.router.navigateByUrl('/biblioteca');
  }
}
