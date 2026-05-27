import { Component, EventEmitter, NgModule, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxCheckBoxModule, DxFormComponent, DxFormModule, DxTextAreaModule, DxValidationGroupModule, DxValidatorModule } from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';
import { getSizeQualifier } from 'src/app/services/screen.service';
import { ReactiveFormsModule } from '@angular/forms';
import { DataService } from 'src/app/services';
import { DxSelectBoxModule } from 'devextreme-angular';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import validationEngine from 'devextreme/ui/validation_engine';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'facility-new-form',
  templateUrl: './facility-new-form.component.html',
  styleUrls: ['./facility-new-form.component.scss'],
  providers: [DataService],
})
export class FacilityNewFormComponent {

  @Output() formClosed: EventEmitter<void> = new EventEmitter<void>();
  

  newFacilityData:any = {
    ID: '',
    FACILITY_LICENSE: '',
    FACILITY_NAME: '',
    POST_OFFICE_ID:'',
    LOGIN_NAME:'',
    PASSWORD:'',
    IS_VERIFIED:'',
    LAST_VERFIED_ON:''
  };

  // newDepartment = this.newDepartmentData;
  postoffice_DropDownData: any;
  Denial_Category_DropDownData: any;
  getSizeQualifier = getSizeQualifier;

  constructor(private service: MasterReportService) {
    this.postoffice_DropDown();
  }

  //=============Get Denial Type Drop dwn Data==============================
  postoffice_DropDown() {
    this.service.Get_GropDown('POSTOFFICE').subscribe((data: any) => {
      this.postoffice_DropDownData = data;
    });
  }

  clearForm(){
    this.newFacilityData.FACILITY_LICENSE='';
    this.newFacilityData.FACILITY_NAME='';
    this.newFacilityData.POST_OFFICE_ID='';
    this.newFacilityData.LOGIN_NAME='';
    this.newFacilityData.PASSWORD='';
    this.newFacilityData.IS_VERIFIED='';
    this.newFacilityData.LAST_VERFIED_ON='';
  }

  verifyPostOffice(){
    const loginname= this.newFacilityData.LOGIN_NAME;
    const pwd = this.newFacilityData.PASSWORD;
    this.service.verifyPostOffice(loginname, pwd).subscribe((res:any) => {
    if (res?.flag === "1" && res?.data?.VERIFIED) {
      this.newFacilityData.IS_VERIFIED = true;
      // Optionally store or show verification date
      this.newFacilityData.VERIFIED_ON = res.data.VERIFIED_ON;
    } else {
      this.newFacilityData.IS_VERIFIED = false;
      this.newFacilityData.VERIFIED_ON = null;

      notify({
          message: "Invalid Credentials",
          type: "error",
          displayTime: 2000,
          position: {
            at: "top center",
            my: "top center"
          }
        });
    }
  }, error => {
    this.newFacilityData.IS_VERIFIED = false;
    this.newFacilityData.VERIFIED_ON = null;
    console.error("Verification failed:", error);
  });
}

  onSaveFacility(){
    const facility_license = this.newFacilityData.FACILITY_LICENSE;
    const facility_name = this.newFacilityData.FACILITY_NAME;
    const postofficeID = this.newFacilityData.POST_OFFICE_ID;
    const loginName = this.newFacilityData.LOGIN_NAME;
    const password = this.newFacilityData.PASSWORD;
    const isVerified = this.newFacilityData.IS_VERIFIED;
    this.service.addFacility(facility_license,facility_name,postofficeID,loginName,password,isVerified).subscribe((res:any)=>{
      if(res.flag=="1"){
        notify(
        {
          message: "Facility saved successfully!",
          type: "success",
          position: { at: "top center", my: "top center" }
        },
      );
      this.clearForm();
      this.formClosed.emit();
      }
      else{
        notify(
        {
          message: "Failed to save Facility. Please try again.",
          type: "error",
          position: { at: "top center", my: "top center" }
        },
      
      );
      }
    })
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
    DxTextAreaModule,
    DxCheckBoxModule,
    DxButtonModule,
    DxValidatorModule,
    DxValidationGroupModule
  ],
  declarations: [FacilityNewFormComponent],
  exports: [FacilityNewFormComponent],
})
export class FacilityNewFormModule {}
