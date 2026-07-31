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
import { confirm } from 'devextreme/ui/dialog';
import { InactivityService } from 'src/app/services/inactivity.service';
import { AuthService } from 'src/app/services/auth.service';

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
    'whatsapp1, whatsapp2, whatsapp3, whatsapp4, whatsapp5, whatsapp6',
  )
  whatsappInputs!: QueryList<DxTextBoxComponent>;

  @ViewChildren('auth1, auth2, auth3, auth4, auth5, auth6')
  authInputs!: QueryList<DxTextBoxComponent>;

  smsOtpDigits: string[] = Array(6).fill('');
  emailOtpDigits: string[] = Array(6).fill('');
  whatsappOtpDigits: string[] = Array(6).fill('');
  authOtpDigits: string[] = Array(6).fill('');

  countdown: any = 30;
  intervalId: any;
  canResendCode: boolean = true;

  logData: any;

  mfaEmail: boolean = null;
  mfaWhatsapp: boolean = null;
  mfaSMS: boolean = null;
  mfaAuthenticator: boolean = false;
  isGoogleAuthSetup: boolean = false;
  qrCodeImageUrl: string = '';
  manualKey: string = '';
  userId: number = 1;

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

  currentOtpStep = '';
  MFASingleToken: any;

  constructor(
    private router: Router,
    private inactive: InactivityService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    const logDataString = localStorage.getItem('logData');

    if (logDataString) {
      this.logData = JSON.parse(logDataString);

      this.userId = this.logData.UserId || this.logData.Id || 1;
      this.mfaAuthenticator = !!(
        this.logData.MFAGoogle || this.logData.MFAMicrosoft
      );
      this.isGoogleAuthSetup = this.logData.IsGoogleAuthSetup;

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

      if (this.MFASingleToken) {
        if (this.mfaSMS || this.mfaEmail || this.mfaWhatsapp) {
          this.currentOtpStep = 'sms';
        } else if (this.mfaAuthenticator) {
          this.currentOtpStep = 'authenticator';
          this.checkAuthSetup();
        }
      } else {
        if (this.mfaSMS) {
          this.currentOtpStep = 'sms';
        } else if (this.mfaEmail) {
          this.currentOtpStep = 'email';
        } else if (this.mfaWhatsapp) {
          this.currentOtpStep = 'whatsapp';
        } else if (this.mfaAuthenticator) {
          this.currentOtpStep = 'authenticator';
          this.checkAuthSetup();
        }
      }
    }

    this.startCountdown();
    this.setInstructionText();
  }

  checkAuthSetup() {
    if (!this.isGoogleAuthSetup) {
      this.authService.setupGoogleAuth(this.userId).subscribe({
        next: (res: any) => {
          if (res && res.qrCodeImageUrl) {
            this.qrCodeImageUrl = res.qrCodeImageUrl;
            this.manualKey = res.manualKey;
            this.cdr.detectChanges();
          }
        },
        error: (err: any) => {
          console.error('Error fetching QR code:', err);
        },
      });
    }
  }

  regenerateQrCode() {
    this.authService.resetGoogleAuth(this.userId).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.isGoogleAuthSetup = false;
          this.checkAuthSetup();
        }
      },
    });
  }

  confirmResetQrCode() {
    const result = confirm(
      'Are you sure you want to reset your Authenticator? You will need to scan a new QR code.',
      'Reset Authenticator',
    );
    result.then((dialogResult: boolean) => {
      if (dialogResult) {
        this.regenerateQrCode();
      }
    });
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
    type: 'sms' | 'email' | 'whatsapp' | 'authenticator',
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
      case 'authenticator':
        inputList = this.authInputs.toArray();
        break;
    }

    if (input.value && index < inputList.length - 1) {
      this.focusNextInput(inputList[index + 1]);
    } else if (event.key === 'Backspace' && !input.value && index > 0) {
      this.focusNextInput(inputList[index - 1]);
    }

    // Auto-commit if all 6 digits are entered
    setTimeout(() => {
      if (this.isCurrentOtpComplete()) {
        // this.verifyCodes();
      }
    }, 10);
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

  // ============= Change the OTP Steps =============
  goToNextStep() {
    if (this.currentOtpStep === 'sms') {
      if (!this.MFASingleToken) {
        if (this.mfaEmail) {
          this.currentOtpStep = 'email';
          return;
        } else if (this.mfaWhatsapp) {
          this.currentOtpStep = 'whatsapp';
          return;
        }
      }
      if (this.mfaAuthenticator) {
        this.currentOtpStep = 'authenticator';
        this.checkAuthSetup();
        return;
      }
    } else if (this.currentOtpStep === 'email') {
      if (this.mfaWhatsapp) {
        this.currentOtpStep = 'whatsapp';
        return;
      } else if (this.mfaAuthenticator) {
        this.currentOtpStep = 'authenticator';
        this.checkAuthSetup();
        return;
      }
    } else if (this.currentOtpStep === 'whatsapp') {
      if (this.mfaAuthenticator) {
        this.currentOtpStep = 'authenticator';
        this.checkAuthSetup();
        return;
      }
    }

    // If no more steps are applicable, log the user in
    this.inactive.setUserlogginValue();
    this.router.navigateByUrl('/analytics-dashboard');
  }

  // =================== Verify OTP =======================
  verifyCodes() {
    if (this.currentOtpStep === 'sms') {
      const smsCode = this.smsOtpDigits.join('');
      if (smsCode !== this.expectedsmsOTP) {
        notify({
          message: this.MFASingleToken ? 'Invalid OTP' : 'Invalid SMS OTP',
          type: 'error',
          position: { at: 'top right', my: 'top right' },
        });
        return;
      }
      this.goToNextStep();
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
      this.goToNextStep();
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
      this.goToNextStep();
      return;
    }

    if (this.currentOtpStep === 'authenticator' && this.mfaAuthenticator) {
      const authCode = this.authOtpDigits.join('');
      this.authService.verifyGoogleAuth(this.userId, authCode).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            this.goToNextStep();
          } else {
            notify({
              message: 'Invalid Authenticator Code',
              type: 'error',
              position: { at: 'top right', my: 'top right' },
            });
          }
        },
        error: (err: any) => {
          notify({
            message: 'Error verifying Authenticator Code',
            type: 'error',
            position: { at: 'top right', my: 'top right' },
          });
        },
      });
      return;
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
    } else if (this.currentOtpStep === 'authenticator') {
      return this.authOtpDigits.every((d) => d);
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
