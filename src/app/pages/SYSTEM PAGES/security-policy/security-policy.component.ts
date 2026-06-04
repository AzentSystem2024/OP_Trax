import { CommonModule } from '@angular/common';
import { Component, NgModule, OnDestroy, OnInit } from '@angular/core';
import {
  DxCheckBoxModule,
  DxLoadPanelModule,
  DxSwitchModule,
} from 'devextreme-angular';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxNumberBoxModule } from 'devextreme-angular';
import {
  DxRadioGroupModule,
  DxTemplateModule,
  DxButtonModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { DxFormModule } from 'devextreme-angular';
import { SystemServicesService } from '../system-services.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';
@Component({
  selector: 'app-security-policy',
  templateUrl: './security-policy.component.html',
  styleUrls: ['./security-policy.component.scss'],
  providers: [DataService],
})
export class SecurityPolicyComponent implements OnInit {
  validationRequired: boolean = false;
  readOnlyValue: boolean = true;

  minPasswordLength: any | null = null;
  conditionRequiredValue: boolean = false;

  isNumberChecked: boolean = false;
  isUppercaseChecked: boolean = false;
  isLowercaseChecked: boolean = false;
  isSpecialCharactersChecked: boolean = false;

  LoginAttempts: any | null = null;
  resetDuration: any | null = null;
  failedLoginDuration: any | null = null;

  changePasswordOnLogin: boolean = false;
  passwordExpiryDaysCount: any | null = null;
  passwordRepeatCycle: any | null = null;
  sessionTimeOut: any | null = null;

  unautherizedMessage: any = '';
  disableUserOn: any | null = null;
  presentSecurityData: any;
  tooltipData: any;
  conditionEnableValue: boolean = true;

  minAllowedLength: number = 6;
  userId: any;
  currentPathName: any;
  initialized: boolean=false;

  MFAvalidationRequired: boolean = false;
  isGoogleAuthenticator: boolean = false;
  isMicrosoftAuthenticator: boolean = false;
  isCustomAuthenticator: boolean = false;

  // Custom sub-options
  customSMS: boolean = false;
  customEmail: boolean = false;
  customWhatsapp: boolean = false;
  customSingleToken: boolean = true;
  // customMultipleToken: boolean = false;

  tokenOptions = [
    { label: 'Single Token', value: true },
    { label: 'Multiple Token', value: false },
  ];

  // MFA Applies To
  appliesToLogin: boolean = false;
  appliesToPasswordChange: boolean = false;

  isLoading: boolean = false;
  menuPrevilage: any;

  constructor(
    private systemService: SystemServicesService,
    private router: Router,
    private dataService: DataService,
    private dataservice: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = sessionStorage.getItem('UserID');
    this.get_Present_Security_Policy();

    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataservice.getMenuPrevilages(fullUrl);
    });
  }

  onPasswordLengthChange(e: any) {
    if (e.value < this.minAllowedLength) {
      this.minPasswordLength = this.minAllowedLength;
    } else {
      this.minPasswordLength = e.value;
    }
  }

  get_Present_Security_Policy() {
    // this.isLoading = true;
    this.systemService
      .get_securityPolicy_List(this.userId)
      .subscribe((response: any) => {
        if (response) {
          this.presentSecurityData = response.data[0];
          this.tooltipData = response.Tooltip;
          this.validationRequired =
            this.presentSecurityData.PasswordValidationRequired;
          this.minPasswordLength = this.presentSecurityData.MinimumLength;
          this.isNumberChecked = this.presentSecurityData.Numbers;
          this.isUppercaseChecked =
            this.presentSecurityData.UppercaseCharacters;
          this.isLowercaseChecked =
            this.presentSecurityData.LowercaseCharacters;
          this.isSpecialCharactersChecked =
            this.presentSecurityData.SpecialCharacters;
          this.sessionTimeOut = this.presentSecurityData.SessionTimeoutMinutes;
          this.LoginAttempts = this.presentSecurityData.AccountLockAttempt;
          this.resetDuration = this.presentSecurityData.AccountLockDuration;
          this.failedLoginDuration =
            this.presentSecurityData.AccountLockFailedLogin;
          this.changePasswordOnLogin =
            this.presentSecurityData.UserMustChangePasswordOnLogin;
          this.passwordExpiryDaysCount = this.presentSecurityData.PasswordAge;
          this.passwordRepeatCycle =
            this.presentSecurityData.PasswordRepeatCycle;
          this.unautherizedMessage =
            this.presentSecurityData.UnauthorizedBannerMessage;
          this.disableUserOn =
            this.presentSecurityData.DisableUserOnInactiveDays;
          this.MFAvalidationRequired = this.presentSecurityData.EnableMFA;
          this.isGoogleAuthenticator = this.presentSecurityData.MFAGoogle;
          this.isMicrosoftAuthenticator = this.presentSecurityData.MFAMicrosoft;
          this.isCustomAuthenticator = this.presentSecurityData.MFACustom;

          this.customSMS = this.presentSecurityData.MFASMS;
          this.customEmail = this.presentSecurityData.MFAEmail;
          this.customWhatsapp = this.presentSecurityData.MFAWhatsapp;
          this.customSingleToken = this.presentSecurityData.MFASingleToken;
          this.appliesToLogin = this.presentSecurityData.MFAOnLogin;
          this.appliesToPasswordChange =
            this.presentSecurityData.MFAOnPasswordChange;

          this.isLoading = false;
        }
      });
  }

  onClickSave() {
    const formData = {
      AccountLockAttempt: this.LoginAttempts,
      AccountLockDuration: this.resetDuration,
      AccountLockFailedLogin: this.failedLoginDuration,
      DisableUserOnInactiveDays: this.disableUserOn,
      EnableMFA: this.MFAvalidationRequired,
      LowercaseCharacters: this.isLowercaseChecked,
      MFACustom: this.isCustomAuthenticator,
      MFAEmail: this.customEmail,
      MFAGoogle: this.isGoogleAuthenticator,
      MFAMicrosoft: this.isMicrosoftAuthenticator,
      MFAOnLogin: this.appliesToLogin,
      MFAOnPasswordChange: this.appliesToPasswordChange,
      MFASMS: this.customSMS,
      MFASingleToken: this.customSingleToken,
      MFAWhatsapp: this.customWhatsapp,
      MinimumLength: this.minPasswordLength,
      Numbers: this.isNumberChecked,
      PasswordAge: this.passwordExpiryDaysCount,
      PasswordRepeatCycle: this.passwordRepeatCycle,
      PasswordValidationRequired: this.validationRequired,
      SessionTimeoutMinutes: this.sessionTimeOut,
      SpecialCharacters: this.isSpecialCharactersChecked,
      UnauthorizedBannerMessage: this.unautherizedMessage,
      UppercaseCharacters: this.isUppercaseChecked,
      UserID: this.userId,
      UserMustChangePasswordOnLogin: this.changePasswordOnLogin,
    };

    this.isLoading = true;
    this.systemService
      .save_security_Policy_Data(formData)
      .subscribe((response: any) => {
        if (response) {
          notify(
            {
              message: `Security Policy saved Successfully`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
          this.get_Present_Security_Policy();
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
          this.isLoading = false;
        }
      });
  }

  onClickCancel() {
    // Password policy
    this.validationRequired = false;
    this.minPasswordLength = null;
    this.isNumberChecked = false;
    this.isUppercaseChecked = false;
    this.isLowercaseChecked = false;
    this.isSpecialCharactersChecked = false;

    // Account lock settings
    this.LoginAttempts = null;
    this.resetDuration = null;
    this.failedLoginDuration = null;

    // Change password on login
    this.changePasswordOnLogin = false;

    // Session timeout
    this.sessionTimeOut = null;

    // Password expiry
    this.passwordExpiryDaysCount = null;
    this.passwordRepeatCycle = null;
    // Unauthorized message
    this.unautherizedMessage = '';
    // Inactive user disable
    this.disableUserOn = null;
    // MFA options
    this.MFAvalidationRequired = false;
    this.isGoogleAuthenticator = false;
    this.isMicrosoftAuthenticator = false;
    this.isCustomAuthenticator = false;
    this.appliesToLogin = false;
    this.appliesToPasswordChange = false;
    this.customSMS = false;
    this.customEmail = false;
    this.customWhatsapp = false;
    this.customSingleToken = false;
  }

  //========== only allow select one check box under the MFA ========
  onCheckboxChanged(authType: string, isChecked: any): void {
    if (!isChecked) return; // do nothing when unchecking
    this.isGoogleAuthenticator = authType === 'google';
    this.isMicrosoftAuthenticator = authType === 'microsoft';
    this.isCustomAuthenticator = authType === 'custom';

    if (authType !== 'custom') {
      this.customSMS = false;
      this.customEmail = false;
      this.customWhatsapp = false;
      this.customSingleToken = true;
    }
  }
  //========== Change validation enable or not ====================
  onValidationEnableChange(newValue: boolean): void {
    this.validationRequired = newValue;
    this.readOnlyValue = !this.readOnlyValue;
  }

  format_minutes(value: number): string {
    return `${value} minutes`;
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxNumberBoxModule,
    DxRadioGroupModule,
    DxTemplateModule,
    DxFormModule,
    DxButtonModule,
    DxSwitchModule,
    DxLoadPanelModule,
  ],
  providers: [],
  exports: [],
  declarations: [SecurityPolicyComponent],
})
export class SecurityPolicyModule {}
