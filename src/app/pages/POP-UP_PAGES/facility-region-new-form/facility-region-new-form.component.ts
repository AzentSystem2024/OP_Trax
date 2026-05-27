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
  selector: 'app-facility-region-new-form',
  templateUrl: './facility-region-new-form.component.html',
  styleUrls: ['./facility-region-new-form.component.scss'],
})
export class FacilityRegionNewFormComponent {
  FacilityRegionData = {
    FacilityregionValue: '',
    DescriptionValue: '',
  };

  newFacilityRegionData = this.FacilityRegionData;
  facilityregionDatasource: any;
  constructor() {}

  getNewFacilityRegionData = () => ({ ...this.newFacilityRegionData });
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
  declarations: [FacilityRegionNewFormComponent],
  exports: [FacilityRegionNewFormComponent],
})
export class FacilityRegionNewFormModule {}
