import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { UlbsService } from '../../services/ulbs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AdminProfessorsTableComponent } from '../admin-professors-table/admin-professors-table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MatMenuModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    AdminProfessorsTableComponent,
    MatSlideToggleModule,
    MatAutocompleteModule,
],
  templateUrl: './public.html',
  styleUrls: ['./public.scss'],
})
export class PublicComponent implements OnInit {
  private auth = inject(AuthService);
  private ulbs = inject(UlbsService);

  Math = Math;

  selectedFaculty: string = '';
  selectedSpecialization: string = '';
  profFaculty: string = '';
  profSpecialization: string = '';
  searchProfessor: string = '';
  professors: any[] = [];
  showProfessorList = false;
  isImpersonating = false;
  applicants: any[] = [];
  selectedTheme: number | null = null;
  progress: any = null;
  notifications: any[] = [];
  allThemes: any[] = [];
  showAllThemes = false;
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  faculties: any[] = [];
  specializations: any[] = [];
  themes: any[] = [];
  myThemes: any[] = [];
  isSaving = false;
  isSearching = false;
  applyingThemeId: number | null = null;
  searchTimeout: any;
  editingThemeId: number | null = null;
  editData = { title: '', description: '' };
  showNotifications = false;

  newTheme = {
    title: '',
    description: '',
  };

ngOnInit() {
  this.auth.user$.subscribe(user => {
    this.user = user;

    this.isImpersonating = !!localStorage.getItem('original_admin');

    if (user?.role === 'profesor') {
      this.loadNotifications();

      this.ulbs.getProfessorProgress(user.email).subscribe((res: any) => {
        this.progress = res;
      });
    }

    if (user?.role === 'admin') {
      this.ulbs.getProfessors().subscribe((res: any) => {
        this.professors = res;
      });
    }

    this.loadThemes();
  });

  this.ulbs.getFaculties().subscribe((res: any) => {
    this.faculties = res.data;
    this.cdr.detectChanges();
  });
}

loadThemes() {
  this.ulbs.getThemes().subscribe((res: any) => {
    this.allThemes = res || [];

    if (this.user?.role === 'profesor') {
      this.myThemes = this.allThemes.filter(
        (t) => t.professor_email === this.user?.email
      );

      this.themes = this.showAllThemes ? this.allThemes : this.myThemes;
    } else {
      this.themes = this.allThemes;
    }

    this.filterThemes();

    if (this.selectedTheme) {
      const stillExists = this.themes.find((t) => t.id == this.selectedTheme);
      if (!stillExists) {
        this.selectedTheme = null;
      }
    }

    this.cdr.detectChanges();
  });
}

toggleThemesView() {
  if (this.user?.role === 'profesor') {
    this.filterThemes();
  }
}

  search() {
    this.filterThemes();
  }

filterThemes(): void {
  const search = (this.searchProfessor || '').toLowerCase();
  const sourceThemes =
    this.user?.role === 'profesor' && !this.showAllThemes
      ? this.myThemes
      : this.allThemes;

  this.themes = sourceThemes.filter((t) => {
    const matchProfessor =
      !search ||
      (t.professor_name || t.professor_email || '')
        .toLowerCase()
        .includes(search);

    const matchFaculty =
      !this.selectedFaculty ||
      t.faculty_id == this.selectedFaculty ||
      t.faculty_name === this.faculties.find(f => f.id == this.selectedFaculty)?.name;

    const matchSpecialization =
      !this.selectedSpecialization ||
      t.specialization_id == this.selectedSpecialization ||
      t.specialization_name === this.specializations.find(s => s.id == this.selectedSpecialization)?.name;

    return matchProfessor && matchFaculty && matchSpecialization;
  });
}

  onSearchChange(): void {
    this.filterThemes();
  }
  
  addTheme(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.user) {
      alert('Trebuie să fii logat pentru a adăuga o temă');
      return;
    }

    if (this.user?.role === 'profesor' && this.progress) {
      const max = (this.progress.required || 0) + (this.progress.extra || 0);

      if (this.progress.created >= max) {
        alert(`Ai atins limita de ${max} teme`);
        return;
      }
    }

    if (this.isSaving) return;

    const title = this.newTheme.title?.trim();
    const desc = this.newTheme.description?.trim();

    if (!title || !desc) {
      alert('Completează titlul și descrierea!');
      return;
    }

    if (!this.selectedFaculty || !this.selectedSpecialization) {
      alert('Selectează facultatea și specializarea!');
      return;
    }

    this.isSaving = true;

    const payload = {
      title,
      description: desc,
      professor_email: this.user.email,
      faculty_id: Number(this.selectedFaculty),
      specialization_id: Number(this.selectedSpecialization),
      faculty_name: this.faculties.find((f) => f.id == this.selectedFaculty)?.name || '',
      specialization_name:
        this.specializations.find((s) => s.id == this.selectedSpecialization)?.name || '',
    };
    this.ulbs
      .addTheme(payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.newTheme.title = '';
          this.newTheme.description = '';
          this.profFaculty = '';
          this.profSpecialization = '';
          this.specializations = [];

          this.loadThemes();

          if (this.user?.role === 'profesor') {
            this.ulbs.getProfessorProgress(this.user.email).subscribe((res: any) => {
              this.progress = res;
            });
          }
        },
        error: (err) => {
          console.error('Eroare la salvare temă:', err);
        },
      });
  }

