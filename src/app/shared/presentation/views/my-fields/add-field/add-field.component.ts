import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FieldService } from '../../../../../plants/field/services/field.services';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-field',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, TranslatePipe, MatSnackBarModule],
  templateUrl: './add-field.component.html',
  styleUrls: ['./add-field.component.css']
})
export class AddFieldComponent {
  fieldName: string = '';
  location: string = '';
  fieldSize: string = '';
  imageFile: File | null = null;
  imageUrl: string | ArrayBuffer | null = 'https://images.unsplash.com/photo-1563252523-99321318e32a?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  isUploading: boolean = false;
  private defaultImageUrl = 'https://images.unsplash.com/photo-1563252523-99321318e32a?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  constructor(
    private fieldService: FieldService,
    private router: Router,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private showNotification(key: string, duration: number = 3000) {
    this.translate.get([key, 'NOTIFICATIONS.CLOSE']).subscribe(translations => {
      this.snackBar.open(translations[key], translations['NOTIFICATIONS.CLOSE'], {
        duration,
        verticalPosition: 'bottom',
        horizontalPosition: 'center'
      });
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  /**
   * Convierte un archivo a formato Base64 (Data URL)
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Error al leer el archivo como Base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async onSave() {
    if (!this.fieldName || !this.location || !this.fieldSize) {
      this.showNotification('FIELDS.CREATE_FORM_INCOMPLETE');
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) {
      this.showNotification('FIELDS.CREATE_USER_NOT_AUTH');
      this.router.navigate(['/login']);
      return;
    }
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      this.showNotification('FIELDS.CREATE_INVALID_USER');
      this.router.navigate(['/login']);
      return;
    }

    this.isUploading = true;

    try {

      let imageBase64: string;
      if (this.imageFile) {
        imageBase64 = await this.fileToBase64(this.imageFile);
      } else {
        imageBase64 = this.defaultImageUrl;
      }


      const newField = {
        userId: userId,
        imageUrl: imageBase64,
        name: this.fieldName,
        location: this.location,
        fieldSize: this.fieldSize
      };


      this.fieldService.createField(newField).subscribe({
        next: () => {
          this.isUploading = false;
          this.showNotification('FIELDS.CREATE_SUCCESS');
          this.router.navigate(['/my-fields']);
        },
        error: (err) => {
          console.error('Error al crear campo:', err);
          this.isUploading = false;
          if (err.status === 400) {
            this.showNotification('FIELDS.CREATE_INVALID_DATA');
          } else {
            this.showNotification('FIELDS.CREATE_ERROR');
          }
        }
      });
    } catch (error) {
      console.error('Error al convertir imagen a Base64:', error);
      this.isUploading = false;
      this.showNotification('FIELDS.IMAGE_ERROR');
    }
  }
}
