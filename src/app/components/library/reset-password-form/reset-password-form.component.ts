import { CommonModule } from '@angular/common';
import {
  Component,
  NgModule,
  Input,
  OnInit,
  ViewChildren,
  QueryList,
  NgZone,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  DxButtonModule,
  DxTextBoxComponent,
  DxTextBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from 'src/app/pages/MASTER PAGES/master-report.service';
import { AuthService, IResponse } from 'src/app/services';
import { UserService } from 'src/app/services/user.service';

const notificationText =
  "We've sent a link to reset your password. Check your inbox.";

@Component({
  selector: 'reset-password-form',
  templateUrl: './reset-password-form.component.html',
  styleUrls: ['./reset-password-form.component.scss'],
})
export class ResetPasswordFormComponent implements OnInit, OnDestroy {
  @Input() buttonLink = '/auth/login';
  @ViewChild('validationGroup', { static: true })
  validationGroup: DxValidationGroupComponent;
  @ViewChildren('otp1, otp2, otp3, otp4, otp5, otp6')
  otpInputs: QueryList<DxTextBoxComponent>;
  formData: any = {};
  otpSent: boolean = false;
  otpVerified: boolean = false;
  generatedOtp: string = '';
  headerTitle: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  formHeight: number = 300; // Initial form height
  otpMessage: string = '';
  timer: number = 0; // Timer in seconds (e.g., 2 minutes)
  interval: any;
  isGetOtpButtonDisabled: boolean = false; // Add this line
  isVerifyOtpButtonDisabled: boolean = false;
  isSubmitPasswordButtonDisabled: boolean = true;
  UserID: number = 0;
  securityPolicyData: any;
  confirmPasswordBorderColor: string = '1px solid #ddd'; // Default border color
  isPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;
  loading: boolean = false; // Add a loading flag
  Verifyloading: boolean = false;
  emailValidationRules: Array<any> = [
    { type: 'required', message: 'Email or Phone number is required' },
    {
      type: 'custom',
      validationCallback: (e) => this.validateEmailOrPhone(e.value),
      message: 'Invalid email or phone number format',
    },
  ];

  EmailEnabled:boolean = false;
  SmsEnabled:boolean = false;
  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private userservice: MasterReportService
  ) {}

  validateEmailOrPhone(value: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[1-9]\d{1,14}$/; // Adjust as necessary
    return emailPattern.test(value) || phonePattern.test(value);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  onEmailOrPhoneInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.isGetOtpButtonDisabled = !this.validateEmailOrPhone(
      inputElement.value
    );
  }

  ngOnInit(): void {
    this.formData = {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    };

    this.getSecurityPolicyData();
    this.isGetOtpButtonDisabled = true;
  }

  // Function to start the timer
  startTimer() {
    this.timer = 60;
    this.isGetOtpButtonDisabled = true;

    // Clear any existing interval to avoid multiple intervals running
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      // Ensure the view is updated by running inside NgZone
      this.ngZone.run(() => {
        if (this.timer > 0) {
          this.timer--;
          this.cdr.detectChanges();
        } else {
          clearInterval(this.interval); // Stop the timer when it reaches 0
          notify(
            {
              message: 'OTP expired. Please request a new one.',
              position: { at: 'top center', my: 'top center' },
              delay: 4000,
            },
            'error'
          );
          this.isGetOtpButtonDisabled = false;
          this.otpSent = false;
          this.formHeight = 300;
          this.otpDigits = ['', '', '', '', '', ''];
        }
      });
    }, 1000); // Update timer every second
  }

  // Helper function to mask email or phone number
  maskEmailOrPhone(input: string): string {
    if (input.includes('@')) {
      // Mask email: show first two characters, and mask part of the domain after '@'
      const [name, domain] = input.split('@');

      // Mask the name part (show only the first 2 characters)
      const maskedName = name.substring(0, 2) + '*'.repeat(name.length - 2);

      // Split the domain into two parts (before and after the first dot)
      const [domainName, domainExt] = domain.split('.');

      // Mask the domain part (show only the first character after @)
      const maskedDomain = domainName[0] + '*'.repeat(domainName.length - 1);

      return `${maskedName}@${maskedDomain}.${domainExt}`;
    } else {
      //show last 3 digit only
      const length = input.length;
      if (length <= 3) {
        return '*'.repeat(length); // If the number has 3 or fewer digits, mask all
      }
      return '*'.repeat(length - 3) + input.slice(-3); // Mask all but the last 3 digits
    }
  }

  // Function called when "Get OTP" button is clicked
  onGetOtp() {
    this.otpDigits = ['', '', '', '', '', ''];

    const emailorphone = this.formData.email;

    // Validate the entire validation group
    const validationResult = this.validationGroup.instance.validate();

    // Check if the form is valid before proceeding
    if (!validationResult.isValid) {
      return; // Stop execution if form is not valid; error messages will be shown next to the fields
    }

    if (!this.formData.email) {
      notify(
        {
          message: 'Please enter your email or phone number',
          position: { at: 'top center', my: 'top center' },
          delay: 4000,
        },
        'error'
      );
      return;
    }

    this.isGetOtpButtonDisabled = true;
    this.loading = true; // Start the loading indicator

    this.formData.email = ''; // Clear the email/phone field
    this.validationGroup.instance.reset(); // Reset validation
    // // Generate a 6-digit OTP
    // this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    // console.log('Generated OTP:', this.generatedOtp);

    const data = {
      MobileNo: '',
      EmailID: emailorphone,
    };

    this.userservice.getOtp(data).subscribe((res) => {
      // console.log(res,"result");
      if (res.Flag === 1) {
        this.UserID = res.UserID;
        const maskedContact = this.maskEmailOrPhone(res.EmailID);
        // console.log(maskedContact,"maskedcontact")
        notify(
          {
            message: `OTP has been sent to ${maskedContact}`,
            position: { at: 'top center', my: 'top center' },
            delay: 4000,
          },
          'success'
        );
        this.otpMessage = `OTP has been sent to ${maskedContact}`;
        this.generatedOtp = res.EmailOTP;
        // console.log(this.generatedOtp, 'generated otp');
        // // Hide email/phone input and show OTP input
        this.loading = false;
        this.otpSent = true;
        // this.headerTitle = 'Verify OTP'; // Change header after sending OTP
        this.formHeight = 500;

        this.startTimer();
      } else if (res.Flag === 0) {
        this.loading = false;
        notify(
          {
            message: `${res.Message}`,
            position: { at: 'top center', my: 'top center' },
            delay: 4000,
          },
          'error'
        );
      }
    });
  }

  onOtpKeyUp(event: KeyboardEvent, index: number) {
    let inputValue = (event.target as HTMLInputElement).value;

    // Move to the next field if a digit is entered
    if (inputValue && index < this.otpDigits.length - 1) {
      const nextInputEl = this.otpInputs.toArray()[index + 1];
      this.otpDigits[index] = inputValue;
      this.focusNextInput(nextInputEl);
    }

    // Move to the previous field on Backspace
    if (event.key === 'Backspace' && !inputValue && index > 0) {
      const prevInputEl = this.otpInputs.toArray()[index - 1];
      this.otpDigits[index] = ''; // Clear the current input
      this.focusNextInput(prevInputEl);
    }
  }

  focusNextInput(inputComponent: DxTextBoxComponent) {
    if (inputComponent) {
      const inputElement =
        inputComponent.instance['element']().querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
    }
  }

  // Function called when "Verify OTP" button is clicked
  verifyOtp() {
    this.Verifyloading = true;
    const otp = this.otpDigits.join('');
    // console.log('Entered OTP:', otp);
    // console.log('Generated OTP:', this.generatedOtp);
    if (otp === this.generatedOtp) {
      this.isVerifyOtpButtonDisabled = true;
      clearInterval(this.interval);
      this.Verifyloading = false;
      notify(
        {
          message: 'OTP verified successfully',
          position: { at: 'top center', my: 'top center' },
          delay: 4000,
        },
        'success'
      );
      this.otpSent = false;
      this.otpVerified = true; // Show new password form
      this.headerTitle = 'Set New Password'; // Change header after OTP is verified
      this.formHeight = 500;
    } else {
      this.Verifyloading = false;
      notify(
        {
          message: 'Invalid OTP. Please try again.',
          position: { at: 'top center', my: 'top center' },
          delay: 4000,
        },
        'error'
      );
    }
  }

  // Function called when "Submit" button is clicked for password reset
  resetPassword() {
    const validationResult = this.validationGroup.instance.validate();

    // Check if the form is valid before proceeding
    if (!validationResult.isValid) {
      return; // Stop execution if form is not valid; error messages will be shown next to the fields
    }

    // Check if the new password meets the security policy
    if (!this.checkPasswordStrength()) {
      // Show error message if the password does not meet the security policy
      notify(
        {
          message: 'New password does not meet the security requirements.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 500,
        },
        'error'
      );
      return; // Stop execution if the password does not meet the policy
    }

    const data = {
      UserID: this.UserID,
      NewPassword: this.formData.newPassword,
      ChangePasswordOnLogin: false,
      ModifiedFrom: this.UserID,
    };

    // console.log(data, 'postdata');

    this.userservice.reset_Password(data).subscribe((res) => {
      if (res.flag === '1') {
        notify(
          {
            message: 'Password reset successfully. Redirecting to login...',
            position: { at: 'top center', my: 'top center' },
            delay: 3000,
          },
          'success'
        );
        // Redirect to login page after successful password reset
        setTimeout(() => {
          this.router.navigate([this.buttonLink]);
          // Reset the form after submission or redirect
        }, 3000);
      } else if (res.flag === '0') {
        notify(
          {
            message: `${res.message}`,
            position: { at: 'top center', my: 'top center' },
            delay: 2000,
          },
          'error'
        );
      }
    });
  }

  getSecurityPolicyData() {
    this.userservice.getUserSecurityPolicityData().subscribe((res: any) => {
      this.securityPolicyData = res.data[0];
      this.EmailEnabled = res.EmailEnabled;
      this.SmsEnabled = res.SmsEnabled
      // console.log('user security policy data', this.securityPolicyData);
    });
  }
  checkNumbers(): boolean {
    return this.securityPolicyData.Numbers
      ? /\d/.test(this.formData.newPassword)
      : true;
  }

  checkUppercase(): boolean {
    return this.securityPolicyData.UppercaseCharacters
      ? /[A-Z]/.test(this.formData.newPassword)
      : true;
  }

  checkLowercase(): boolean {
    return this.securityPolicyData.LowercaseCharacters
      ? /[a-z]/.test(this.formData.newPassword)
      : true;
  }

  checkSpecialCharacters(): boolean {
    return this.securityPolicyData.SpecialCharacters
      ? /[!@#$%^&*(),.?":{}|<>]/.test(this.formData.newPassword)
      : true;
  }

  checkMinimumLength(): boolean {
    return (
      this.formData.newPassword.length >= this.securityPolicyData.MinimumLength
    );
  }

  validatePasswordMatch = (): boolean => {
    return this.formData.newPassword === this.formData.confirmPassword;
  };

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible; // Toggle the visibility
  }
  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible; // Toggle the visibility
  }

  onPasswordKeyDown(event: any): void {
    const target = event.target as HTMLInputElement;

    // Remove spaces from the current value
    const sanitizedValue = target.value.replace(/\s/g, '');

    // Update the target value and the newPassword property
    target.value = sanitizedValue;
    this.formData.newPassword = sanitizedValue; // Update the password value

    this.checkPasswordStrength(); // Call the function to check the strength of the password
  }

  checkPasswordStrength(): boolean {
    // Skip password validation if not required
    if (
      !this.securityPolicyData ||
      !this.securityPolicyData.PasswordValidationRequired
    ) {
      return true;
    }

    return (
      this.checkNumbers() &&
      this.checkUppercase() &&
      this.checkLowercase() &&
      this.checkSpecialCharacters() &&
      this.checkMinimumLength()
    );
  }

  onConfirmPasswordKeyDown(event: Event): void {
    // Capture current input value
    const target = event.target as HTMLInputElement;
    setTimeout(() => {
      this.formData.confirmPassword = target.value; // Get the updated password after keydown
      this.validateConfirmPassword(); // Call the function to check the strength of the password
    }, 0);
  }

  validateConfirmPassword() {
    if (!this.formData.newPassword || !this.formData.confirmPassword) {
      // If either newPassword or confirmPassword is empty, set border color to red
      this.confirmPasswordBorderColor = '2px solid red';
      this.isSubmitPasswordButtonDisabled = true;
    } else if (this.formData.newPassword === this.formData.confirmPassword) {
      // If both passwords match, set border color to green
      this.confirmPasswordBorderColor = '2px solid green';
      this.isSubmitPasswordButtonDisabled = false;
    } else {
      // If passwords don't match, set border color to red
      this.confirmPasswordBorderColor = '2px solid red';
      this.isSubmitPasswordButtonDisabled = true;
    }
  }

  redirectToLogin() {
    this.router.navigate(['/auth/login']); // Adjust the route to your actual login page path
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
  ],
  declarations: [ResetPasswordFormComponent],
  exports: [ResetPasswordFormComponent],
})
export class ResetPasswordFormModule {}
