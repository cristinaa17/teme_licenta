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
  private cdr = inject(ChangeDetectorRef);

  user = this.auth.getUser();

  faculties: any[] = [];
  specializations: any[] = [];

  ngOnInit() {
    console.log('INIT');

    this.ulbs.getFaculties().subscribe((res: any) => {
      console.log('DATA:', res);

      this.faculties = res.data;

      this.cdr.detectChanges(); 
    });
  }

  onFacultyChange(event: any) {
    const facultyId = event.target.value;

    this.ulbs.getSpecializations(facultyId).subscribe((res: any) => {
      console.log(res);

      this.specializations = res.data;

      this.cdr.detectChanges(); 
    });
  }

  logout() {
    this.auth.logout();
  }
}
