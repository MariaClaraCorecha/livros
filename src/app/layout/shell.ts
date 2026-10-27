import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/application/auth.service';
import { ProfileService } from '../core/application/profile.service';
import { ColorScheme } from '../core/domain';
import { UserAvatar } from '../shared/ui/user-avatar';

const NEXT_SCHEME: Record<ColorScheme, ColorScheme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};
const SCHEME_ICON: Record<ColorScheme, string> = {
  system: 'brightness_auto',
  light: 'light_mode',
  dark: 'dark_mode',
};

/** Layout das áreas logadas: barra superior no desktop e navegação inferior no celular. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    UserAvatar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly profiles = inject(ProfileService);
  protected readonly user = this.auth.user;
  protected readonly scheme = computed(() => this.profiles.profile()?.scheme ?? 'system');
  protected readonly schemeIcon = computed(() => SCHEME_ICON[this.scheme()]);

  protected readonly links = [
    { path: '/biblioteca', label: 'Biblioteca', icon: 'local_library' },
    { path: '/perfil', label: 'Perfil', icon: 'person' },
  ];

  protected cycleScheme(): void {
    void this.profiles.update({ scheme: NEXT_SCHEME[this.scheme()] });
  }

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/login');
  }
}
