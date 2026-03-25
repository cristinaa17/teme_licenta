import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-admin-professors-table',
  imports: [
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatCard,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './admin-professors-table.html',
  styleUrls: ['./admin-professors-table.css'],
})
export class AdminProfessorsTableComponent {
  @Input() professors: any[] = [];

  @Input() getRequiredProgress!: (p: any) => number;
  @Input() getExtraProgress!: (p: any) => number;
  @Input() getRequiredDone!: (p: any) => number;
  @Input() getExtraDone!: (p: any) => number;

  @Input() setRequiredThemes!: (p: any) => void;
  @Input() sendReminder!: (p: any) => void;

  user: any;
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getUser();
  }

  displayedColumns: string[] = [
    'name',
    'created',
    'required',
    'extra',
    'progress',
    'status',
    'actions',
  ];
}