onFacultyChange(isProfessor = false) {
  const facultyId = isProfessor ? this.profFaculty : this.selectedFaculty;

  if (isProfessor) {
    this.profSpecialization = '';
  } else {
    this.selectedSpecialization = '';
  }

  if (!facultyId) {
    this.specializations = [];
    this.filterThemes(); 
    return;
  }

  this.specializations = [];

  this.ulbs.getSpecializations(facultyId).subscribe((res: any) => {
    this.specializations = res.data || [];

    this.cdr.detectChanges();

    if (!isProfessor) {
      this.filterThemes();
    }
  });
}

  deleteTheme(id: number) {
    if (!this.user) return;
    if (!confirm('Sigur vrei să ștergi tema?')) return;

    this.ulbs.deleteTheme(id, this.user.email).subscribe(() => {
      this.loadThemes();
    });
  }

  startEdit(theme: any) {
    this.editingThemeId = theme.id;
    this.editData = {
      title: theme.title,
      description: theme.description,
    };
  }

  saveEdit(id: number) {
    if (!this.user) return;

    this.ulbs
      .updateTheme(id, {
        ...this.editData,
        email: this.user.email,
      })
      .subscribe(() => {
        const index = this.allThemes.findIndex((t) => t.id === id);

        if (index !== -1) {
          this.allThemes[index] = {
            ...this.allThemes[index],
            ...this.editData,
          };
        }

        this.filterThemes();

        this.editingThemeId = null;
      });
  }

  getRemainingRequiredThemes(): number {
    const required = this.progress?.required || 0;
    const created = this.progress?.created || 0;
    return Math.max(0, required - Math.min(created, required));
  }

  getRemainingExtraThemes(): number {
    const required = this.progress?.required || 0;
    const extra = this.progress?.extra || 0;
    const created = this.progress?.created || 0;
    const extraUsed = Math.max(0, created - required);
    return Math.max(0, extra - extraUsed);
  }

apply(theme: any) {
  if (!this.user) return;
  if (this.applyingThemeId === theme.id) return;

  const payload = {
    theme_id: theme.id,
    student_email: this.user.email,
    student_name: this.user.name,
  };

  this.applyingThemeId = theme.id;

  this.ulbs.applyToTheme(payload)
    .pipe(finalize(() => {
      if (this.applyingThemeId === theme.id) {
        this.applyingThemeId = null;
      }
    }))
    .subscribe({
      next: () => {
        alert('Ai aplicat la temă!');
      },
      error: (err) => {
        if (err.status === 400) {
          alert('Ai aplicat deja la această temă');
        } else {
          alert('Eroare la aplicare');
        }
      },
    });
}

 viewApplicants(theme: any) {
  if (this.selectedTheme === theme.id) {
    this.selectedTheme = null;
    this.applicants = [];
    return;
  }

  this.selectedTheme = theme.id;

  this.ulbs.getApplicants(theme.id).subscribe({
    next: (res: any) => {
      const data = Array.isArray(res) ? res : res.data;
      this.applicants = data || [];
      this.cdr.detectChanges();
    },
    error: () => {
      this.applicants = [];
      this.cdr.detectChanges();
    }
  });
}

accept(id: number) {
  this.ulbs.acceptApplicant(id).subscribe(() => {
    alert('Student acceptat');

    this.applicants = this.applicants.filter((a) => a.id !== id);

    if (this.applicants.length === 0) {
      this.selectedTheme = null;
    }

    this.loadThemes();
  });
}

  getVisitorId() {
    let id = localStorage.getItem('visitor_id');

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('visitor_id', id);
    }

    return id;
  }

  like(theme: any) {
    if (theme.liked) return;

    const visitorId = this.getVisitorId();

    this.ulbs.likeTheme(theme.id, visitorId).subscribe({
      next: (res: any) => {
        theme.likes = res.likes;

        theme.liked = true;

        this.themes = [...this.themes];
      },
      error: () => {
        alert('Ai dat deja like');
      },
    });
  }

  setRequiredThemes(prof: any) {
    this.ulbs
      .setRequiredThemes(prof.email, prof.required_themes, prof.extra_themes || 0)
      .subscribe(() => {
        alert('Număr teme actualizat');
      });
  }

  getRequiredProgress(p: any): number {
    if (!p.required_themes) return 0;

    const done = Math.min(p.created_themes, p.required_themes);

    return (done / p.required_themes) * 100;
  }

  getExtraProgress(p: any): number {
    if (!p.extra_themes) return 0;

    if (p.created_themes <= p.required_themes) return 0;

    const extraDone = Math.min(p.created_themes - p.required_themes, p.extra_themes);

    return (extraDone / p.extra_themes) * 100;
  }

  getRequiredDone(p: any): number {
    return Math.min(p.created_themes, p.required_themes);
  }

  getExtraDone(p: any): number {
    return Math.max(0, p.created_themes - p.required_themes);
  }

  sendReminder(prof: any) {
    if (!confirm(`Trimite reminder către ${prof.name}?`)) return;

    this.ulbs.sendReminder(prof.email).subscribe({
      next: () => {
        alert('Reminder trimis cu succes');
      },
      error: () => {
        alert('Eroare la trimitere reminder');
      },
    });
  }

  loadNotifications() {
    this.ulbs.getNotifications(this.user.email).subscribe((res: any) => {
      this.notifications = res;
    });
  }
}
