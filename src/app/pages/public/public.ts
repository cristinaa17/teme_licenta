import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { UlbsService } from '../../services/ulbs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MatMenuModule,
  ],
  templateUrl: './public.html',
  styleUrls: ['./public.css'],
})
export class PublicComponent implements OnInit {
  private auth = inject(AuthService);
  private ulbs = inject(UlbsService);

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

  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  faculties: any[] = [];
  specializations: any[] = [];
  themes: any[] = [];
  isSaving = false;
  editingThemeId: number | null = null;
  editData = { title: '', description: '' };

  newTheme = {
    title: '',
    description: '',
  };

  ngOnInit() {
    console.log('INIT');

    this.user = this.auth.getUser();

    this.isImpersonating = !!localStorage.getItem('original_admin');

    if (this.user?.role === 'admin') {
      this.ulbs.getProfessors().subscribe((res: any) => {
        this.professors = res;
      });
    }

    this.loadThemes();

    this.ulbs.getFaculties().subscribe((res: any) => {
      console.log('DATA:', res);
      this.faculties = res.data;
      this.cdr.detectChanges();
    });
  }

  loadThemes() {
    this.ulbs.getThemes().subscribe((res: any) => {
      console.log('THEMES:', res);
      this.themes = res || [];
      this.cdr.detectChanges();
    });
  }

  search() {
    this.ulbs
      .getThemes(
        Number(this.selectedFaculty),
        Number(this.selectedSpecialization),
        this.searchProfessor,
      )
      .subscribe((res: any) => {
        this.themes = res || [];
      });
  }

  addTheme(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.user) {
      alert('Trebuie să fii logat pentru a adăuga o temă');
      return;
    }

    if (this.isSaving) return;

    const title = this.newTheme.title?.trim();
    const desc = this.newTheme.description?.trim();

    console.log('ADD THEME CLICKED');
    console.log('TITLE:', title);
    console.log('DESC:', desc);

    if (!title || !desc) {
      alert('Completează titlul și descrierea!');
      return;
    }

    this.isSaving = true;

    const payload = {
      title,
      description: desc,
      professor_email: this.user.email,
      faculty_id: this.profFaculty ? Number(this.profFaculty) : null,
      specialization_id: this.profSpecialization ? Number(this.profSpecialization) : null,
      faculty_name: this.faculties.find((f) => f.id == this.profFaculty)?.name,
      specialization_name: this.specializations.find((s) => s.id == this.profSpecialization)?.name,
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

          this.loadThemes();
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

    this.specializations = [];

    this.ulbs.getSpecializations(facultyId).subscribe((res: any) => {
      this.specializations = res.data || [];

      if (!isProfessor) {
        this.search();
      }

      this.cdr.detectChanges();
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
        this.editingThemeId = null;
        this.search();
      });
  }

  apply(theme: any) {
    const payload = {
      theme_id: theme.id,
      student_email: this.user.email,
      student_name: this.user.name,
    };

    this.ulbs.applyToTheme(payload).subscribe({
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
    this.selectedTheme = theme.id;

    this.ulbs.getApplicants(theme.id).subscribe((res: any) => {
      this.applicants = res;
    });
  }

  accept(id: number) {
    this.ulbs.acceptApplicant(id).subscribe(() => {
      alert('Student acceptat');

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

  impersonate(email: string) {
    const originalAdmin = this.auth.getUser();

    localStorage.setItem('original_admin', JSON.stringify(originalAdmin));

    this.ulbs.impersonate(email).subscribe((user: any) => {
      localStorage.setItem('user', JSON.stringify(user));

      this.isImpersonating = true;

      location.reload();
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

  openProfessorList() {
    this.ulbs.getProfessors().subscribe((res: any) => {
      this.professors = res;

      this.showProfessorList = true;
    });
  }

  get filteredProfessors() {
    if (!this.searchProfessor) return this.professors;

    return this.professors.filter((p: any) =>
      p.name.toLowerCase().includes(this.searchProfessor.toLowerCase()),
    );
  }

  logout() {
    this.auth.logout();
    this.user = null;
    this.loadThemes();
  }
}
