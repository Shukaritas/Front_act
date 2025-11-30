import { Component, inject, signal, OnInit, PLATFORM_ID, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../../infrastructure/services/sidebar.service';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../../../plants/profile/services/profile.services';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../../../../plants/profile/domain/model/profile.entity';
import { UserEventsService } from '../../../infrastructure/services/user-events.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, MatIcon, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private userService = inject(UserService);
  private userEventsService = inject(UserEventsService);
  private platformId = inject(PLATFORM_ID);
  private locationSubscription?: Subscription;

  isCollapsed = this.sidebarService.isCollapsed;
  isMobile = this.sidebarService.isMobile;

  // Señal para ubicación dinámica
  userLocation = signal<string>('');
  isLocationPublic = signal<boolean>(true);
  currentUser = signal<User | null>(null);

  menuItems = [
    { label: 'SIDEBAR.DASHBOARD', route: '/dashboard', icon: 'dashboard' },
    { label: 'SIDEBAR.MY_CROPS', route: '/my-crops', icon: 'grass' },
    { label: 'SIDEBAR.MY_FIELDS', route: '/my-fields', icon: 'agriculture' },
    { label: 'SIDEBAR.MY_TASKS', route: '/my-tasks', icon: 'task_alt' },
    { label: 'SIDEBAR.COMMUNITY', route: '/community', icon: 'groups' }
  ];

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const storedId = localStorage.getItem('userId');
    if (!storedId) return;
    const numericId = parseInt(storedId, 10);
    if (isNaN(numericId)) return;

    this.userService.getUserById(numericId).subscribe({
      next: (userData) => {
        this.currentUser.set(userData);
        const loc = (userData.location || '').trim();
        this.userLocation.set(loc.length > 0 ? loc : 'Desconocido');
        this.isLocationPublic.set(userData.isLocationPublic ?? true);
      },
      error: (err) => {
        console.error('Error obteniendo usuario para sidebar', err);
        this.userLocation.set('Desconocido');
      }
    });

    this.locationSubscription = this.userEventsService.userLocationChanged$.subscribe({
      next: (payload) => {
        this.userLocation.set(payload.location.trim() || 'Desconocido');
        this.isLocationPublic.set(payload.isPublic);
      }
    });
  }

  ngOnDestroy() {
    this.locationSubscription?.unsubscribe();
  }
}
