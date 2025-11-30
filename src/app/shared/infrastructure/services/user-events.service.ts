import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserEventsService {
  private userNameChangedSubject = new Subject<{oldName: string; newName: string}>();
  userNameChanged$: Observable<{oldName: string; newName: string}> = this.userNameChangedSubject.asObservable();

  private userLocationChangedSubject = new Subject<{location: string; isPublic: boolean}>();
  userLocationChanged$: Observable<{location: string; isPublic: boolean}> = this.userLocationChangedSubject.asObservable();

  emitUserNameChanged(payload: {oldName: string; newName: string}) {
    this.userNameChangedSubject.next(payload);
  }

  emitUserLocationChanged(payload: {location: string; isPublic: boolean}) {
    this.userLocationChangedSubject.next(payload);
  }
}
