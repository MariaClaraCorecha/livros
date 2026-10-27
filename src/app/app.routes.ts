import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Entrar · Leitura',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'ler/:id',
    canActivate: [authGuard],
    loadChildren: () => import('./features/reader/reader.routes'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: 'biblioteca', loadChildren: () => import('./features/library/library.routes') },
      { path: 'perfil', loadChildren: () => import('./features/profile/profile.routes') },
      { path: '', pathMatch: 'full', redirectTo: 'biblioteca' },
    ],
  },
  { path: '**', redirectTo: '' },
];
