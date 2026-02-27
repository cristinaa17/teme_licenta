import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { UlbsService } from '../../services/ulbs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
      .getThemes(this.selectedFaculty, this.selectedSpecialization, this.searchProfessor)
      .subscribe((res: any) => {
        this.themes = res;
      });
  }

  addTheme() {
    const payload = {
      ...this.newTheme,
      professor_email: this.user.email,
      faculty_id: Number(this.profFaculty),
      specialization_id: Number(this.profSpecialization),
      faculty_name: this.faculties.find((f) => f.id == this.profFaculty)?.name,
      specialization_name: this.specializations.find((s) => s.id == this.profSpecialization)?.name,
    };
    console.log('FACULTY:', this.profFaculty);
    this.ulbs.addTheme(payload).subscribe(() => {
      this.newTheme = { title: '', description: '' };
      this.search();
    });
  }

  onFacultyChange(event: any, isProfessor = false) {
    const facultyId = event.target.value;

    if (isProfessor) {
      this.profSpecialization = '';
    } else {
      this.selectedSpecialization = '';
    }

    this.specializations = [];

    this.ulbs.getSpecializations(facultyId).subscribe((res: any) => {
      this.specializations = res.data || [];
      this.search();
      this.cdr.detectChanges();
    });
  }

  logout() {
    this.auth.logout();
  }
}
