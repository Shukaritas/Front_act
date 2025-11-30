import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, forkJoin, switchMap, of, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Crop } from '../../../../plants/crop/domain/model/crop.entity';
import { CropService } from '../../../../plants/crop/services/crop.services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CropFormComponent } from './my-crops-form/my-crops-form.component';
import { EditCropDialogComponent, EditCropDialogData } from './edit-crop-dialog/edit-crop-dialog.component';
import { enviroment } from '../../../../../enviroment/enviroment';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface Field {
  id: number;
  name: string;
  crop: string;
  product: string;
  planting_date: string;
  expecting_harvest: string;
}

@Component({
  selector: 'app-my-crops',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    CropFormComponent,
    TranslatePipe,
    MatSnackBarModule
  ],
  templateUrl: './my-crops.component.html',
  styleUrls: ['./my-crops.component.css']
})
export class MyCropsComponent implements OnInit {
  private cropsSubject = new BehaviorSubject<Crop[]>([]);
  public crops$: Observable<Crop[]> = this.cropsSubject.asObservable();
  public showNewCropForm = false;
  private baseUrl = enviroment.BASE_URL;

  constructor(
    private cropService: CropService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadCropsWithFields();
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

  private loadCropsWithFields(): void {

    if (!isPlatformBrowser(this.platformId)) {
      this.cropsSubject.next([]);
      return;
    }

    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : null;
    if (!userId) {
      console.error('No userId en sesión');
      this.cropsSubject.next([]);
      return;
    }

    this.http.get<any[]>(`${this.baseUrl}/fields/user/${userId}`).pipe(
      switchMap(fields => {
        if (!fields || fields.length === 0) return of([]);
        const requests = fields.map(field =>
          this.cropService.getCropByFieldId(field.id).pipe(
            map(crop => {
              if (!crop) return null;
              return { ...crop, field: field.name } as Crop;
            })
          )
        );
        return forkJoin(requests).pipe(
          map(results => results.filter(c => c !== null) as Crop[])
        );
      })
    ).subscribe({
      next: (cropsConField: Crop[]) => {
        this.cropsSubject.next(cropsConField);
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando cultivos:', err);
        this.cropsSubject.next([]);
        this.cdr.detectChanges();
      }
    });
  }

  private reloadCrops(): void { this.loadCropsWithFields(); }

  handleCropCreated(): void {
    this.showNewCropForm = false;
    this.reloadCrops();
  }

  editCrop(crop: Crop, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(EditCropDialogComponent, {
      width: '450px',
      data: {
        title: crop.title,
        status: crop.status
      } as EditCropDialogData
    });

    dialogRef.afterClosed().subscribe(result => {

      if (!result) return;


      const updatedCrop: Crop = {
        id: crop.id,
        title: result.title.trim(),
        planting_date: crop.planting_date,
        harvest_date: crop.harvest_date,
        field: crop.field || '',
        status: result.status,
        days: crop.days || '0',
        soilType: crop.soilType,
        sunlight: crop.sunlight,
        watering: crop.watering
      };

      // Llamada al servicio para actualizar el cultivo
      this.cropService.updateCrop(updatedCrop).subscribe({
        next: () => {
          const currentCrops = this.cropsSubject.getValue();
          const updatedList = currentCrops.map(c =>
            c.id === crop.id
              ? { ...c, title: result.title.trim(), status: result.status } // Solo actualizar lo que cambió
              : c
          );
          this.cropsSubject.next(updatedList);
          this.cdr.detectChanges();
          this.showNotification('CROPS.UPDATE_SUCCESS');
        },
        error: err => {
          console.error('Error actualizando cultivo:', err);
          this.showNotification('CROPS.UPDATE_ERROR');
        }
      });
    });
  }

  deleteCrop(id: number, event: Event): void {
    event.stopPropagation();

    this.translate.get('CROPS.DELETE_CONFIRM').subscribe(message => {
      if (!confirm(message)) return;

      this.cropService.deleteCrop(id).subscribe({
        next: () => {
          const updatedCrops = this.cropsSubject.getValue().filter(crop => crop.id !== id);
          this.cropsSubject.next(updatedCrops);
          this.cdr.detectChanges();
          this.showNotification('CROPS.DELETE_SUCCESS');
        },
        error: err => {
          console.error(`Error eliminando cultivo ${id}:`, err);
          this.showNotification('CROPS.DELETE_ERROR');
        }
      });
    });
  }
}
