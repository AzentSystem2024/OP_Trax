import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CptTypeNewFormComponent } from '../cpt-type-new-form/cpt-type-new-form.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DxFormModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { FormPhotoUploaderModule, FormTextboxModule } from 'src/app/components';

@Component({
  selector: 'app-insurance-new-form',
  templateUrl: './insurance-new-form.component.html',
  styleUrls: ['./insurance-new-form.component.scss'],
})
export class InsuranceNewFormComponent {
  InsuranceData = {
    InsuranceID: '',
    InsuranceName: '',
    InsuranceShortName:''
  };

  newInsuranceData = this.InsuranceData;
  constructor(private masterService: MasterReportService) {}

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
  ],
  declarations: [InsuranceNewFormComponent],
  exports: [InsuranceNewFormComponent],
})
export class InsuranceNewFormModule {}
