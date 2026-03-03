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

  addTheme(theme: any) {
    return this.http.post('http://localhost:3000/api/themes', theme);
  }

  getThemes(facultyId?: number, specializationId?: number, professor?: string) {
    let url = 'http://localhost:3000/api/themes';

    const params: string[] = [];

    if (facultyId) params.push(`facultyId=${facultyId}`);
    if (specializationId) params.push(`specializationId=${specializationId}`);
    if (professor) params.push(`professor=${encodeURIComponent(professor)}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get(url);
  }

  deleteTheme(id: number, email: string) {
    return this.http.delete(`http://localhost:3000/api/themes/${id}`, {
      body: { email },
    });
  }

  updateTheme(id: number, data: any) {
    return this.http.put(`http://localhost:3000/api/themes/${id}`, data);
  }
}
