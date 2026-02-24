import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: any = null;

  constructor(private router: Router) {}

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

    this.user = payload;
    localStorage.setItem('user', JSON.stringify(payload));

    this.router.navigate(['/public']);
  }

  getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
