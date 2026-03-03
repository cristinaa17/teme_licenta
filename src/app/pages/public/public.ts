import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { UlbsService } from '../../services/ulbs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

@Component({
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, CommonModule, FormsModule],
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

  private cdr = inject(ChangeDetectorRef);

  user = this.auth.getUser();

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
      this.themes = res;
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
        this.themes = res;
      });
  }

  addTheme(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();

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

  logout() {
    this.auth.logout();
  }
}
