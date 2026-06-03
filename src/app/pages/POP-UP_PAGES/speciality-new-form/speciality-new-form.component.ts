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
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-speciality-new-form',
  templateUrl: './speciality-new-form.component.html',
  styleUrls: ['./speciality-new-form.component.scss'],
})
export class SpecialityNewFormComponent {
  SpecialityData = {
    SpecialityCode: '',
    SpecialityName: '',
    SpecialityShortName: '',
    Description: '',
  };

  newSpecialityData = this.SpecialityData;
  constructor(private masterService: MasterReportService) {}

 validateForm(): boolean {
  return validationEngine.validateGroup('specialityValidation').isValid || false;
}

  getNewSpecialityData = () => ({ ...this.newSpecialityData });
}
@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    DxTextAreaModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxTextAreaModule,
  ],
  declarations: [SpecialityNewFormComponent],
  exports: [SpecialityNewFormComponent],
})
export class SpecialityNewFormModule {}
