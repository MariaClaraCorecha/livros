import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { SHELF_COLORS, SHELF_ICONS, ShelfDraft } from '../../core/domain';
import { ColorSwatches } from '../../shared/ui/color-swatches';

/** Formulário para criar ou editar uma biblioteca. */
@Component({
  selector: 'app-shelf-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ColorSwatches,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ editing ? 'Editar biblioteca' : 'Nova biblioteca' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="content">
        <div class="preview" [style.--shelf]="form.controls.color.value">
          <mat-icon class="icon">{{ form.controls.icon.value }}</mat-icon>
          <div>
            <strong>{{ form.controls.name.value || 'Nome da biblioteca' }}</strong>
            <span>{{ form.controls.description.value || 'Organize seus livros por categoria' }}</span>
          </div>
        </div>

        <mat-form-field>
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" maxlength="40" cdkFocusInitial placeholder="Ex.: Ficção científica" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Descrição (opcional)</mat-label>
          <input matInput formControlName="description" maxlength="120" />
        </mat-form-field>

        <span class="label">Ícone</span>
        <div class="icons" role="radiogroup" aria-label="Ícone">
          @for (icon of icons; track icon) {
            <button
              type="button"
              role="radio"
              [attr.aria-label]="icon"
              [attr.aria-checked]="form.controls.icon.value === icon"
              (click)="form.controls.icon.setValue(icon)"
            >
              <mat-icon [class.filled]="form.controls.icon.value === icon">{{ icon }}</mat-icon>
            </button>
          }
        </div>

        <span class="label">Cor</span>
        <app-color-swatches
          label="Cor da biblioteca"
          [options]="colors"
          [selected]="form.controls.color.value"
          (selectedChange)="form.controls.color.setValue($event)"
        />
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">{{ editing ? 'Salvar' : 'Criar' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .content {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .preview {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border-radius: 18px;
      background: color-mix(in srgb, var(--shelf) 16%, var(--mat-sys-surface-container));
      border-inline-start: 6px solid var(--shelf);
    }
    .preview .icon {
      display: grid;
      place-items: center;
      flex: none;
      inline-size: 48px;
      block-size: 48px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--shelf) 28%, transparent);
      color: var(--shelf);
      font-size: 26px;
    }
    .preview div {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }
    .preview strong {
      font: var(--mat-sys-title-medium);
      color: var(--mat-sys-on-surface);
    }
    .preview span {
      font: var(--mat-sys-body-small);
    }
    .label {
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }
    .icons {
      display: grid;
      grid-template-columns: repeat(auto-fill, 40px);
      gap: 4px;
    }
    .icons button {
      display: grid;
      place-items: center;
      inline-size: 40px;
      block-size: 40px;
      border: 1.5px solid transparent;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
    }
    .icons button[aria-checked='true'] {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
  `,
})
export class ShelfDialog {
  private readonly ref = inject(MatDialogRef<ShelfDialog, ShelfDraft>);
  private readonly initial = inject<ShelfDraft | null>(MAT_DIALOG_DATA);

  protected readonly editing = !!this.initial;
  protected readonly icons = SHELF_ICONS;
  protected readonly colors = SHELF_COLORS;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.initial?.name ?? '', [Validators.required, Validators.maxLength(40)]],
    description: [this.initial?.description ?? '', Validators.maxLength(120)],
    icon: [this.initial?.icon ?? SHELF_ICONS[0]],
    color: [this.initial?.color ?? SHELF_COLORS[0].hex],
  });

  protected save(): void {
    if (this.form.valid && this.form.controls.name.value.trim()) this.ref.close(this.form.getRawValue());
  }
}

export function openShelfDialog(dialog: MatDialog, initial: ShelfDraft | null = null): Promise<ShelfDraft | undefined> {
  const ref = dialog.open<ShelfDialog, ShelfDraft | null, ShelfDraft>(ShelfDialog, {
    data: initial,
    width: '460px',
    maxWidth: '94vw',
  });
  return firstValueFrom(ref.afterClosed());
}
