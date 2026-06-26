import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CptTypeNewFormComponent } from '../cpt-type-new-form/cpt-type-new-form.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DxFormModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxValidationGroupModule, DxValidatorModule } from 'devextreme-angular';
import { FormPhotoUploaderModule, FormTextboxModule } from 'src/app/components';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-insurance-new-form',
  templateUrl: './insurance-new-form.component.html',
  styleUrls: ['./insurance-new-form.component.scss'],
})
export class InsuranceNewFormComponent {

  InsuranceData = {
    InsuranceID: '',
    InsuranceName: '',
    InsuranceShortName: '',
    ClassificationID: '',

  };
  insuranceClassificationList: any;


  newInsuranceData = this.InsuranceData;
  constructor(private masterService: MasterReportService) { }

  validateForm(): boolean {
    return validationEngine.validateGroup('InsuranceValidation').isValid || false;
  }
  fetch_classification_Dropdown() {
    this.masterService.Get_GropDown('INSURANCECLASSIFICATION').subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.insuranceClassificationList = res;
        } else {
          this.insuranceClassificationList = [];
          console.warn(
            'Insurance Classification dropdown: Invalid response format',
            res
          );
        }
      },
      error: (err: any) => {
        this.insuranceClassificationList = [];
        console.error('Failed to load Insurance Classification dropdown', err);
      },
    });
  }

  getNewInsuranceData = () => ({ ...this.newInsuranceData });
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
    DxValidationGroupModule
  ],
  declarations: [InsuranceNewFormComponent],
  exports: [InsuranceNewFormComponent],
})
export class InsuranceNewFormModule { }
