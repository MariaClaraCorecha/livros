import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
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
  templateUrl: './shelf-dialog.html',
  styleUrl: './shelf-dialog.scss',
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
    if (this.form.valid && this.form.controls.name.value.trim())
      this.ref.close(this.form.getRawValue());
  }
}

export function openShelfDialog(
  dialog: MatDialog,
  initial: ShelfDraft | null = null,
): Promise<ShelfDraft | undefined> {
  const ref = dialog.open<ShelfDialog, ShelfDraft | null, ShelfDraft>(ShelfDialog, {
    data: initial,
    width: '460px',
    maxWidth: '94vw',
  });
  return firstValueFrom(ref.afterClosed());
}
