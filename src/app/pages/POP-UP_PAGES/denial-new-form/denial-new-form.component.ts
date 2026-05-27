import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxFormModule, DxTextAreaModule, DxValidatorModule } from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';
import { getSizeQualifier } from 'src/app/services/screen.service';
import { ReactiveFormsModule } from '@angular/forms';
import { DataService } from 'src/app/services';
import { DxSelectBoxModule } from 'devextreme-angular';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
@Component({
  selector: 'denial-new-form',
  templateUrl: './denial-new-form.component.html',
  styleUrls: ['./denial-new-form.component.scss'],
  providers: [DataService],
})
export class DenialNewFormComponent {
  newDenialData = {
    iD: '',
    DenialCode: '',
    Description: '',
    DenialTypeID: '',
    DenialCategoryID: '',
    CATEGORY_NAME: '',
    TYPE_NAME: '',
  };

  newDenial = this.newDenialData;
  Denial_Type_DropDownData: any;
  Denial_Category_DropDownData: any;
  getSizeQualifier = getSizeQualifier;

  constructor(private service: MasterReportService) {
    this.getDenial_DropDown();
  }

  getNewDenialData = () => ({ ...this.newDenial });

  reset_NewDenialFormData() {
    this.newDenial.DenialCode = '';
    this.newDenial.Description = '';
    this.newDenial.DenialTypeID = '';
    this.newDenial.DenialCategoryID = '';
  }
  //=============Get Denial Type Drop dwn Data==============================
  getDenial_DropDown() {
    this.service.Get_GropDown('DENIALTYPE').subscribe((data: any) => {
      this.Denial_Type_DropDownData = data;
    });

    this.service.Get_GropDown('DENIALCATEGORY').subscribe((data: any) => {
      this.Denial_Category_DropDownData = data;
    });
  }
}

@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    FormPhotoUploaderModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxTextAreaModule
  ],
  declarations: [DenialNewFormComponent],
  exports: [DenialNewFormComponent],
})
export class DenialNewFormModule {}
