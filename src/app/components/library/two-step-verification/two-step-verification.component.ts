import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  NgModule,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  DxButtonModule,
  DxTextBoxComponent,
  DxTextBoxModule,
} from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { CardAuthModule } from '../card-auth/card-auth.component';
import { ResetPasswordFormModule } from '../reset-password-form/reset-password-form.component';
import { SingleCardModule } from 'src/app/layouts';
import notify from 'devextreme/ui/notify';
import { InactivityService } from 'src/app/services/inactivity.service';

@Component({
  selector: 'app-two-step-verification',
  templateUrl: './two-step-verification.component.html',
  styleUrls: ['./two-step-verification.component.scss'],
})
export class TwoStepVerificationComponent implements OnInit, AfterViewInit {
  @ViewChildren('sms1, sms2, sms3, sms4, sms5, sms6')
  smsInputs!: QueryList<DxTextBoxComponent>;

  @ViewChildren('email1, email2, email3, email4, email5, email6')
  emailInputs!: QueryList<DxTextBoxComponent>;

  @ViewChildren(
    'whatsapp1, whatsapp2, whatsapp3, whatsapp4, whatsapp5, whatsapp6'
  )
  whatsappInputs!: QueryList<DxTextBoxComponent>;

  smsOtpDigits: string[] = Array(6).fill('');
  emailOtpDigits: string[] = Array(6).fill('');
  whatsappOtpDigits: string[] = Array(6).fill('');

  countdown: any = 30;
  intervalId: any;
  canResendCode: boolean = true;

  logData: any;

  mfaEmail: boolean = null;
  mfaWhatsapp: boolean = null;
  mfaSMS: boolean = null;

  expectedEmailOTP: any;
  expectedsmsOTP: any;
  expectedwhatsappOTP: any;

  userMobileNum: any;
  userEmail: any;
  userWhatsappNum: any;

  instructionText: string = '';
  smsOtpHeading: string;
  emailOtpHeading: string;
  whatsappOtpHeading: string;

  currentOtpStep = 'sms';

