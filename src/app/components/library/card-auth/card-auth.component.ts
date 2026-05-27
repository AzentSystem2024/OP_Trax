import { CommonModule } from '@angular/common';
import { Component, NgModule, Input } from '@angular/core';
import { Router } from '@angular/router';
import { DxButtonModule } from 'devextreme-angular';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';

@Component({
  selector: 'app-card-auth',
  templateUrl: './card-auth.component.html',
  styleUrls: ['./card-auth.component.scss'],
})
export class CardAuthComponent {
  @Input()
  title!: string;

  @Input()
  description!: string;

  constructor(private router: Router) {}

  get isResetPasswordPage(): boolean {
    return (
      this.router.url.includes('reset-password') ||
      this.router.url.includes('two-step-verification')
    );
  }
  redirectToLogin() {
    this.router.navigateByUrl('auth/login');
  }
}

@NgModule({
  imports: [CommonModule, DxLoadIndicatorModule, DxButtonModule],
  declarations: [CardAuthComponent],
  exports: [CardAuthComponent],
})
export class CardAuthModule {}
