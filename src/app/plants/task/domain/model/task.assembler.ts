import { Task } from './task.entity';

export class TaskAssembler {

  /**
   * Convierte un recurso de datos crudos a una instancia de Task.
   */
  public static toEntityFromResource(resource: any): Task {
    const task = new Task();
    task.id = resource.id;
    task.description = resource.description;
    task.due_date = resource.dueDate || resource.due_date || '';
    task.field = resource.fieldId ?? resource.field_id ?? null as any;
    (task as any).fieldId = resource.fieldId ?? resource.field_id ?? null;
    return task;
  }

  /**
   * Convierte un array de recursos directamente a un array de Tasks.
   */
  public static toEntitiesFromResponse(response: any[]): Task[] {
    return response.map(resource => this.toEntityFromResource(resource));
  }
}