  MFASingleToken: any;
  constructor(
    private router: Router,
    private inactive: InactivityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const logDataString = localStorage.getItem('logData');

    if (logDataString) {
      this.logData = JSON.parse(logDataString);

      this.MFASingleToken = !!this.logData.MFASingleToken;

      this.mfaEmail = this.logData.MFAEmail;
      this.mfaWhatsapp = this.logData.MFAWhatsapp;
      this.mfaSMS = this.logData.MFASMS;

      this.expectedEmailOTP = this.logData.EmailOTP;
      this.expectedsmsOTP = this.logData.EmailOTP;
      this.expectedwhatsappOTP = this.logData.EmailOTP;

      this.userMobileNum = this.logData.Mobile;
      this.userEmail = this.logData.Email;
      this.userWhatsappNum = this.logData.Whatsapp;

      const maskedMobile = this.userMobileNum
        ? `+91******${this.userMobileNum.slice(-4)}`
        : '';
      const maskedEmail = this.userEmail
        ? `${this.userEmail[0]}******@${this.userEmail.split('@')[1]}`
        : '';
      const maskedWhatsapp = this.userWhatsappNum
        ? `+91******${this.userWhatsappNum.slice(-4)}`
        : '';

      // Conditional OTP heading logic with "or"
      if (this.MFASingleToken) {
        this.smsOtpHeading = `Enter the OTP received from your registered mobile number ${maskedMobile}, or email ${maskedEmail}, or WhatsApp number ${maskedWhatsapp}`;
      } else {
        this.smsOtpHeading = `Enter the OTP received from the registered mobile number ${maskedMobile}`;
      }

      this.emailOtpHeading = `Enter the OTP received from the registered email ${maskedEmail}`;
      this.whatsappOtpHeading = `Enter the OTP received from the registered WhatsApp number ${maskedWhatsapp}`;
    }

    this.startCountdown();
    this.setInstructionText();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.smsInputs && this.smsInputs.first) {
        this.smsInputs.first.instance.focus();
      }
    });
  }

  setInstructionText() {
    const sources = [];

    if (this.mfaSMS) sources.push('your registered mobile number');
    if (this.mfaEmail) sources.push('your registered email');
    if (this.mfaWhatsapp) sources.push('your WhatsApp');

    if (sources.length === 1) {
      this.instructionText = `Enter the OTP received from ${sources[0]}.`;
    } else if (sources.length === 2) {
      this.instructionText = `Enter the OTP received from ${sources[0]} and ${sources[1]}.`;
    } else if (sources.length === 3) {
      this.instructionText = `Enter the OTP received from ${sources[0]}, ${sources[1]}, and ${sources[2]}.`;
    } else {
      this.instructionText = `Enter the OTP to continue.`;
    }
  }
  // ==================== closing the page ====================
  closePage() {
    this.router.navigate(['/auth/login']);
    console.log('Close button clicked');
  }
  // ============== filling otp to the textbox ================
  onOtpKeyUp(
    event: KeyboardEvent,
    index: number,
    type: 'sms' | 'email' | 'whatsapp'
  ): void {
    const input = event.target as HTMLInputElement;

    let inputList: DxTextBoxComponent[] = [];

    switch (type) {
      case 'sms':
        inputList = this.smsInputs.toArray();
        break;
      case 'email':
        inputList = this.emailInputs.toArray();
        break;
      case 'whatsapp':
        inputList = this.whatsappInputs.toArray();
        break;
    }

    if (input.value && index < inputList.length - 1) {
      this.focusNextInput(inputList[index + 1]);
    } else if (event.key === 'Backspace' && !input.value && index > 0) {
      this.focusNextInput(inputList[index - 1]);
    }
  }

  // ========= auto change cursor to next text box ============
  focusNextInput(inputComponent: DxTextBoxComponent): void {
    const inputElement = inputComponent?.instance
      ?.element()
      ?.querySelector('input');
    if (inputElement) {
      inputElement.focus();
    }
  }
  // =================== Verify SMS OTP =======================
  verifyCodes() {
    if (this.MFASingleToken && this.mfaSMS) {
      const smsCode = this.smsOtpDigits.join('');
      if (smsCode !== this.expectedsmsOTP) {
        notify({
          message: 'Invalid SMS OTP',
          type: 'error',
          position: { at: 'top right', my: 'top right' },
        });
        return;
      }
      this.inactive.setUserlogginValue();
      this.router.navigateByUrl('/analytics-dashboard');
      return;
    }

    // When MFASingleToken is false, handle step-by-step
    if (!this.MFASingleToken) {
      if (this.currentOtpStep === 'sms' && this.mfaSMS) {
        const smsCode = this.smsOtpDigits.join('');
        if (smsCode !== this.expectedsmsOTP) {
          notify({
            message: 'Invalid SMS OTP',
            type: 'error',
            position: { at: 'top right', my: 'top right' },
          });
          return;
        }
        this.currentOtpStep = this.mfaEmail
          ? 'email'
          : this.mfaWhatsapp
          ? 'whatsapp'
          : '';
        return;
      }

      if (this.currentOtpStep === 'email' && this.mfaEmail) {
        const emailCode = this.emailOtpDigits.join('');
        if (emailCode !== this.expectedEmailOTP) {
          notify({
            message: 'Invalid Email OTP',
            type: 'error',
            position: { at: 'top right', my: 'top right' },
          });
          return;
        }
        this.currentOtpStep = this.mfaWhatsapp ? 'whatsapp' : '';
        return;
      }

      if (this.currentOtpStep === 'whatsapp' && this.mfaWhatsapp) {
        const whatsappCode = this.whatsappOtpDigits.join('');
        if (whatsappCode !== this.expectedwhatsappOTP) {
          notify({
            message: 'Invalid WhatsApp OTP',
            type: 'error',
            position: { at: 'top right', my: 'top right' },
          });
          return;
        }

        this.inactive.setUserlogginValue();
        this.router.navigateByUrl('/analytics-dashboard');
      }
    }
  }

  //========= Disable Otp verify button under processing ============
  isCurrentOtpComplete(): boolean {
    if (this.currentOtpStep === 'sms') {
      return this.smsOtpDigits.every((d) => d);
    } else if (this.currentOtpStep === 'email') {
      return this.emailOtpDigits.every((d) => d);
    } else if (this.currentOtpStep === 'whatsapp') {
      return this.whatsappOtpDigits.every((d) => d);
    }
    return false;
  }

  // ================== Resend OTP Code ======================
  resendCode() {
    this.countdown = 30;
    this.startCountdown();
    // Call API
  }
  // ================= Start Count Down ======================
  startCountdown() {
    this.canResendCode = false;
    this.countdown = 30;
    clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.intervalId);
        this.canResendCode = true;
      }
      // Force UI update manually
      this.cdr.detectChanges();
    }, 1000);
  }
}

@NgModule({
  imports: [
    CommonModule,
    CardAuthModule,
    ResetPasswordFormModule,
    DxButtonModule,
    FormsModule,
    SingleCardModule,
    DxTextBoxModule,
  ],
  declarations: [TwoStepVerificationComponent],
  exports: [TwoStepVerificationComponent],
})
export class TwoStepVerificationModule {}
