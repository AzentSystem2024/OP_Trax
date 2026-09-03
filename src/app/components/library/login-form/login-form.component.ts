import { SystemServicesService } from './../../../pages/SYSTEM PAGES/system-services.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  NgModule,
  Input,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LoginOauthModule } from 'src/app/components/library/login-oauth/login-oauth.component';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { DxButtonModule, DxButtonTypes } from 'devextreme-angular/ui/button';
import notify from 'devextreme/ui/notify';
import {
  AuthService,
  DataService,
  IResponse,
  ThemeService,
} from 'src/app/services';
import { SharedServiceService } from 'src/app/services/shared-service.service';
import { confirm } from 'devextreme/ui/dialog';
import { InactivityService } from 'src/app/services/inactivity.service';
import {
  DxLoadPanelModule,
  DxPopupModule,
  DxTextBoxComponent,
  DxTextBoxModule,
} from 'devextreme-angular';
import { firstValueFrom } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { MasterReportService } from 'src/app/pages/MASTER PAGES/master-report.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit, OnDestroy {
  @Input() resetLink = '/auth/reset-password';
  @Input() createAccountLink = '/auth/create-account';

  @ViewChildren('otp1, otp2, otp3, otp4, otp5, otp6')
  otpInputs!: QueryList<DxTextBoxComponent>;

  defaultAuthData!: IResponse;

  btnStylingMode!: DxButtonTypes.ButtonStyle;

  passwordMode = 'password';

  loading = false;

  formData: any = {};

  isPasswordVisible: boolean = false;

  loginResponse: any;
  SingleToken: boolean = false;
  securityPolicyData: any;

  isOtpPopupVisible: boolean = false;
  otpEmail: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];

  otpCountdown: number = 60;
  canResendOtp: boolean = false;
  otpTimerInterval: any = null;
  isResendingOtp: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private sharedService: SharedServiceService,
    private inactive: InactivityService,
    private SystemService: SystemServicesService,
    private dataService: DataService,
    private userservice: MasterReportService,
  ) {
    this.formData = {};
    this.themeService.isDark.subscribe((value: boolean) => {
      this.btnStylingMode = value ? 'outlined' : 'contained';
    });
  }

  togglePasswordVisibility = () => {
    this.isPasswordVisible = !this.isPasswordVisible;
  };

  changePasswordMode() {
    debugger;
    this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
  }

  async onSubmit(e: Event) {
    e.preventDefault();

    const { username, password } = this.formData;
    this.sharedService.triggerLoadComponent(true);

    try {
      // ===== STEP 0: TEST CONNECTION =====
      const testRes: any = await firstValueFrom(
        this.authService.testConnection(),
      );

      // Allow if HTTP 200 OR flag === 1
      if (testRes.status !== 200 && testRes.body?.flag !== 1) {
        this.showNotify('Server Error. Please try again later.', 'error');
        this.sharedService.triggerLoadComponent(false);
        return;
      }

      // ===== EXISTING INIT LOGIC (UNCHANGED) =====
      const version = this.dataService.get_version();
      const initResponse: any = await firstValueFrom(
        this.authService.initializeProject(version),
      );
      if (!initResponse) {
        this.sharedService.triggerLoadComponent(false);
        return;
      }

      // ===== EXISTING LOGIN LOGIC (UNCHANGED) =====
      await this.attemptLogin(username, password, false);
    } catch (err: any) {
      this.showNotify(
        'Server is not reachable. Please contact administrator.',
        'error',
      );
      this.sharedService.triggerLoadComponent(false);
    }
  }

  // ====== Login attempt helper ======
  private async attemptLogin(
    username: string,
    password: string,
    forcelogin: boolean,
  ) {
    try {
      this.sharedService.triggerLoadComponent(true);
      const response: any = await firstValueFrom(
        this.authService.logIn(username, password, forcelogin),
      );
      this.loginResponse = response;

      if (response.flag == 1) {
        const userRoleId =
          response.data?.UserRoleID ??
          response.data?.userRoleID ??
          response.data?.UserRoleId ??
          response.data?.userRoleId ??
          response.UserRoleID ??
          response.userRoleID;

        // TEMPORARILY DISABLED: OTP Verification Screen
        // To re-enable OTP, uncomment this block and the dx-popup in login-form.component.html
        /*
        if (Number(userRoleId) === 2) {
          this.sharedService.triggerLoadComponent(false);
          const rawEmail =
            response.data?.Email ??
            response.data?.EmailID ??
            response.data?.email ??
            response.Email ??
            response.EmailID ??
            '';
          this.otpEmail = this.maskEmail(rawEmail);
          const token = response.data?.Token ?? response.Token;
          if (token) {
            sessionStorage.setItem('AuthToken', token);
          }
          this.isOtpPopupVisible = true;
          this.startOtpTimer();
          return;
        }
        */

        this.completeLogin(response);
      } else if (response.flag == 2 && !forcelogin) {
        this.sharedService.triggerLoadComponent(false);
        const result = confirm(
          'You are already logged in on another device. Do you want to force the login process?',
          'Force Login',
        );

        result.then(async (dialogResult: boolean) => {
          if (dialogResult) {
            await this.attemptLogin(username, password, true);
          } else {
            this.showNotify(response.message, 'error');
            this.sharedService.triggerLoadComponent(false);
          }
        });
      } else {
        this.showNotify(response.message, 'error');
        this.sharedService.triggerLoadComponent(false);
      }
    } catch (err: any) {
      this.showNotify(`Error: ${err.message}`, 'error');
      this.sharedService.triggerLoadComponent(false);
    }
  }

  // ====== Complete login helper ======
  completeLogin(response: any) {
    this.storeSession(response);
    // ====== Redirect logic (MFA or dashboard) ======
    if (this.loginResponse.data?.EnableMFA === true) {
      this.sharedService.triggerLoadComponent(false);
      this.router.navigateByUrl('/auth/two-step-verification');
    } else {
      this.verify_PostOfficeCredencial_Data();
    }
  }

  isVerifyingOtp: boolean = false;

  get isOtpComplete(): boolean {
    return (
      this.otpDigits &&
      this.otpDigits.length === 6 &&
      this.otpDigits.every((digit) => digit && digit.trim() !== '')
    );
  }

  onOtpKeyUp(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const inputList = this.otpInputs?.toArray() || [];

    if (input.value && index < inputList.length - 1) {
      this.focusNextInput(inputList[index + 1]);
    } else if (event.key === 'Backspace' && !input.value && index > 0) {
      this.focusNextInput(inputList[index - 1]);
    }
  }

  focusNextInput(inputComponent: DxTextBoxComponent): void {
    if (inputComponent) {
      const inputElement =
        inputComponent.instance?.element()?.querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
    }
  }

  onPopupShown(): void {
    this.startOtpTimer();
    setTimeout(() => {
      if (this.otpInputs && this.otpInputs.first) {
        this.focusNextInput(this.otpInputs.first);
      }
    }, 100);
  }

  onPopupHiding(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.stopOtpTimer();
    if (!sessionStorage.getItem('UserID')) {
      sessionStorage.removeItem('AuthToken');
    }
  }

  startOtpTimer(): void {
    this.stopOtpTimer();
    this.otpCountdown = 60;
    this.canResendOtp = false;

    this.otpTimerInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
      } else {
        this.stopOtpTimer();
        this.canResendOtp = true;
      }
    }, 1000);
  }

  stopOtpTimer(): void {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }

  async onResendOtpClick(): Promise<void> {
    if (!this.canResendOtp || this.isResendingOtp) {
      return;
    }

    const userId =
      this.loginResponse?.data?.UserID ??
      this.loginResponse?.data?.UserId ??
      this.loginResponse?.data?.Id ??
      this.loginResponse?.UserID ??
      this.loginResponse?.UserId;

    const sessionId =
      this.loginResponse?.data?.SessionID ??
      this.loginResponse?.data?.SessionId ??
      this.loginResponse?.data?.sessionId ??
      this.loginResponse?.SessionID ??
      this.loginResponse?.SessionId ??
      this.loginResponse?.sessionId;

    const token =
      this.loginResponse?.data?.Token ??
      this.loginResponse?.Token ??
      sessionStorage.getItem('AuthToken');

    if (!userId || !sessionId) {
      this.showNotify(
        'Session details missing. Please re-enter login details.',
        'error',
      );
      return;
    }

    this.isResendingOtp = true;
    try {
      const response: any = await firstValueFrom(
        this.authService.resendOtp(userId, sessionId, token),
      );

      if (
        response?.flag == 1 ||
        response?.Flag == 1 ||
        response?.status === 200 ||
        response?.isOk ||
        response?.success
      ) {
        this.otpDigits = ['', '', '', '', '', ''];
        this.showNotify(
          response?.message ||
            response?.Message ||
            'A new OTP has been sent to your email.',
          'success',
        );
        this.startOtpTimer();
        if (this.otpInputs && this.otpInputs.first) {
          this.focusNextInput(this.otpInputs.first);
        }
      } else {
        this.showNotify(
          response?.message ||
            response?.Message ||
            'Failed to resend OTP. Please try again.',
          'error',
        );
      }
    } catch (err: any) {
      this.showNotify(
        err?.error?.message ||
          err?.message ||
          'Error while resending OTP. Please try again.',
        'error',
      );
    } finally {
      this.isResendingOtp = false;
    }
  }

  ngOnDestroy(): void {
    this.stopOtpTimer();
  }

  // ====== Verify OTP Click ======
  async onVerifyOtpClick() {
    const otpCode = this.otpDigits.join('').trim();
    if (otpCode.length !== 6) {
      this.showNotify('Please enter complete 6-digit OTP.', 'error');
      return;
    }

    const userId =
      this.loginResponse?.data?.UserID ??
      this.loginResponse?.data?.UserId ??
      this.loginResponse?.data?.Id ??
      this.loginResponse?.UserID ??
      this.loginResponse?.UserId;

    const sessionId =
      this.loginResponse?.data?.SessionID ??
      this.loginResponse?.data?.SessionId ??
      this.loginResponse?.data?.sessionId ??
      this.loginResponse?.SessionID ??
      this.loginResponse?.SessionId ??
      this.loginResponse?.sessionId;

    const token =
      this.loginResponse?.data?.Token ??
      this.loginResponse?.Token ??
      sessionStorage.getItem('AuthToken');

    this.isVerifyingOtp = true;
    this.sharedService.triggerLoadComponent(true);

    try {
      const res: any = await firstValueFrom(
        this.authService.validateOtp(userId, otpCode, sessionId, token),
      );

      if (
        res?.flag == 1 ||
        res?.Flag == 1 ||
        res?.status === 200 ||
        res?.isOk ||
        res?.success
      ) {
        this.stopOtpTimer();
        this.isVerifyingOtp = false;
        this.isOtpPopupVisible = false;
        this.otpDigits = ['', '', '', '', '', ''];
        if (res?.data) {
          this.loginResponse.data = { ...this.loginResponse.data, ...res.data };
        }
        this.completeLogin(this.loginResponse);
      } else {
        this.isVerifyingOtp = false;
        this.sharedService.triggerLoadComponent(false);
        this.showNotify(
          res?.message || res?.Message || 'Invalid OTP. Please try again.',
          'error',
        );
      }
    } catch (err: any) {
      this.isVerifyingOtp = false;
      this.sharedService.triggerLoadComponent(false);
      this.showNotify(
        err?.error?.message ||
          err?.message ||
          'Failed to verify OTP. Please try again.',
        'error',
      );
    }
  }

  // ====== Mask Email Helper ======
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email || '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
      return `${name[0]}*@${domain}`;
    }
    const maskedName =
      name.length > 4
        ? `${name.slice(0, 2)}${'*'.repeat(name.length - 4)}${name.slice(-2)}`
        : `${name[0]}${'*'.repeat(name.length - 1)}`;
    return `${maskedName}@${domain}`;
  }

  // ====== Store session & persist ======
  storeSession(response: any) {
    const { data, menus } = response;

    // ====== Store in session storage ======
    sessionStorage.setItem('loginName', data.LoginName);
    sessionStorage.setItem('UserID', data.UserID);
    sessionStorage.setItem('UserPhoto', data.PhotoFile);
    sessionStorage.setItem('AuthToken', data.Token);

    // ====== Store in local storage ======
    localStorage.setItem('logData', JSON.stringify(data));
    localStorage.setItem('Token', JSON.stringify(data.Token));
    localStorage.setItem('sidemenuItems', JSON.stringify(menus));

    // ====== Update application state ======
    this.authService.setUserData(data);
  }

  // ====== Verify facility data ======
  verify_PostOfficeCredencial_Data() {
    this.SystemService.verify_PostOfficeCredencial().subscribe(
      (response: any) => {
        if (response.flag === 1) {
          // ====== Success case ======
          if (response.failurecount > 0) {
            // Notify with failure count and response message
            notify(
              {
                message: `Verified with ${response.failurecount} failures.\n${response.message}`,
                position: { at: 'top right', my: 'top right' },
                displayTime: 8000,
              },
              'warning',
            );

            this.SystemService.get_PostOfficeCredencial_List().subscribe(
              (listResponse: any) => {
                if (listResponse.Flag === 1 && listResponse.data?.length > 0) {
                  const failedFacilities = listResponse.data.filter(
                    (item: any) => item.IsVerified !== true,
                  );

                  if (failedFacilities.length > 0) {
                    const facilityNames = failedFacilities
                      .map(
                        (f: any, idx: number) =>
                          `${idx + 1}. ${f.FacilityName} (${f.FacilityLicense})`,
                      )
                      .join('\n');

                    notify(
                      {
                        message: `Post office credentials failed for facilities:\n${facilityNames}`,
                        position: { at: 'top right', my: 'top right' },
                        displayTime: 10000,
                      },
                      'error',
                    );
                  }
                }
              },
              (error) => {
                notify(
                  {
                    message: 'Error while fetching failed facility list.',
                    position: { at: 'top right', my: 'top right' },
                    displayTime: 5000,
                  },
                  'error',
                );
              },
            );
          } else {
          }

          // ====== Redirect logic (dashboard / home) ======
          const logData =
            this.authService.getUserData() ||
            JSON.parse(localStorage.getItem('logData') || '{}');
          const userRoleId = Number(
            logData?.UserRoleID ??
              logData?.userRoleID ??
              logData?.UserRoleId ??
              logData?.userRoleId
          );
          const targetUrl = userRoleId === 2 ? '/Home' : '/analytics-dashboard';

          this.inactive.setUserlogginValue();
          this.sharedService.triggerLoadComponent(false);
          this.router.navigateByUrl(targetUrl, { replaceUrl: true });
        } else {
          // ====== Failure case ======
          notify(
            {
              message: response.message || 'Verification failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 5000,
            },
            'error',
          );

          // Still proceed with login flow
          const logData =
            this.authService.getUserData() ||
            JSON.parse(localStorage.getItem('logData') || '{}');
          const userRoleId = Number(
            logData?.UserRoleID ??
              logData?.userRoleID ??
              logData?.UserRoleId ??
              logData?.userRoleId
          );
          const targetUrl = userRoleId === 2 ? '/Home' : '/analytics-dashboard';

          this.inactive.setUserlogginValue();
          this.sharedService.triggerLoadComponent(false);
          this.router.navigateByUrl(targetUrl, { replaceUrl: true });
        }
      },
      (err) => {
        notify(
          {
            message: `Error: ${err.message}`,
            position: { at: 'top right', my: 'top right' },
            displayTime: 5000,
          },
          'error',
        );
      },
    );
  }

  // ====== Notify helper ======
  private showNotify(message: string, type: 'success' | 'error') {
    notify(
      {
        message,
        position: { at: 'top right', my: 'top right' },
        displayTime: 5000,
      },
      type,
    );
  }

  onCreateAccountClick = () => {
    this.router.navigate([this.createAccountLink]);
  };

  async ngOnInit(): Promise<void> {
    this.getSecurityPolicyData();
  }

  getSecurityPolicyData() {
    this.userservice.getUserSecurityPolicityData().subscribe((res: any) => {
      this.securityPolicyData = res;
      // console.log('user security policy data', this.securityPolicyData);
    });
  }

  onForgotPasswordClick(event: Event) {
    event.preventDefault(); // Prevent default navigation

    // Check if either Email or SMS is enabled
    if (
      this.securityPolicyData?.EmailEnabled &&
      this.securityPolicyData?.IsEmailVerified &&
      this.securityPolicyData?.CanSendEmailOTP
    ) {
      // Navigate programmatically
      this.router.navigate([this.resetLink]);
    } else {
      // Show toast notification
      notify({
        message:
          'Password Reset is not allowed because Email service is disabled. Please contact your Administrator.',
        position: { at: 'top right', my: 'top right' },
        type: 'error',
      });
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    LoginOauthModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxPopupModule,
    DxTextBoxModule,
    DxLoadPanelModule,
  ],
  declarations: [LoginFormComponent],
  exports: [LoginFormComponent],
})
export class LoginFormModule {}
