import { CommonModule } from '@angular/common';
import { Component, NgModule, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DxButtonModule } from 'devextreme-angular';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-card-auth',
  templateUrl: './card-auth.component.html',
  styleUrls: ['./card-auth.component.scss'],
})
export class CardAuthComponent implements OnInit {
  @Input()
  title!: string;

  @Input()
  description!: string;

  version: string = '';

  constructor(
    private router: Router,
    private dataService: DataService,
  ) {}

  ngOnInit() {
    this.version = this.dataService.get_version();
  }

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
