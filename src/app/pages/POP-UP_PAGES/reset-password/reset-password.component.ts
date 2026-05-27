import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DxButtonModule, DxPopupModule, DxTextBoxModule, DxTooltipModule, DxValidatorModule } from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnChanges {

  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  generatedPassword: string = '';
  tooltipVisible = false;
  securityPolicyData:any;
  loginuserId:any;
  formData: any;
  newFormData: any;

  constructor(private service:MasterReportService){
      this.loginuserId=sessionStorage.getItem('UserID');
      console.log(this.loginuserId,"userid")

      this.service.getUserSecurityPolicityData().subscribe((res:any)=>{
        this.securityPolicyData = res.data[0];
        console.log('user security policy data',this.securityPolicyData)
        this.generatedPassword = this.generateRandomPassword();
      })

  this.formData = {
    NewPassword: '',
    ChangePasswordOnLogin:true,
    ModifiedFrom:this.loginuserId,
    UserID:''
  }
  this.newFormData = this.formData;
}

  generateRandomPassword(): string {
    // Fetch the minimum length from security policy; default to 8 if not provided
    const minLength = Math.max(this.securityPolicyData.MinimumLength || 8, 8); // Ensure a minimum length of at least 8

    // Set a maximum length (e.g., 12) or based on your requirement
    const maxLength = 12;

    // Calculate random length between minLength and maxLength
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    const specialChars = "@#$%&*";
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    // Initialize password and characters array
    let password = '';
    const characters = [];
    const requiredCharacters = [];

    // Include character sets and ensure at least one character from each selected set
    if (this.securityPolicyData.Numbers) {
      characters.push(numbers);
      requiredCharacters.push(numbers.charAt(Math.floor(Math.random() * numbers.length)));
    }
    if (this.securityPolicyData.UppercaseCharacters) {
      characters.push(upperCase);
      requiredCharacters.push(upperCase.charAt(Math.floor(Math.random() * upperCase.length)));
    }
    if (this.securityPolicyData.LowercaseCharacters) {
      characters.push(lowerCase);
      requiredCharacters.push(lowerCase.charAt(Math.floor(Math.random() * lowerCase.length)));
    }
    if (this.securityPolicyData.SpecialCharacters) {
      characters.push(specialChars);
      requiredCharacters.push(specialChars.charAt(Math.floor(Math.random() * specialChars.length)));
    }

    // Ensure there are character sets to choose from
    if (characters.length === 0) {
      throw new Error('No character sets selected based on the security policy.');
    }

    // Add at least one character of each required type to the password
    requiredCharacters.forEach(char => password += char);

    // Calculate remaining length to fill
    const remainingLength = length - requiredCharacters.length;

    // Fill the rest of the password with random characters from the selected sets
    for (let i = 0; i < remainingLength; i++) {
      const charSet = characters[Math.floor(Math.random() * characters.length)];
      password += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }

    // Shuffle the password to ensure randomness
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    return password;
  }

  refreshPassword(): void {
    this.generatedPassword = this.generateRandomPassword(); // Call your existing method to generate a random password
  }

  copyToClipboard(): void {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available. Make sure you are running the application over HTTPS.');
      // Optionally show a user-friendly message or fallback logic
      this.tooltipVisible = false;
      return;
    }

    navigator.clipboard.writeText(this.generatedPassword).then(() => {
      this.tooltipVisible = true;
      console.log('Password copied to clipboard');
    }).catch(err => {
      console.error('Error copying password to clipboard', err);
      // You can show an error message to the user here
    });
  }

  ResetPassword(){
    console.log(this.newFormData,"formdata");
    this.service.reset_Password(this.newFormData).subscribe(data=>{
      try {
        if(data.message==='Success')
        {
        notify(
          {
            message: 'Password reset done successfully',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'success'
        );
        this.close();
      }
      } catch (error) {
        notify(
          {
            message: 'Password reset operation failed',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error'
        );
      }
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.formdata && changes.formdata.currentValue) {
      console.log(this.formdata, "..............");
      this.formData.UserID=this.formdata;
    }
  }

  close(){
    this.closeForm.emit();
  }

}
@NgModule({
  imports: [
    CommonModule,
    DxTextBoxModule,
    DxButtonModule,
    DxValidatorModule,
    BrowserModule,
    DxTooltipModule,
    DxPopupModule
  ],
  providers: [],
  declarations: [ResetPasswordComponent],
  exports: [ResetPasswordComponent],
})
export class ResetPasswordModule {}
