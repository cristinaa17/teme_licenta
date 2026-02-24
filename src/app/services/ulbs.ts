import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UlbsService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getFaculties() {
    return this.http.get<any>(`${this.baseUrl}/faculties`);
  }

  getSpecializations(facultyId: string) {
    return this.http.get<any>(`${this.baseUrl}/specializations/${facultyId}`);
  }
}
