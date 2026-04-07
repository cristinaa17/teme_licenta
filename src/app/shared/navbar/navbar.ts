import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UlbsService } from '../../services/ulbs';
import { AuthService } from '../../services/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private ulbs = inject(UlbsService);

  user: any = null;
  notifications: any[] = [];
  showNotifications = false;
  searchProfessor: string = '';
  isImpersonating = false;
  professors: any[] = [];

  @Input() loadThemes!: () => void;
  @Input() loadNotifications!: () => void;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    console.log('professors:', this.professors);
    console.log('filtered:', this.filteredProfessors);
    this.auth.user$.subscribe((user) => {
      this.user = user;

      if (user?.role === 'profesor') {
        this.fetchNotifications();
      }

      this.cdr.detectChanges();
    });
    this.loadProfessors();

    const originalAdmin = localStorage.getItem('original_admin');
    this.isImpersonating = !!originalAdmin;
  }

  private fetchNotifications() {
    if (!this.user?.email) return;

    this.ulbs.getNotifications(this.user.email).subscribe((res: any) => {
      this.notifications = res || [];
      this.cdr.detectChanges();
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markSeen() {
    this.notifications = [];

    this.ulbs.markNotificationsSeen(this.user.email).subscribe(() => {
      this.loadNotifications();
    });
  }

  impersonate(email: string) {
    const originalAdmin = this.auth.getUser();

    localStorage.setItem('original_admin', JSON.stringify(originalAdmin));

    this.ulbs.impersonate(email).subscribe((user: any) => {
      localStorage.setItem('user', JSON.stringify(user));

      this.isImpersonating = true;

      location.reload();
    });
  }

  loadProfessors() {
    this.ulbs.getProfessors().subscribe((res: any[]) => {
      console.log('API professors:', res);
      this.professors = res;
    });
  }

  stopImpersonation() {
    const admin = localStorage.getItem('original_admin');

    if (admin) {
      localStorage.setItem('user', admin);

      localStorage.removeItem('original_admin');

      this.isImpersonating = false;

      location.reload();
    }
  }

  get filteredProfessors() {
    if (!this.searchProfessor) return this.professors;

    return this.professors.filter((p: any) =>
      p.name.toLowerCase().includes(this.searchProfessor.toLowerCase()),
    );
  }

  logout() {
    this.auth.logout();
    this.loadThemes();
  }
}
