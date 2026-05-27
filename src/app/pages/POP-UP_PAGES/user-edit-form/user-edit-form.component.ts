import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import notify from 'devextreme/ui/notify';
import {
  DxTabPanelModule,
  DxCheckBoxModule,
  DxSelectBoxModule,
  DxTemplateModule,
  DxTabsModule,
  DxTextBoxModule,
  DxButtonModule,
  DxDataGridModule,
  DxTreeViewModule,
  DxValidatorModule,
  DxValidatorComponent,
  DxValidationSummaryModule,
  DxRadioGroupModule,
  DxDateBoxModule,
  DxFileUploaderModule,
  DxProgressBarModule,
  DxFileUploaderComponent,
  DxTooltipModule,
  DxValidationGroupModule,
  DxNumberBoxModule,
  DxValidationGroupComponent,
  DxPopupModule,
  DxListModule,
  DxDropDownBoxModule,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { FormTextboxModule } from 'src/app/components';
import { BrowserModule } from '@angular/platform-browser';
import CountryList from 'country-list-with-dial-code-and-flag';
import { UserComponent } from '../../MASTER PAGES/user/user.component';
import {
  ResetPasswordComponent,
  ResetPasswordModule,
} from '../reset-password/reset-password.component';

@Component({
  selector: 'app-user-edit-form',
  templateUrl: './user-edit-form.component.html',
  styleUrls: ['./user-edit-form.component.scss'],
})
export class UserEditFormComponent implements OnInit, OnChanges {
  @ViewChild('validationGroup', { static: true })
  validationGroup: DxValidationGroupComponent;
  @ViewChild(UserEditFormComponent) editform: UserEditFormComponent;
  @ViewChild(UserComponent) list: UserComponent;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  @Input() formdata: any;

  @Output() closeForm = new EventEmitter();

  selectedRows: any[] = [];
  resetConfirmationVisible = false;
  resetFormVisible = false;
  UserID: any;
  popupToolbarItems: any = [
    {
      widget: 'dxButton',
      location: 'after',
      options: {
        onClick: () => (this.resetConfirmationVisible = false),
      },
    },
  ];
  PhotoFile: any;

  userData: any = {
    UserName: '',
    Password: '',
    DateofBirth: '',
    UserRoleID: '',
    Whatsapp: '',
    LoginName: '',
    GenderID: '',
    Email: '',
    Mobile: '',
    countryCode: '',
    IsInactive: false,
    InactiveReason: '',
    IsLocked: false,
    LockDateFrom: '',
    LockDateTo: '',
    LoginExpiryDate: '',
    PhotoFile: '',
    user_facility: [],
    Date_Format: '',
    Time_Format: '',
    // Decimal_Points:'',
    // Currency_Symbol:'',
  };

  newUserData = this.userData;

  images: string[] = [];
  stylingMode: any = 'primary';
  iconPosition: any = 'left';
  orientations: any = 'horizontal';
  scrollByContent: boolean = true;
  showNavButtons: boolean = true;
  isPasswordVisible = false;
  securityPolicyData: any;
  facilityList;
  countryCodes: any[] = [];
  isImageUploaded = false; // Variable to track image upload status

  isDropZoneActive = false;
  imageSource = '';
  textVisible = true;
  progressVisible = false;
  progressValue = 0;
  allowedFileExtensions: string[] = ['.jpg', '.jpeg', '.gif', '.png'];
  selectedIndex: number = 0; // Default to the first tab (User)
  generatedPassword: string = '';
  tooltipVisible = false;
  onShowEvent = 'click';
  onHideEvent = 'click';
  selectedRowCount: number = 0;

  // Radio button options
  userTypes = ['Normal User', 'Clinician'];
  gender: any;
  userRole: any;
  clinicianOptions = ['clinician1', 'clinician2', 'clinician3'];
  isLocked: boolean = false;
  isInactive: boolean = false;
  showUserDetails: boolean = true; // Show User Details by default
  showOptions: boolean = true; // Show Options by default
  selectedUserType: string = this.userTypes[0]; // Default to 'Normal User'
  userList: any;
  tabItems = [{ text: 'Facility' }, { text: 'Options' }];
  facilityData = [
    { license: 'F12345', facility: 'Facility 1' },
    { license: 'F67890', facility: 'Facility 2' },
    { license: 'F54321', facility: 'Facility 3' },
  ];

  facilityColumns = [
    { dataField: 'license', caption: 'Facility License' },
    { dataField: 'facility', caption: 'Facility' },
  ];

  public isDropdownOpen: boolean = false;
  currentLoginName: any;
  currentEmail: any;

  dateFormat: any;
  timeFormat: any;
  decimal: any;
  exampleDateFormat: any;
  currencySymbol: any;
  exampleTimeFormat: any;

  constructor(
    private service: MasterReportService,
    private cdr: ChangeDetectorRef
  ) {}

  onTabClick(event: any) {
    console.log(event);
    this.selectedIndex = event.itemIndex;
  }

  getNewUserData = () => ({ ...this.newUserData });

  getUSerData() {
    this.service.get_User_data().subscribe((data) => {
      this.userList = data;
      console.log('datasource', this.userList);
    });
  }

  onDecimalInput(event: any) {
    this.newUserData.Decimal_Points = event.value;
  }

  onLoginNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Remove spaces from the current value and sanitize it
    const sanitizedValue = target.value
      .replace(/\s/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    // Check if the first character is an alphabet
    if (sanitizedValue.length > 0 && /^[a-zA-Z]/.test(sanitizedValue[0])) {
      // Update the target value and the LoginName property
      target.value = sanitizedValue;
      this.newUserData.LoginName = sanitizedValue; // Update the login name value

      // Validate the login name directly
      this.checkLoginNameExists({ value: sanitizedValue });
    } else {
      // If the first character is not an alphabet, reset the input
      target.value = ''; // Optionally clear the input
      this.newUserData.LoginName = ''; // Reset the login name value
    }
  }

  checkLoginNameExists = (e: any): boolean => {
    const loginName = e.value;

    // Check if the login name exists in the user list, excluding the current one
    const exists = this.userList.some(
      (user) =>
        user.LoginName === loginName && user.LoginName !== this.currentLoginName
    );

    // Return true if it does NOT exist, false if it DOES exist
    e.valid = !exists;

    // Optional: You can also provide feedback to the user here if needed
    if (!e.valid) {
      // Logic to show a message indicating the login name already exists
      console.log('Login name already exists.');
    }

    return e.valid;
  };

  // This function removes spaces from the email input and updates the Email property
  onEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Remove spaces from the email input
    const sanitizedValue = target.value.replace(/\s/g, '');

    // Update the target value and the Email property
    target.value = sanitizedValue;
    this.newUserData.Email = sanitizedValue;
    this.checkEmailExists({ value: sanitizedValue });
  }

  // This function checks if the email already exists in the user list
  checkEmailExists = (e: any): boolean => {
    const email = e.value;

    // Check if the email already exists in the user list
    const exists = this.userList.some(
      (user) =>
        user.Email.toLowerCase() === email.toLowerCase() &&
        user.Email !== this.currentEmail
    );

    // Return true if it does NOT exist, false if it DOES exist
    e.valid = !exists;
    return e.valid;
  };

  // Function to handle selection changes
  onSelectionChanged(e: any) {
    // Map selected row keys to the desired format
    this.newUserData.user_facility = e.selectedRowKeys.map((key: number) => ({
      // Generate an ID for each entry starting from 1
      FacilityID: key, // Assign the selected FacilityID
    }));
    console.log('User Facility:', this.userData.user_facility);
    this.selectedRowCount = e.selectedRowKeys.length;

    // Reorder facilityList based on selectedRows
    this.facilityList = [
      // Selected facilities first
      ...this.facilityList.filter((facility) =>
        this.selectedRows.includes(facility.ID)
      ),
      // Non-selected facilities after
      ...this.facilityList.filter(
        (facility) => !this.selectedRows.includes(facility.ID)
      ),
    ];

    this.cdr.detectChanges();
  }

  onSubmit() {
    console.log('userform data');
  }

  toggleUserDetails(): void {
    this.showUserDetails = !this.showUserDetails;
  }

  toggleOptions(): void {
    this.showOptions = !this.showOptions;
  }
  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible; // Toggle the visibility flag
  }

  preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDragEnter(e: Event) {
    this.preventDefaults(e);
    (e.target as HTMLElement).classList.add('highlight');
  }

  handleDragLeave(e: Event) {
    this.preventDefaults(e);
    (e.target as HTMLElement).classList.remove('highlight');
  }

  handleDrop(event: DragEvent) {
    this.preventDefaults(event);
    if (event.dataTransfer && event.dataTransfer.files) {
      const file = event.dataTransfer.files[0];
      this.readFile(file);
    }
  }

  handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.readFile(file);
      this.resetFileInput(); // Reset the file input after selecting a file
    }
  }

  // Function to reset the file input
  resetFileInput() {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = ''; // Reset the file input value
    }
  }

  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.isImageUploaded = true;
      this.newUserData.PhotoFile = result;
      this.images = [result]; // Only store one image
    };
    reader.readAsDataURL(file);
  }

  previewFile(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        this.images.push(reader.result);
      }
    };
  }

  removeImage() {
    this.isImageUploaded = false;
    this.images = []; // Clear the image
    this.newUserData.PhotoFile = ''; // Clear the stored file data
  }

  getCountryCodeList() {
    const codes = CountryList.getAll(); // Get all country codes
    this.countryCodes = codes.map((country: any) => ({
      data: country.data,
    }));
    console.log(this.countryCodes, 'country code'); // Optional: For debugging
  }

  // Use this function to display based on dropdown state
  countryCodeDisplay = (item: any) => {
    return item
      ? this.isDropdownOpen
        ? `${item.data.flag} ${item.data.dial_code} - ${item.data.name}`
        : `${item.data.flag}`
      : ''; // Display only country flag before dropdown is opened
  };

  // Triggered when the dropdown is opened
  onDropdownOpened() {
    this.isDropdownOpen = true; // Mark dropdown as open
  }

  // Triggered when the dropdown is closed
  onDropdownClosed() {
    this.isDropdownOpen = false; // Mark dropdown as closed
  }

  extractCountryCode(mobileNumber: string): string | null {
    // Extract the dial code from the mobile number
    const dialCode = this.countryCodes.find((code) =>
      mobileNumber.startsWith(code.data.dial_code)
    );
    return dialCode ? dialCode.data.dial_code : null;
  }

  // getOnlyMobileNumber(fullPhoneNumber: string): string {
  //   // Extract mobile number by removing the dial code part
  //   const selectedCountry = this.countryCodes.find((code) =>
  //     fullPhoneNumber.startsWith(code.data.dial_code)
  //   );

  //   if (selectedCountry) {
  //     return fullPhoneNumber.replace(selectedCountry.data.dial_code, '').trim();
  //   }

  //   return fullPhoneNumber; // Return as is if no match found
  // }

  onDecimalPointsChanged(event: any): void {
    this.newUserData.Decimal_Points = event.value; // Ensure the value is updated in newUserData
    console.log('Updated Decimal_Points:', this.newUserData.Decimal_Points);
  }


  
  updateMobileNumber() {
    const selectedCountry = this.countryCodes.find(
      (code) => code.data.dial_code === this.newUserData.countryCode
    );

    if (selectedCountry) {
      const dialCode = selectedCountry.data.dial_code;

      // Extract and validate the mobile number part only
      const mobileNumber = this.getOnlyMobileNumber(this.newUserData.Mobile);
      const validMobileNumber = this.validateMobileNumber(mobileNumber);

      // Always keep dial code + valid number (or just dial code if invalid)
      this.newUserData.Mobile = validMobileNumber
        ? `${dialCode}${validMobileNumber}`
        : dialCode;

      console.log('Updated Mobile:', this.newUserData.Mobile);
    }
  }

  getOnlyMobileNumber(fullPhoneNumber: string): string {
    const selectedCountry = this.countryCodes.find((code) =>
      fullPhoneNumber.startsWith(code.data.dial_code)
    );

    if (selectedCountry) {
      return fullPhoneNumber.replace(selectedCountry.data.dial_code, '').trim();
    }

    return fullPhoneNumber;
  }

  onMobileInputChange(event: any) {
    const target = event.event?.target as HTMLInputElement;
    let newValue = event.value || '';

    const selectedCountry = this.countryCodes.find(
      (code) => code.data.dial_code === this.newUserData.countryCode
    );

    if (selectedCountry) {
      const dialCode = selectedCountry.data.dial_code;

      // Force country code at the start
      if (!newValue.startsWith(dialCode)) {
        newValue = dialCode;
      }

      // Extract and validate number part
      const mobileNumberPart = newValue.replace(dialCode, '').trim();
      const validMobileNumber = this.validateMobileNumber(mobileNumberPart);

      // Keep dial code intact
      this.newUserData.Mobile = validMobileNumber
        ? `${dialCode}${validMobileNumber}`
        : dialCode;

      // Update textbox value
      if (target) {
        target.value = this.newUserData.Mobile;
      }
    }
  }

  validateMobileNumber(mobileNumber: string): string {
    const digitsOnly = mobileNumber.replace(/\D/g, '');

    // Invalid if starts with 0 or is all zeros
    if (/^0/.test(digitsOnly) || /^0+$/.test(digitsOnly)) {
      return '';
    }

    return digitsOnly;
  }

  MobileNumberValidate = (e: any): boolean => {
  const selectedCountry = this.countryCodes.find(
    (code) => code.data.dial_code === this.newUserData.countryCode
  );

  // If no country selected → invalid
  if (!selectedCountry) {
    e.rule.message = 'Select country code first';
    return false;
  }

  const dialCode = selectedCountry.data.dial_code || '';
  const mobileValue = e.value ? e.value.toString().trim() : '';

  // Remove dial code and non-digit characters
  const mobileNumber = mobileValue.replace(dialCode, '').replace(/\D/g, '');

  // Country-specific length rules
  let minLength = 10; // default
  let maxLength = 10; // default, assume same as min for strict length

  switch (dialCode) {
    case '+971': // UAE
      minLength = 9;
      maxLength = 9;
      break;
    case '+91': // India
      minLength = 10;
      maxLength = 10;
      break;
    case '+1': // USA, Canada
      minLength = 10;
      maxLength = 10;
      break;
    case '+44': // UK
      minLength = 10;
      maxLength = 10;
      break;
    case '+61': // Australia
      minLength = 9;
      maxLength = 9;
      break;
    case '+81': // Japan
      minLength = 10;
      maxLength = 10;
      break;
    case '+49': // Germany
      minLength = 10;
      maxLength = 10;
      break;
    case '+33': // France
      minLength = 9;
      maxLength = 9;
      break;
    case '+86': // China
      minLength = 11;
      maxLength = 11;
      break;
    default:
      minLength = 10;
      maxLength = 15; // fallback max
  }

  // Validation: min/max length, not starting with 0, not all zeros
  const isValid =
    mobileNumber.length >= minLength &&
    mobileNumber.length <= maxLength &&
    !/^0/.test(mobileNumber) &&
    !/^0+$/.test(mobileNumber);

  if (!isValid) {
    e.rule.message = `Mobile number must be ${minLength}${
      minLength !== maxLength ? '-' + maxLength : ''
    } digits long`;
  }

  return isValid;
};


  WhatsappValidate = (e: any): boolean => {
    const whatsappNumber = e.value;

    // Remove all non-digit characters
    const sanitizedNumber = whatsappNumber.replace(/\D/g, '');

    // Check if the sanitized number has at least 10 digits
    if (sanitizedNumber.length >= 10) {
      return true; // Valid
    }
    return false; // Invalid
  };

  validateWhatsapp(event: any) {
    const target = event.target as HTMLInputElement;

    // Allow only input that starts with '+' and contains only digits
    const sanitizedValue = target.value.replace(/[^0-9+]/g, '');

    // Ensure the '+' is only at the start
    if (sanitizedValue.indexOf('+') > 0) {
      target.value = '+' + sanitizedValue.replace(/\+/g, '');
    } else {
      target.value = sanitizedValue;
    }

    // Update the WhatsApp property with the sanitized value
    this.newUserData.Whatsapp = target.value;
  }

  autoBindWhatsapp() {
    console.log('WhatsApp field focused.');
    setTimeout(() => {
      if (!this.newUserData.Whatsapp && this.newUserData.Mobile) {
        console.log(
          'Populating WhatsApp with Mobile:',
          this.newUserData.Mobile
        );
        this.newUserData.Whatsapp = this.newUserData.Mobile;
      }
    }, 0);
  }

  // onDateFormatChange(event: any) {
  //   this.newUserData.Date_Format = event.value;
  //   console.log('Dropdown value changed:', event.value);
  // }

  onDateFormatChange(event: any): void {
    // Directly set the value from the event
    const selectedFormat = this.dateFormat.find(
      (format) => format.DESCRIPTION === event.value
    )?.DESCRIPTION;
    if (selectedFormat) {
      this.newUserData.Date_Format = event.value; // Ensure the correct value is set
      this.exampleDateFormat = this.getFormattedDate(selectedFormat); // Generate the example format
    } else {
      this.exampleDateFormat = '';
    }
  }

  onTimeFormatChange(event: any) {
    const selectedTimeFormat = this.timeFormat.find(
      (format) => format.DESCRIPTION === event.value
    )?.DESCRIPTION;
    if (selectedTimeFormat) {
      this.newUserData.Time_Format = event.value;
      this.exampleTimeFormat = this.getFormattedTime(selectedTimeFormat);
    } else {
      this.exampleTimeFormat = '';
    }
  }

  // onCurrencySymbolChange(event:any){
  //   this.newUserData.Currency_Symbol = event.value;
  //   console.log('Dropdown Currency value changed:', event.value);
  // }

  onCurrencySymbolChange(event: any) {
    const selectedValue = event.value;
    console.log(selectedValue, 'SELECTED');
    if (selectedValue) {
      // Check if the selected value is from the dropdown or entered by the user
      const existingItem = this.currencySymbol.find(
        (item) => item.DESCRIPTION === selectedValue
      );

      if (!existingItem) {
        // If it's a custom value (not from the dropdown)
        console.log('Custom value entered:', selectedValue);
        this.newUserData.Currency_Symbol = selectedValue; // Store the custom value
      } else {
        // If it's a valid value from the dropdown
        console.log('Selected value from dropdown:', selectedValue);
        this.newUserData.Currency_Symbol = selectedValue; // Store the dropdown value
      }
    }
  }
  onCurrencySymbolInput(event: any) {
    const typedValue = event.target.value;
    console.log('Typed value in input field:', typedValue);

    // Update the value as the user types, if necessary
    this.newUserData.Currency_Symbol = typedValue;
  }

  onCurrencySymbolBlur() {
    const enteredValue = this.newUserData.Currency_Symbol;
    console.log('Field lost focus, entered value:', enteredValue);

    // If the value is not part of the dropdown options, treat it as a custom value
    if (enteredValue) {
      const existingItem = this.currencySymbol.find(
        (item) => item.DESCRIPTION === enteredValue
      );

      if (!existingItem) {
        // If it's a custom value (not in dropdown), save it
        console.log('Custom value entered:', enteredValue);
        this.newUserData.Currency_Symbol = enteredValue; // Keep the custom value
      }
    }
  }

  onCurrencySymbolListSelect(event: any) {
    const selectedValue = event.itemData.DESCRIPTION;
    console.log('Dropdown item selected:', selectedValue);
    this.newUserData.Currency_Symbol = selectedValue;
  }

  getFormattedDate(format: string): string {
    const currentDate = new Date();

    // Replace placeholders in the selected format with actual date values
    return format
      .replace('YYYY', currentDate.getFullYear().toString())
      .replace('MM', String(currentDate.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(currentDate.getDate()).padStart(2, '0'))
      .replace('HH', String(currentDate.getHours()).padStart(2, '0'))
      .replace('MM', String(currentDate.getMinutes()).padStart(2, '0'))
      .replace('SS', String(currentDate.getSeconds()).padStart(2, '0'))
      .replace('Month', currentDate.toLocaleString('en-US', { month: 'long' }))
      .replace('Day', currentDate.toLocaleString('en-US', { weekday: 'long' }));
  }

  getFormattedTime(format: string): string {
    const currentDate = new Date();

    // Get components of the date and time
    const hour24 = currentDate.getHours(); // 24-hour format
    const hour12 = hour24 % 12 || 12; // 12-hour format
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const ampm = hour24 >= 12 ? 'PM' : 'AM'; // AM/PM

    // Based on the selected format, return the example time
    switch (format) {
      case 'HH:MM':
        return `${String(hour24).padStart(2, '0')}:${minutes}`; // Example for 'HH:MM'

      case 'HH:MM:SS':
        return `${String(hour24).padStart(2, '0')}:${minutes}:${seconds}`; // Example for 'HH:MM:SS'

      case 'hh:mm a':
        return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`; // Example for 'hh:mm a'

      case 'hh:mm:ss a':
        return `${String(hour12).padStart(
          2,
          '0'
        )}:${minutes}:${seconds} ${ampm}`; // Example for 'hh:mm:ss a'

      default:
        return ''; // Default case
    }
  }

  ngOnInit(): void {
    this.exampleDateFormat;
    this.getDropDownData('GENDER_DATA');
    this.getDropDownData('USER_ROLE');
    this.getDropDownData('DATE_FORMAT');
    this.getDropDownData('TIME_FORMAT');
    this.getDropDownData('CURRENCY_SYMBOL');
    this.getUserSecurityPolicyData();
    this.getFacilityData();
    this.getCountryCodeList();
    this.getUSerData();

    // Pre-fill country code field based on mobile number
    if (this.newUserData.Mobile) {
      const dialCode = this.extractCountryCode(this.newUserData.Mobile);
      if (dialCode) {
        this.newUserData.countryCode = dialCode;
      }
    }
  }

  getDropDownData(data: any) {
    this.service.Get_GropDown(data).subscribe((res) => {
      console.log(res, 'res');
      if (data === 'GENDER_DATA') {
        this.gender = res;
        console.log('gender', this.gender);
      }
      if (data === 'USER_ROLE') {
        this.userRole = res;
        console.log(this.userRole, 'userRole');
      }
      if (data == 'DATE_FORMAT') {
        this.dateFormat = res;
        console.log(this.dateFormat, 'DATEFORMAT');
      }
      if (data == 'TIME_FORMAT') {
        this.timeFormat = res;
        console.log(this.timeFormat, 'TIMEFORMAT');
      }
      if (data == 'CURRENCY_SYMBOL') {
        this.currencySymbol = res;
        console.log(this.currencySymbol, 'currencySymbol');
      }
    });
  }
  getUserSecurityPolicyData() {
    this.service.getUserSecurityPolicityData().subscribe((res: any) => {
      this.securityPolicyData = res.data[0];
      console.log('user security policy data', this.securityPolicyData);
      // this.generatedPassword = this.generateRandomPassword();
    });
  }
  getFacilityData() {
    this.service.Get_All_Facility_List_Data().subscribe((res: any) => {
      this.facilityList = res.data;
      console.log('facility data', this.facilityList);
    });
  }

  resetPassword() {
    this.resetConfirmationVisible = true;
  }
  cancelReset() {
    this.resetConfirmationVisible = false;
  }
  confirmReset() {
    this.resetFormVisible = true;
    this.resetConfirmationVisible = false;
  }

  CloseResetPasswordForm() {
    this.resetFormVisible = false;
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();

    // Check if the form is valid before proceeding
    if (!validationResult.isValid) {
      return; // Stop execution if form is not valid; error messages will be shown next to the fields
    }

    console.log(this.newUserData, 'edit form data');
    console.log(
      'Decimal_Points before saving:',
      this.newUserData.Decimal_Points
    );
    console.log(this.userData.user_facility, 'userfacility');
    this.service.update_User_Data(this.newUserData).subscribe((res: any) => {
      try {
        if (res.message === 'Success') {
          notify(
            {
              message: 'data updated successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
          this.close();
        } else {
          notify(
            {
              message: 'An unexpected error occurred',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
      } catch (error) {
        notify(
          {
            message: 'update operation failed',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error'
        );
      }
    });
  }
  close() {
    this.closeForm.emit();
  }

  preventTyping(event: any): void {
    if (event.event) {
      event.event.preventDefault(); // Prevent keypress
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.formdata && changes.formdata.currentValue) {
      console.log(this.formdata, '..............');
      this.UserID = this.formdata.UserID;
      this.currentLoginName = this.formdata.LoginName;
      this.currentEmail = this.formdata.Email;
      console.log(this.UserID, 'userid');
      this.newUserData = { ...this.formdata };
      if (this.newUserData.PhotoFile) {
        this.isImageUploaded = true;
        this.images = this.newUserData.PhotoFile;
        console.log(this.images, 'photo');
      } else {
        this.isImageUploaded = false;
        this.images = []; // Set images to empty if PhotoFile is not available
        console.log('No photo available');
      }

      const selectedFormat = this.dateFormat.find(
        (format) => format.DESCRIPTION === this.formdata.Date_Format
      )?.DESCRIPTION;
      if (selectedFormat) {
        this.newUserData.Date_Format = this.formdata.Date_Format; // Ensure the correct value is set
        this.exampleDateFormat = this.getFormattedDate(selectedFormat); // Generate the example format
      } else {
        this.exampleDateFormat = '';
      }
      const selectedTimeFormat = this.timeFormat.find(
        (format) => format.DESCRIPTION === this.formdata.Time_Format
      )?.DESCRIPTION;
      if (selectedTimeFormat) {
        this.newUserData.Time_Format = this.formdata.Time_Format;
        this.exampleTimeFormat = this.getFormattedTime(selectedTimeFormat);
      } else {
        this.exampleTimeFormat = '';
      }

      // Extract country code from mobile number
      const extractedCountryCode = this.extractCountryCode(
        this.newUserData.Mobile
      );
      if (extractedCountryCode) {
        this.newUserData.countryCode = extractedCountryCode;
      }

      this.selectedRows = this.facilityList
        .filter((column) =>
          this.newUserData.user_facility.some(
            (facility) => facility.FacilityID === column.ID
          )
        )
        .map((column) => column.ID);

      console.log(this.selectedRows, 'selected rows');

      // Reorder facilityList based on selectedRows
      this.facilityList = [
        // Selected facilities first
        ...this.facilityList.filter((facility) =>
          this.selectedRows.includes(facility.ID)
        ),
        // Non-selected facilities after
        ...this.facilityList.filter(
          (facility) => !this.selectedRows.includes(facility.ID)
        ),
      ];
    }

    this.cdr.detectChanges();
  }


  get isAdminReadonly(): boolean {
  return (
    this.newUserData?.UserName?.toLowerCase() === 'admin' &&
    this.newUserData?.UserRoleID ==1
  );
}

}

@NgModule({
  imports: [
    CommonModule,
    DxTabPanelModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxTemplateModule,
    DxTabsModule,
    DxTextBoxModule,
    DxButtonModule,
    DxDataGridModule,
    DxTreeViewModule,
    DxValidatorModule,
    DxRadioGroupModule,
    FormTextboxModule,
    DxDateBoxModule,
    DxFileUploaderModule,
    DxProgressBarModule,
    BrowserModule,
    DxTooltipModule,
    ReactiveFormsModule,
    DxValidationGroupModule,
    DxNumberBoxModule,
    DxPopupModule,
    ResetPasswordModule,
    DxListModule,
    DxDropDownBoxModule,
  ],
  providers: [],
  declarations: [UserEditFormComponent],
  exports: [UserEditFormComponent],
})
export class UserEditFormModule {}
