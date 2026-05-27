import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxTextBoxModule,
  DxFormModule,
  DxValidatorModule,
  DxTextAreaModule,
  DxSelectBoxModule,
} from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';

@Component({
  selector: 'app-clinician-major-new-form',
  templateUrl: './clinician-major-new-form.component.html',
  styleUrls: ['./clinician-major-new-form.component.scss'],
})
export class ClinicianMajorNewFormComponent {
  clinicianMajor = {
    MajorValue: '',
    DescriptionValue: '',
  };

  newclinicianMajor = this.clinicianMajor;
  constructor() {}

  getNewclinicianMajor = () => ({
    ...this.newclinicianMajor,
  });

  reset_newclinicianMajorFormData() {
    this.newclinicianMajor.MajorValue = '';
    this.newclinicianMajor.DescriptionValue = '';
  }
}
@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    DxTextAreaModule,
    FormPhotoUploaderModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
  ],
  declarations: [ClinicianMajorNewFormComponent],
  exports: [ClinicianMajorNewFormComponent],
})
export class ClinicianMajorNewFormModule {}
