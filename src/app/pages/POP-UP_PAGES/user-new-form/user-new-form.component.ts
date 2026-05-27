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
  HostListener,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
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
  DxDropDownBoxModule,
  DxListModule,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { FormTextboxModule } from 'src/app/components';
import { BrowserModule } from '@angular/platform-browser';
import CountryList from 'country-list-with-dial-code-and-flag';

@Component({
  selector: 'app-user-new-form',
  templateUrl: './user-new-form.component.html',
  styleUrls: ['./user-new-form.component.scss'],
  providers: [MasterReportService, ReactiveFormsModule],
})
export class UserNewFormComponent implements OnInit, AfterViewChecked {
  @ViewChild('fileUploader', { static: false })
  fileUploader!: DxFileUploaderComponent; // Update the type here
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild('currencySelectBox') currencySelectBox: ElementRef;
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
    changePasswordOnLogin: false,
    user_facility: [],
    Date_Format: '',
    Time_Format: '',
    // Decimal_Points:'',
    // Currency_Symbol:'',
  };
  newUserData = this.userData;
  selectedRows: any[] = [];
  userForm: FormGroup;
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
  totalRowCount: number = 0;
  userList: any;

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
  isImageUploaded = false; // Variable to track image upload status
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

  //dateformat options

  selectedDropdownOption: string;
  //thousandseparator
  thousandSeparatorValue: number;
  decimal: number;

  public isDropdownOpen: boolean = false;
  dateFormat: any;
  timeFormat: any;
  currencySymbol: any;
  exampleDateFormat: any;
  exampleTimeFormat: any;

  constructor(
    private service: MasterReportService,
    private cdr: ChangeDetectorRef
  ) {}
  getNewUserData = () => ({ ...this.newUserData });

  // Method to handle tab click and set selected index
  onTabClick(event: any) {
    console.log(event);
    this.selectedIndex = event.itemIndex;
  }
  ngAfterViewChecked() {
    this.cdr.detectChanges(); // Triggers change detection
  }

  onDateOfBirthChange(event: any) {
    this.newUserData.DateofBirth = event.value; // Update the model with the selected date
  }
  onLoginExpiryDateChange(event: any) {
    this.newUserData.LoginExpiryDate = event.value; // Update the model with the selected date
  }
  onLockDateFromChange(event: any) {
    this.newUserData.LockDateFrom = event.value; // Update the model with the selected date
  }
  onLockDateToChange(event: any) {
    this.newUserData.LockDateTo = event.value; // Update the model with the selected date
  }
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

  getUSerData() {
    this.service.get_User_data().subscribe((data) => {
      this.userList = data;
      console.log('datasource', this.userList);
    });
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
    const exists = this.userList.some((user) => user.LoginName === loginName);

    // Return true if it does NOT exist, false if it DOES exist
    e.valid = !exists;
    return e.valid;
  };

  onUserNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Regular expression to allow only alphabets with a single space between words
    let sanitizedValue = target.value
      .replace(/[^a-zA-Z\s]/g, '') // Remove all characters except alphabets and spaces
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
      .replace(/^\s+/g, '') // Remove spaces at the beginning of the string
      .toUpperCase();

    target.value = sanitizedValue;
    this.newUserData.UserName = sanitizedValue; // Update the UserName value
  }

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
      (user) => user.Email.toLowerCase() === email.toLowerCase()
    );

    // Return true if it does NOT exist, false if it DOES exist
    e.valid = !exists;
    return e.valid;
  };

  // Email format validation with broader rules
  customEmailValidation = (e: any): boolean => {
    const email = e.value;
    const emailPattern = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailPattern.test(email);
    e.valid = isValid;
    return e.valid;
  };

  // Function to handle selection changes
  onSelectionChanged(e: any) {
    // Map selected row keys to the desired format
    this.userData.user_facility = e.selectedRowKeys.map((key: number) => ({
      // Generate an ID for each entry starting from 1
      FacilityID: key, // Assign the selected FacilityID
    }));
    console.log('User Facility:', this.userData.user_facility);
    this.selectedRowCount = e.selectedRowKeys.length;
  }

  onSubmit() {
    console.log('userform data', this.userForm);
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

  // clearData() {
  //   this.selectedRows = [];
  //   this.newUserData.GenderID = '';
  //   this.newUserData = '';
  //   this.newUserData.Currency_Symbol = null;
  //   this.cdr.detectChanges();
  //   console.log(this.newUserData);
  // }

  clearData() {
    this.selectedRows = []; // Clear any selected rows
    this.newUserData = { Currency_Symbol: null, GenderID: '' }; // Reset to a valid object with initial values
    this.currencySymbol = [...this.currencySymbol]; // Trigger refresh by creating a new reference
    this.cdr.detectChanges(); // Ensure Angular detects changes
    console.log('Form data cleared:', this.newUserData);
  }

  preventTyping(event: any): void {
    if (event.event) {
      event.event.preventDefault(); // Prevent keypress
    }
  }

  ngOnInit(): void {
    this.getDropDownData('GENDER_DATA');
    this.getDropDownData('USER_ROLE');
    this.getDropDownData('DATE_FORMAT');
    this.getDropDownData('TIME_FORMAT');
    this.getDropDownData('CURRENCY_SYMBOL');
    this.getUserSecurityPolicyData();
    this.getFacilityData();
    this.getCountryCodeList();

    this.setDefaultCountryCode();
    this.updateMobileNumber(); // Update mobile field with the default country code
    this.getUSerData();
  }

  setDefaultCountryCode() {
    const defaultCountryCode = '+971'; // Default country code
    const defaultCountry = this.countryCodes.find(
      (code) => code.data.dial_code === defaultCountryCode
    );

    if (defaultCountry) {
      this.newUserData.countryCode = defaultCountry.data.dial_code; // Set the country code
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
      this.generatedPassword = this.generateRandomPassword();
    });
  }

  getFacilityData() {
    this.service.Get_All_Facility_List_Data().subscribe((res: any) => {
      this.facilityList = res.data;
      console.log('facility data', this.facilityList);
    });
  }

  generateRandomPassword(): string {
    // Fetch the minimum length from security policy; default to 8 if not provided
    const minLength = Math.max(this.securityPolicyData.MinimumLength || 8, 8); // Ensure a minimum length of at least 8

    // Set a maximum length (e.g., 12) or based on your requirement
    const maxLength = 12;

    // Calculate random length between minLength and maxLength
    const length =
      Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    const specialChars = '@#$%&*';
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
      requiredCharacters.push(
        numbers.charAt(Math.floor(Math.random() * numbers.length))
      );
    }
    if (this.securityPolicyData.UppercaseCharacters) {
      characters.push(upperCase);
      requiredCharacters.push(
        upperCase.charAt(Math.floor(Math.random() * upperCase.length))
      );
    }
    if (this.securityPolicyData.LowercaseCharacters) {
      characters.push(lowerCase);
      requiredCharacters.push(
        lowerCase.charAt(Math.floor(Math.random() * lowerCase.length))
      );
    }
    if (this.securityPolicyData.SpecialCharacters) {
      characters.push(specialChars);
      requiredCharacters.push(
        specialChars.charAt(Math.floor(Math.random() * specialChars.length))
      );
    }

    // Ensure there are character sets to choose from
    if (characters.length === 0) {
      throw new Error(
        'No character sets selected based on the security policy.'
      );
    }

    // Add at least one character of each required type to the password
    requiredCharacters.forEach((char) => (password += char));

    // Calculate remaining length to fill
    const remainingLength = length - requiredCharacters.length;

    // Fill the rest of the password with random characters from the selected sets
    for (let i = 0; i < remainingLength; i++) {
      const charSet = characters[Math.floor(Math.random() * characters.length)];
      password += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }

    // Shuffle the password to ensure randomness
    password = password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    return password;
  }

  refreshPassword(): void {
    this.generatedPassword = this.generateRandomPassword(); // Call your existing method to generate a random password
  }

  updateMobileNumber() {
    // Find the selected country code
    const selectedCountry = this.countryCodes.find(
      (code) => code.data.dial_code === this.newUserData.countryCode
    );

    if (selectedCountry) {
      const dialCode = selectedCountry.data.dial_code; // Extract country code

      // Extract and validate the mobile number part
      const mobileNumber = this.getOnlyMobileNumber(this.newUserData.Mobile);
      const validMobileNumber = this.validateMobileNumber(mobileNumber);

      // Update the mobile field with valid country code and mobile number
      this.newUserData.Mobile = `${dialCode} ${validMobileNumber}`;

      console.log('Updated Mobile:', this.newUserData.Mobile); // For debugging
    }
  }

  getOnlyMobileNumber(fullPhoneNumber: string): string {
    // Extract mobile number by removing the dial code part
    const selectedCountry = this.countryCodes.find((code) =>
      fullPhoneNumber.startsWith(code.data.dial_code)
    );

    if (selectedCountry) {
      return fullPhoneNumber.replace(selectedCountry.data.dial_code, '').trim();
    }

    return fullPhoneNumber; // Return as is if no match found
  }

  onMobileInputChange(event: any) {
  const target = event.target as HTMLInputElement;

  // Keep the original cursor position
  const cursorPosition = target.selectionStart || 0;

  // Remove invalid characters except digits
  let newValue = target.value.replace(/[^\d]/g, '');

  // Keep dial code intact
  const dialCode = this.newUserData.countryCode || '+1'; // fallback if countryCode missing

  // Remove dial code from typed value if user typed it
  if (newValue.startsWith(dialCode.replace('+', ''))) {
    newValue = newValue.slice(dialCode.length - 1);
  }

  // Update the model, but keep the cursor in place
  this.newUserData.Mobile = `${dialCode} ${newValue}`;

  // Restore cursor position (after dial code)
  setTimeout(() => {
    if (target.selectionStart !== null) {
      target.selectionStart = target.selectionEnd = Math.max(cursorPosition, dialCode.length + 1);
    }
  });
}


  validateMobileNumber(mobileNumber: string): string {
    // Remove any non-digit characters
    const digitsOnly = mobileNumber.replace(/\D/g, '');

    // Ensure the number does not start with zero and return valid number or empty string if invalid
    return digitsOnly.startsWith('0') ? '' : digitsOnly;
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

  copyToClipboard(): void {
    if (!navigator.clipboard) {
      console.warn(
        'Clipboard API not available. Make sure you are running the application over HTTPS.'
      );
      // Optionally show a user-friendly message or fallback logic
      this.tooltipVisible = false;
      return;
    }

    navigator.clipboard
      .writeText(this.generatedPassword)
      .then(() => {
        this.tooltipVisible = true;
        console.log('Password copied to clipboard');
      })
      .catch((err) => {
        console.error('Error copying password to clipboard', err);
        // You can show an error message to the user here
      });
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
    DxDropDownBoxModule,
    DxListModule,
  ],
  providers: [],
  declarations: [UserNewFormComponent],
  exports: [UserNewFormComponent],
})
export class UserNewFormModule {}
