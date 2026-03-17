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
    return this.http.post(`${this.baseUrl}/themes`, theme);
  }

  getThemes(facultyId?: number, specializationId?: number, professor?: string) {
    let url = `${this.baseUrl}/themes`;

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
    return this.http.delete(`${this.baseUrl}/themes/${id}`, {
      body: { email },
    });
  }

  updateTheme(id: number, data: any) {
    return this.http.put(`http://localhost:3000/api/themes/${id}`, data);
  }

  applyToTheme(data: any) {
    return this.http.post(`${this.baseUrl}/applications`, data);
  }

  getApplicants(themeId: number) {
    return this.http.get(`${this.baseUrl}/api/themes/${themeId}/applications`);
  }

  acceptApplicant(id: number) {
    return this.http.post(`${this.baseUrl}/applications/${id}/accept`, {});
  }

  likeTheme(themeId: number, visitorId: string) {
    return this.http.post(`${this.baseUrl}/themes/${themeId}/like`, {
      visitor_id: visitorId,
    });
  }

  getLikes(themeId: number) {
    return this.http.get<any>(`${this.baseUrl}/themes/${themeId}/likes`);
  }

  impersonate(email: string) {
    return this.http.post<any>(`${this.baseUrl}/admin/impersonate`, { email });
  }

  getProfessors() {
    return this.http.get(`${this.baseUrl}/professors`);
  }

  setRequiredThemes(email: string, count: number) {
    return this.http.put(`${this.baseUrl}/admin/set-required-themes`, { email, count });
  }

  getProfessorProgress(email: string) {
    return this.http.get(`${this.baseUrl}/professor/theme-progress/${email}`);
  }
}
