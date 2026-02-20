import { Component, AfterViewInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  template: `
    <div style="text-align:center; margin-top:100px">
      <h2>Login ULBS</h2>
      <div id="googleBtn"></div>
    </div>
  `,
})
export class LoginComponent implements AfterViewInit {
  private auth = inject(AuthService);

  ngAfterViewInit() {
    this.auth.initGoogle((res: any) => this.auth.handleLogin(res));
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (user && user.email?.endsWith('@ulbsibiu.ro')) {
      this.auth['router'].navigate(['/public']);
    }
  }
}
