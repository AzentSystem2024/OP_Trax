import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  NgModule,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxFormModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxRadioGroupModule,
  DxValidatorComponent,
} from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-clinician-edit-form',
  templateUrl: './clinician-edit-form.component.html',
  styleUrls: ['./clinician-edit-form.component.scss'],
})
export class ClinicianEditFormComponent implements OnChanges {
  @Input() formData: any;

  @ViewChild('clinicianLicenseValidator')
  clinicianLicenseValidator!: DxValidatorComponent;
  @ViewChild('clinicianNameValidator')
  clinicianNameValidator!: DxValidatorComponent;

  newClinicianData = {
    ID: '',
    ClinicianLicense: '',
    ClinicianName: '',
    ClinicianShortName: '',
    SpecialityID: '',
    MajorID: '',
    ProfessionID: '',
    CategoryID: '',
    Gender: '',
    DepartmentID: '',
  };

  newClinician = this.newClinicianData;
  Denial_Type_DropDownData: any;
  Denial_Category_DropDownData: any;
  specialityDatasource: any;
  clinicianMajorDatasource: any;
  clinicianProfessionDatasource: any;
  clinicianCategoryDatasource: any;
  genderDatasource: any;
  departmentDatasource: any;
  cliniciansList: any;

  dropdownsLoaded: boolean = false;

  constructor(private masterService: MasterReportService) {}

  async ngOnInit() {
    await this.loadInitialData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['formData'] || !this.formData?.ID) {
      return;
    }

    this.bindFormData();
  }

  async loadInitialData() {
    try {
      const [
        speciality,
        major,
        profession,
        category,
        gender,
        department,
        clinicians,
      ] = await Promise.all([
        firstValueFrom(this.masterService.Get_GropDown('SPECIALITY')),
        firstValueFrom(this.masterService.Get_GropDown('CLINICIANMAJOR')),
        firstValueFrom(this.masterService.Get_GropDown('CLINICIANPROFESSION')),
        firstValueFrom(this.masterService.Get_GropDown('CLINICIANCATEGORY')),
        firstValueFrom(this.masterService.Get_GropDown('GENDER')),
        firstValueFrom(this.masterService.Get_GropDown('DEPARTMENT')),
        firstValueFrom(this.masterService.get_Clinian_Table_Data()),
      ]);

      this.specialityDatasource = speciality;
      this.clinicianMajorDatasource = major;
      this.clinicianProfessionDatasource = profession;
      this.clinicianCategoryDatasource = category;
      this.genderDatasource = gender;
      this.departmentDatasource = department;
      this.cliniciansList = (clinicians as any).data;

      this.dropdownsLoaded = true;

      this.bindFormData();
    } catch (error) {
      console.error(error);
    }
  }

  private bindFormData() {
    if (!this.dropdownsLoaded || !this.formData) {
      return;
    }

    this.newClinician = {
      ...this.formData,
    };

    console.log('Form data bound:', this.newClinician);
  }

  getnewClinicianData = () => {
    const licenseResult = this.clinicianLicenseValidator?.instance?.validate();
    const nameResult = this.clinicianNameValidator?.instance?.validate();

    if (licenseResult?.isValid && nameResult?.isValid) {
      return { ...this.newClinician };
    } else {
      return null;
    }
  };

  reset_newClinicianFormData() {
    this.newClinician.ClinicianLicense = '';
    this.newClinician.ClinicianName = '';
    this.newClinician.ClinicianShortName = '';
    this.newClinician.SpecialityID = '';
    ((this.newClinician.MajorID = ''), (this.newClinician.ProfessionID = ''));
    this.newClinician.CategoryID = '';
    this.newClinician.Gender = '';
  }

  get_DropDown_Data() {
    this.masterService.Get_GropDown('SPECIALITY').subscribe((response: any) => {
      this.specialityDatasource = response;
    });

    this.masterService
      .Get_GropDown('CLINICIANMAJOR')
      .subscribe((response: any) => {
        this.clinicianMajorDatasource = response;
      });

    this.masterService
      .Get_GropDown('CLINICIANPROFESSION')
      .subscribe((response: any) => {
        this.clinicianProfessionDatasource = response;
      });

    this.masterService
      .Get_GropDown('CLINICIANCATEGORY')
      .subscribe((response: any) => {
        this.clinicianCategoryDatasource = response;
      });

    this.masterService.Get_GropDown('GENDER').subscribe((response: any) => {
      this.genderDatasource = response;
    });

    this.masterService.Get_GropDown('DEPARTMENT').subscribe((response: any) => {
      this.departmentDatasource = response;
    });
  }

  checkClinicianLicenseExists = (e: any): boolean => {
    const clinicianLicense = e.value;
    const currentId = this.formData?.ID; // or whatever unique ID you're using

    const exists = this.cliniciansList.some(
      (clinician: any) =>
        clinician.ClinicianLicense === clinicianLicense &&
        clinician.ID !== currentId, //  Exclude the one being edited
    );

    if (exists) {
      e.isValid = false;
      e.message = 'Clinician License already exists';
    } else {
      e.isValid = true;
    }

    return e.isValid;
  };

  onFacilityLicenseInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Remove spaces from the current value and sanitize it
    const sanitizedValue = target.value.replace(/\s/g, '').toUpperCase();

    // Check if the first character is an alphabet
    if (sanitizedValue.length > 0) {
      // Update the target value and the LoginName property
      target.value = sanitizedValue;
      this.newClinician.ClinicianLicense = sanitizedValue; // Update the login name value

      // Validate the login name directly
      this.checkClinicianLicenseExists({ value: sanitizedValue });
    } else {
      // If the first character is not an alphabet, reset the input
      target.value = ''; // Optionally clear the input
      this.newClinician.ClinicianLicense = ''; // Reset the login name value
    }
  }

  getCliniciansData() {
    this.masterService.get_Clinian_Table_Data().subscribe((res: any) => {
      this.cliniciansList = res.data;
      console.log('datasource', this.cliniciansList);
    });
  }
}

@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    FormPhotoUploaderModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxRadioGroupModule,
    DxTextBoxModule,
  ],
  declarations: [ClinicianEditFormComponent],
  exports: [ClinicianEditFormComponent],
})
export class ClinicianEditFormModule {}
