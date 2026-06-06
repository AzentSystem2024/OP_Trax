import { SystemServicesService } from './../../../pages/SYSTEM PAGES/system-services.service';
import { CommonModule } from '@angular/common';
import { Component, NgModule, Input, OnInit } from '@angular/core';
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
export class LoginFormComponent implements OnInit {
  @Input() resetLink = '/auth/reset-password';
  @Input() createAccountLink = '/auth/create-account';

  defaultAuthData!: IResponse;

  btnStylingMode!: DxButtonTypes.ButtonStyle;

  passwordMode = 'password';

  loading = false;

  formData: any = {};

  isPasswordVisible: boolean = false;

  loginResponse: any;
  SingleToken: boolean = false;
  securityPolicyData: any;

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
        this.storeSession(response);
        await this.verify_PostOfficeCredencial_Data();
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

          // ====== Redirect logic (MFA or dashboard) ======
          if (this.loginResponse.data.EnableMFA === true) {
            this.sharedService.triggerLoadComponent(false);
            this.router.navigateByUrl('/auth/two-step-verification');
          } else {
            this.inactive.setUserlogginValue();
            this.sharedService.triggerLoadComponent(false);
            this.router.navigateByUrl('/analytics-dashboard');
          }
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
          if (this.loginResponse.data.EnableMFA === true) {
            this.sharedService.triggerLoadComponent(false);
            this.router.navigateByUrl('/auth/two-step-verification');
          } else {
            this.inactive.setUserlogginValue();
            this.sharedService.triggerLoadComponent(false);
            this.router.navigateByUrl('/analytics-dashboard');
          }
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
