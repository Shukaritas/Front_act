import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, switchMap, forkJoin, of, map, filter, catchError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { enviroment } from '../../../../../../enviroment/enviroment';
import { CropService } from '../../../../../plants/crop/services/crop.services';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditHistoryDialogComponent } from '../edit-history-dialog/edit-history-dialog.component';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { TaskService } from '../../../../../plants/services/task.services';

export interface Field {
  id: number; name: string; image_url: string; product: string; location: string;
  field_size: string; cropName: string;
  days_since_planting: string; planting_date: string;
  expecting_harvest: string; "Soil Type": string; watering: string; sunlight: string;
  status: string; progress_history: { id: number; watered: string; fertilized: string; pests: string; }[];
  tasks: { id: number; date: string; name: string; task: string; }[];
  crop?: { id?: number; crop?: string; title?: string; status?: string; plantingDate?: string; harvestDate?: string; soilType?: string; sunlight?: string; watering?: string; };
  imageUrl?: string;
  fieldSize?: string;
  progressHistoryId?: number;
}

@Component({
  selector: 'app-field-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatCheckboxModule, TranslatePipe, MatDialogModule],
  templateUrl: './field-details.component.html',
  styleUrls: ['./field-details.component.css']
})
export class FieldDetailsComponent implements OnInit {

