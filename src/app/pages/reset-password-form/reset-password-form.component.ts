import { Component, NgModule } from '@angular/core';
import { DxButtonModule } from 'devextreme-angular';


import { CardAuthModule, ResetPasswordFormModule } from 'src/app/components';

@Component({
  selector: 'app-reset-password-form',
  templateUrl: './reset-password-form.component.html',
  styleUrls: ['./reset-password-form.component.scss']
})
export class AppResetPasswordComponent {

}

@NgModule({
  imports: [
    CardAuthModule,
    ResetPasswordFormModule,
    DxButtonModule
  ],
  providers: [],
  exports: [AppResetPasswordComponent],
  declarations: [AppResetPasswordComponent],
})
export class AppResetPasswordModule { }

