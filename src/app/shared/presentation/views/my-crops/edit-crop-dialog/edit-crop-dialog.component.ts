import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface EditCropDialogData {
  title: string;
  status: string;
}

@Component({
  selector: 'app-edit-crop-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslatePipe,
    MatSnackBarModule
  ],
  templateUrl: './edit-crop-dialog.component.html',
  styleUrls: ['./edit-crop-dialog.component.css']
})
export class EditCropDialogComponent {
  data: EditCropDialogData;

  statuses: string[] = ['Healthy', 'Attention', 'Critical'];

  constructor(
    public dialogRef: MatDialogRef<EditCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public injectedData: EditCropDialogData,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {
    this.data = { ...injectedData };
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

  onSave(): void {
    if (!this.data.title || !this.data.title.trim()) {
      this.showNotification('CROPS.NAME_REQUIRED');
      return;
    }

    if (!this.data.status) {
      this.showNotification('CROPS.STATUS_REQUIRED');
      return;
    }


    this.dialogRef.close(this.data);
  }
}

