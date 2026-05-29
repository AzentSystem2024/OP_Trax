import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SingleCardModule } from 'src/app/layouts';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthenticated-content',
  template: `
    <app-single-card [title]="title" [description]="description">
      <router-outlet></router-outlet>
    </app-single-card>
  `,
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class UnauthenticatedContentComponent {
  constructor(private router: Router) {}

  get description() {
    const path = this.router.url.split('/')?.at(-1) ?? '';
    switch (path) {
      case 'login':
        return 'Login To Your Account';
      case 'reset-password':
        return 'Reset Password';
      default:
        return '';
    }
  }

  get title() {
    const path = this.router.url.split('/').at(-1) ?? '';
    switch (path) {
      case 'login':
        return 'OPTrax';
      case 'create-account':
        return 'Sign Up';
      case 'change-password':
        return 'Change Password';
      case 'reset-password':
        return 'Please enter you email or mobile ';
      default:
        return '';
    }
  }
}
@NgModule({
  imports: [CommonModule, RouterModule, SingleCardModule],
  declarations: [UnauthenticatedContentComponent],
  exports: [UnauthenticatedContentComponent],
})
export class UnauthenticatedContentModule {}
