import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxFormModule,
  DxSelectBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTextAreaModule } from 'devextreme-angular';
import { FormPhotoUploaderModule, FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-facility-group-new-form',
  templateUrl: './facility-group-new-form.component.html',
  styleUrls: ['./facility-group-new-form.component.scss'],
  providers: [MasterReportService],
})
export class FacilityGroupNewFormComponent implements OnInit {
  FacilityGroupData = {
    FacilityGroupValue: '',
    FacilityCategoryValue: '',
    DescriptionValue: '',
  };

  FacilityLevelDatasource: any;

  GroupNameCaption: any;
  isFacilityGroupVisible: boolean = false;

  newFacilityGroupData = this.FacilityGroupData;
  facilityGroupDatasource: any;
  constructor(private masterService: MasterReportService) {
    this.get_FacilityGroup_DropDown();
  }

  ngOnInit(): void {
    this.get_FacilityGroup_DropDown();
  }

  getNewFacilityGroupData = () => ({ ...this.newFacilityGroupData });

  onGroupCategoryChange(selectedValue: any) {
    const captionValue = this.FacilityLevelDatasource.find(
      (data) => data.ID === selectedValue
    );
    this.GroupNameCaption = `Enter Your ${captionValue.DESCRIPTION}`;
    this.isFacilityGroupVisible = true;
  }

  //==================== Facility group dropdown data loading ========================
  //====================get Facility group category dropdown ==============
  get_FacilityGroup_DropDown() {
    this.masterService
      .Get_GropDown('FACILITY_GROUP_CATEGORY')
      .subscribe((response: any) => {
        this.FacilityLevelDatasource = response;
      });
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
  declarations: [FacilityGroupNewFormComponent],
  exports: [FacilityGroupNewFormComponent],
})
export class FacilityGroupNewFormModule {}
