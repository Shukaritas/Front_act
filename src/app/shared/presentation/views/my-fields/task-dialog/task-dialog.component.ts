import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface TaskDialogData {
  description?: string;
  dueDate?: string;
  field?: string;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.css'],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
    MatSnackBarModule
  ]
})
export class TaskDialogComponent {
  description: string = '';
  dueDateString: string = '';
  field: string = '';

  constructor(
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData | null,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {
    if (data) {
      this.description = data.description || '';
      if (data.dueDate) {
        const parsed = new Date(data.dueDate);
        if (!isNaN(parsed.getTime())) {
          const dd = String(parsed.getDate()).padStart(2, '0');
          const mm = String(parsed.getMonth() + 1).padStart(2, '0');
          const yyyy = parsed.getFullYear();
          this.dueDateString = `${dd}/${mm}/${yyyy}`;
        }
      }
      this.field = data.field || '';
    }
  }

  private showNotification(key: string, duration: number = 3000) {
    this.translate.get([key, 'NOTIFICATIONS.CLOSE']).subscribe(translations => {
      this.snackBar.open(translations[key], translations['NOTIFICATIONS.CLOSE'], {
        duration,
        verticalPosition: 'bottom',
        horizontalPosition: 'center'
      });
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private toIso(dateStr: string): string | null {
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T00:00:00`;
  }

  onSave(): void {
    const iso = this.toIso(this.dueDateString);
    if (!iso) {
      this.showNotification('DATE.ERROR_INVALID_FORMAT');
      return;
    }
    this.dialogRef.close({
      description: this.description?.trim(),
      dueDateIso: iso,
      field: this.field
    });
  }
}
