import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DxTextBoxModule, DxFormModule, DxValidatorModule, DxTextAreaModule, DxSelectBoxModule } from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';

@Component({
  selector: 'app-clinician-category-new-form',
  templateUrl: './clinician-category-new-form.component.html',
  styleUrls: ['./clinician-category-new-form.component.scss']
})
export class ClinicianCategoryNewFormComponent {
  clinicianCategory = {
    CategoryValue: '',
    DescriptionValue: '',
  };

  newclinicianCategory = this.clinicianCategory;
  constructor() {}

  getNewclinicianCategory = () => ({
    ...this.newclinicianCategory,
  });

  reset_newclinicianCategoryFormData() {
    this.newclinicianCategory.CategoryValue = '';
    this.newclinicianCategory.DescriptionValue = '';
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
  declarations: [ClinicianCategoryNewFormComponent],
  exports: [ClinicianCategoryNewFormComponent],
})
export class ClinicianCategoryNewFormModule {}