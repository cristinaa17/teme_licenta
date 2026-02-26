import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  initGoogle(callback: any) {
    const btn = document.getElementById('googleBtn');

    if (!btn) return;

    google.accounts.id.initialize({
      client_id: '77612515546-26k0csdhdhvp93rikpbafsh7ck3pvtfh.apps.googleusercontent.com',
      callback: callback,
    });

    google.accounts.id.disableAutoSelect();

    google.accounts.id.renderButton(btn, {
      theme: 'outline',
      size: 'large',
    });
  }

  handleLogin(response: any) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email = payload.email;

    console.log('EMAIL:', email);

    if (!email || !email.endsWith('@ulbsibiu.ro')) {
      alert('Trebuie să folosești un cont @ulbsibiu.ro');
      return;
    }

    this.saveUser(payload).subscribe({
      next: (userFromDb: any) => {
        console.log('USER DIN DB:', userFromDb);

        this.user = userFromDb;
        localStorage.setItem('user', JSON.stringify(userFromDb));

        this.router.navigate(['/public']);
      },
      error: (err) => {
        console.error('Eroare salvare user', err);

        this.user = payload;
        localStorage.setItem('user', JSON.stringify(payload));

        this.router.navigate(['/public']);
      },
    });
  }

  getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  saveUser(user: any) {
    return this.http.post('http://localhost:3000/api/users', {
      email: user.email,
      name: user.name,
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
