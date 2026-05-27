import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DxTextBoxModule, DxFormModule, DxValidatorModule, DxTextAreaModule, DxSelectBoxModule } from 'devextreme-angular';
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-denial-category-new-form',
  templateUrl: './denial-category-new-form.component.html',
  styleUrls: ['./denial-category-new-form.component.scss']
})
export class DenialCategoryNewFormComponent {
  DenialCategoryData = {
    DenialCategoryValue: '',
    DescriptionValue: '',
  };

  newDenialCategoryData = this.DenialCategoryData;
  constructor(private masterService: MasterReportService) {}

  getNewDenialCategoryData = () => ({ ...this.newDenialCategoryData });

  resetDenialCategoryData() {
    this.newDenialCategoryData.DenialCategoryValue = '';
    this.newDenialCategoryData.DescriptionValue = '';
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
  declarations: [DenialCategoryNewFormComponent],
  exports: [DenialCategoryNewFormComponent],
})
export class DenialCategoryNewFormModule {}
