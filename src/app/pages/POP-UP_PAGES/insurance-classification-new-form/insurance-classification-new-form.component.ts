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
  selector: 'app-insurance-classification-new-form',
  templateUrl: './insurance-classification-new-form.component.html',
  styleUrls: ['./insurance-classification-new-form.component.scss'],
})
export class InsuranceClassificationNewFormComponent {
  InsuranceClassification = {
    ClassificationValue: '',
    DescriptionValue: '',
  };

  newInsuranceClassification = this.InsuranceClassification;
  constructor() {}

  getNewInsuranceClassification = () => ({
    ...this.newInsuranceClassification,
  });

  reset_newInsuranceClassificationFormData() {
    this.newInsuranceClassification.ClassificationValue = '';
    this.newInsuranceClassification.DescriptionValue = '';
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
  declarations: [InsuranceClassificationNewFormComponent],
  exports: [InsuranceClassificationNewFormComponent],
})
export class InsuranceClassificationNewFormModule {}
