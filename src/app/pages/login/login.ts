import { Component, AfterViewInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']
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