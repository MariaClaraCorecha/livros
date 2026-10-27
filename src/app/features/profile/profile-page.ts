import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/application/auth.service';
import { LibraryService } from '../../core/application/library.service';
import { ProfileService } from '../../core/application/profile.service';
import { ReadingStats, StatsService } from '../../core/application/stats.service';
import {
  AVATAR_RINGS,
  ColorOption,
  ColorScheme,
  LINE_HEIGHTS,
  PageAnimation,
  PALETTES,
  PaletteId,
  ReaderFont,
  readerFont,
  ReaderTheme,
} from '../../core/domain';
import { FontPicker } from '../../shared/ui/font-picker';
import { ColorSwatches } from '../../shared/ui/color-swatches';
import { UserAvatar } from '../../shared/ui/user-avatar';
import { cropSquare, resizeImage } from '../../shared/utils/image';

@Component({
  selector: 'app-profile-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSliderModule,
    ColorSwatches,
    FontPicker,
    UserAvatar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly profiles = inject(ProfileService);
  private readonly stats = inject(StatsService);
  private readonly library = inject(LibraryService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly user = inject(AuthService).user;
  protected readonly profile = this.profiles.profile;
  protected readonly avatar = this.profiles.avatar;
  protected readonly palettes = PALETTES;
  protected readonly rings: ColorOption[] = AVATAR_RINGS.map((hex, index) => ({
    id: hex,
    label: `Moldura ${index + 1}`,
    hex,
  }));
  protected readonly lineHeights = LINE_HEIGHTS;
  protected readonly previewFont = computed(
    () => readerFont(this.profile()?.reader.font ?? 'literata').family,
  );
  protected readonly readerThemes: { id: ReaderTheme; label: string }[] = [
    { id: 'paper', label: 'Papel' },
    { id: 'sepia', label: 'Sépia' },
    { id: 'night', label: 'Noturno' },
  ];
  protected readonly readingStats = signal<ReadingStats | null>(null);
  protected readonly paletteLabel = computed(
    () => PALETTES.find((palette) => palette.id === this.profile()?.palette)?.label ?? '',
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(60)]],
    bio: ['', Validators.maxLength(160)],
  });

  constructor() {
    effect(() => {
      const profile = this.profile();
      if (profile && this.form.pristine) {
        this.form.reset({ displayName: profile.displayName, bio: profile.bio });
      }
    });
    effect(() => {
      this.library.library();
      void this.stats.load().then((stats) => this.readingStats.set(stats));
    });
  }

  protected async saveInfo(): Promise<void> {
    if (this.form.invalid) return;
    const { displayName, bio } = this.form.getRawValue();
    await this.profiles.update({ displayName: displayName.trim(), bio: bio.trim() });
    this.form.markAsPristine();
    this.snackBar.open('Perfil atualizado.');
  }

  protected async onAvatarSelected(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    try {
      await this.profiles.update({ avatar: await cropSquare(await resizeImage(url, 512)) });
    } catch {
      this.snackBar.open('Não foi possível usar esta imagem.', 'OK');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  protected resetAvatar(): void {
    void this.profiles.update({ avatar: undefined });
  }

  protected setRing(avatarRing: string): void {
    void this.profiles.update({ avatarRing });
  }

  protected setPalette(palette: PaletteId): void {
    void this.profiles.update({ palette });
  }

  protected setScheme(scheme: ColorScheme): void {
    void this.profiles.update({ scheme });
  }

  protected setReaderTheme(theme: ReaderTheme): void {
    void this.profiles.updateReader({ theme });
  }

  protected setReaderFont(font: ReaderFont): void {
    void this.profiles.updateReader({ font });
  }

  protected setLineHeight(lineHeight: number): void {
    void this.profiles.updateReader({ lineHeight });
  }

  protected setPageAnimation(pageAnimation: PageAnimation): void {
    void this.profiles.updateReader({ pageAnimation });
  }

  protected setFontSize(fontSize: number): void {
    void this.profiles.updateReader({ fontSize });
  }
}
