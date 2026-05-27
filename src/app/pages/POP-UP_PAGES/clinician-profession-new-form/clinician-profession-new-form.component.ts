import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DxTextBoxModule, DxFormModule, DxValidatorModule, DxTextAreaModule, DxSelectBoxModule } from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';

@Component({
  selector: 'app-clinician-profession-new-form',
  templateUrl: './clinician-profession-new-form.component.html',
  styleUrls: ['./clinician-profession-new-form.component.scss']
})
export class ClinicianProfessionNewFormComponent {
  clinicianProfession = {
    ProfessionValue: '',
    DescriptionValue: '',
  };

  newclinicianProfession = this.clinicianProfession;
  constructor() {}

  getNewclinicianProfession = () => ({
    ...this.newclinicianProfession,
  });

  reset_newclinicianProfessionFormData() {
    this.newclinicianProfession.ProfessionValue = '';
    this.newclinicianProfession.DescriptionValue = '';
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
  declarations: [ClinicianProfessionNewFormComponent],
  exports: [ClinicianProfessionNewFormComponent],
})
export class ClinicianProfessionNewFormModule {}