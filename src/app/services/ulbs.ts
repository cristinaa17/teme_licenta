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

  getThemes(facultyId?: string, specializationId?: string, professor?: string) {
    let url = 'http://localhost:3000/api/themes';

    const params: string[] = [];

    if (facultyId) params.push(`facultyId=${facultyId}`);
    if (specializationId) params.push(`specializationId=${specializationId}`);
    if (professor) params.push(`professor=${professor}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get(url);
  }
}
