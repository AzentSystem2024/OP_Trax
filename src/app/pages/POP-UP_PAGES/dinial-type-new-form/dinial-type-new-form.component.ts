import { Component, NgModule } from '@angular/core';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { CommonModule } from '@angular/common';
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
  selector: 'app-dinial-type-new-form',
  templateUrl: './dinial-type-new-form.component.html',
  styleUrls: ['./dinial-type-new-form.component.scss'],
})
export class DinialTypeNewFormComponent {
  DenialTypeData = {
    DenialTypeValue: '',
    DescriptionValue: '',
  };

  newDenialTypeData = this.DenialTypeData;
  constructor(private masterService: MasterReportService) {}

  getNewDenialTypeData = () => ({ ...this.newDenialTypeData });

  resetDenialTypeData() {
    this.newDenialTypeData.DenialTypeValue = '';
    this.newDenialTypeData.DescriptionValue = '';
  }
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
  ],
  declarations: [DinialTypeNewFormComponent],
  exports: [DinialTypeNewFormComponent],
})
export class DenialTypeNewFormModule {}