  private fieldSubject = new BehaviorSubject<Field | null>(null);
  public field$ = this.fieldSubject.asObservable();
  private baseUrl = enviroment.BASE_URL;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cropService: CropService, private dialog: MatDialog, private translate: TranslateService, private taskService: TaskService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter((id): id is string => !!id),
      switchMap(id =>
        this.http.get<any>(`${this.baseUrl}/fields/${id}`).pipe(
          switchMap(fieldData => {
            const progressHistoryId = (fieldData as any).progressHistoryId;
            const progress$ = progressHistoryId
              ? this.http.get<any>(`${this.baseUrl}/progress/${progressHistoryId}`).pipe(catchError(() => of(null)))
              : of(null);
            const tasks$ = this.http.get<any[]>(`${this.baseUrl}/tasks/field/${fieldData.id}`).pipe(catchError(() => of([])));
            const crop$ = this.cropService.getCropByFieldId(fieldData.id).pipe(catchError(() => of(null)));
            return forkJoin({ progress: progress$, tasks: tasks$, crop: crop$ }).pipe(
              map(({ progress, tasks, crop }) => {
                const progressEntry = progress ? {
                  id: progress.id,
                  watered: progress.watered || progress.wateredDate || '',
                  fertilized: progress.fertilized || progress.fertilizedDate || '',
                  pests: progress.pests || progress.pestInspection || ''
                } : null;
                const mappedTasks = (tasks || []).map(t => ({
                  id: t.id,
                  date: t.due_date || t.dueDate || '',
                  name: fieldData.name,
                  task: t.description || t.task || t.name || ''
                }));
                const normalized: Field = {
                  ...fieldData,
                  image_url: fieldData.image_url || fieldData.imageUrl || '',
                  field_size: fieldData.field_size || fieldData.fieldSize || '',
                  product: fieldData.product || fieldData.mainProduct || '',
                  cropName: fieldData.crop || fieldData.cropName || '',
                  days_since_planting: fieldData.days_since_planting || fieldData.daysSincePlanting || '',
                  planting_date: fieldData.planting_date || fieldData.plantingDate || '',
                  expecting_harvest: fieldData.expecting_harvest || fieldData.expectingHarvest || '',
                  ["Soil Type"]: (fieldData as any)['Soil Type'] || fieldData.soilType || '',
                  watering: fieldData.watering || fieldData.wateringPlan || '',
                  sunlight: fieldData.sunlight || fieldData.sunlightExposure || '',
                  status: fieldData.status || '',
                  progress_history: progressEntry ? [progressEntry] : [],
                  tasks: mappedTasks,
                  crop: crop ? {
                    id: crop.id,
                    crop: (crop as any).crop || crop.title,
                    title: crop.title || (crop as any).crop || '',
                    status: crop.status || '',
                    plantingDate: (crop as any).plantingDate || crop.planting_date || '',
                    harvestDate: (crop as any).harvestDate || crop.harvest_date || '',
                    soilType: (crop as any).soilType || '',
                    sunlight: (crop as any).sunlight || '',
                    watering: (crop as any).watering || ''
                  } : undefined
                };

                if (normalized.crop?.harvestDate) {
                  const today = new Date(); today.setHours(0,0,0,0);
                  const harvestDate = new Date(normalized.crop.harvestDate); harvestDate.setHours(0,0,0,0);
                  if (!isNaN(harvestDate.getTime())) {
                    const diffTime = harvestDate.getTime() - today.getTime();
                    let diffDays = Math.ceil(diffTime / 86400000);
                    if (diffDays < 0) diffDays = 0;
                    normalized.days_since_planting = diffDays.toString();
                  }
                }
                return normalized;
              })
            );
          }),
          catchError(() => of(null))
        )
      )
    ).subscribe(field => this.fieldSubject.next(field));
  }

  editHistory(field: Field) {
    if (!field.progress_history || field.progress_history.length === 0) return;
    const history = field.progress_history[0];
    if (!history || history.id == null) return;

    const dialogRef = this.dialog.open(EditHistoryDialogComponent, {
      width: '400px',
      data: {
        watered: history.watered ? new Date(history.watered) : null,
        fertilized: history.fertilized ? new Date(history.fertilized) : null,
        pests: history.pests ? new Date(history.pests) : null,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const toIso = (d?: Date | null) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString() : '';
      const updatedHistoryPayload = {
        watered: toIso(result.watered) || history.watered,
        fertilized: toIso(result.fertilized) || history.fertilized,
        pests: toIso(result.pests) || history.pests
      };
      this.http.put<any>(`${this.baseUrl}/progress/${history.id}`, updatedHistoryPayload).subscribe({
        next: response => {
          const updatedEntry = {
            id: response.id || history.id,
            watered: response.watered || response.wateredDate || updatedHistoryPayload.watered,
            fertilized: response.fertilized || response.fertilizedDate || updatedHistoryPayload.fertilized,
            pests: response.pests || response.pestInspection || updatedHistoryPayload.pests
          };
          this.fieldSubject.next({ ...field, progress_history: [updatedEntry] });
        },
        error: err => console.error('Error updating progress history', err)
      });
    });
  }

  addTask(field: Field) {
    const dialogRef = this.dialog.open(TaskDialogComponent, { width: '500px', data: null });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const isoBase: string = result.dueDateIso || '';
      const dateObj: Date = isoBase ? new Date(isoBase) : new Date();
      dateObj.setHours(10,0,0,0);
      const isoDate = dateObj.toISOString().split('.')[0];
      const taskPayload = { fieldId: field.id, description: result.description, dueDate: isoDate };
      this.taskService.createTask(taskPayload).subscribe({
        next: created => {
          const newTask = {
            id: created.id,
            date: (created as any).dueDate || created.due_date || isoDate,
            name: field.name,
            task: created.description
          };
          this.fieldSubject.next({ ...field, tasks: [...field.tasks, newTask] });
        },
        error: err => console.error('Error adding task', err)
      });
    });
  }

  editTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();
    const task = field.tasks.find(t => t.id === taskId);
    const dialogRef = this.dialog.open(TaskDialogComponent, { width: '500px', data: task ? { description: task.task, dueDate: task.date } : null });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const isoBase: string = result.dueDateIso || '';
      const dateObj: Date = isoBase ? new Date(isoBase) : new Date();
      dateObj.setHours(10,0,0,0);
      const isoDate = dateObj.toISOString().split('.')[0];
      const payload = { fieldId: field.id, description: result.description, dueDate: isoDate };
      this.taskService.updateTask(taskId, payload).subscribe({
        next: updated => {
          const updatedTasks = field.tasks.map(t => t.id === taskId ? { ...t, date: (updated as any).dueDate || updated.due_date || isoDate, task: updated.description } : t);
          this.fieldSubject.next({ ...field, tasks: updatedTasks });
        },
        error: err => console.error('Error updating task', err)
      });
    });
  }

  deleteTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.fieldSubject.next({ ...field, tasks: field.tasks.filter(t => t.id !== taskId) });
      },
      error: err => console.error('Error deleting task', err)
    });
  }
}
