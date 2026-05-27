import { Component, EventEmitter, NgModule, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxCheckBoxModule, DxFormComponent, DxFormModule, DxTextAreaModule, DxValidationGroupComponent, DxValidationGroupModule, DxValidatorModule } from 'devextreme-angular';
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
  selector: 'sub-department-new-form',
  templateUrl: './sub-department-new-form.component.html',
  styleUrls: ['./sub-department-new-form.component.scss'],
  providers: [DataService],
})
export class SubDepartmentNewFormComponent {
  @ViewChild('validationGroup', { static: false }) validationGroup: any;

  @Output() formClosed: EventEmitter<void> = new EventEmitter<void>();
  

  newDepartmentData = {
    ID: '',
    SUB_DEPARTMENT: '',
    DEPARTMENT_ID: '',
  };

  newDepartment = this.newDepartmentData;
  Department_DropDownData: any;
  Denial_Category_DropDownData: any;

  getSizeQualifier = getSizeQualifier;

  constructor(private service: MasterReportService) {
    this.getCostBucket_DropDown();
  }

  getNewDenialData = () => ({ ...this.newDepartment });

  reset_NewDenialFormData() {
    this.newDepartment.SUB_DEPARTMENT = '';
    this.newDepartment.DEPARTMENT_ID = '';

  }
  //=============Get Denial Type Drop dwn Data==============================
  getCostBucket_DropDown() {
    this.service.Get_GropDown('DEPARTMENT').subscribe((data: any) => {
      this.Department_DropDownData = data;
    });
  }

  checkDuplicateSubDepartment = (params: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const subDep = params.value?.toLowerCase().trim();
    const selectedDeptId = this.newDepartmentData.DEPARTMENT_ID;

    if (!subDep || !selectedDeptId) {
      resolve(true); // Don’t validate if department not selected
      return;
    }

    this.service.getSubDepartmentData().subscribe({
      next: (res: any) => {
        const existing = res.datas?.some(
          (item: any) =>
            item.SUB_DEPARTMENT?.toLowerCase().trim() === subDep &&
            item.DEPARTMENT_ID === selectedDeptId
        );
        resolve(!existing); // false = show validation error
      },
      error: () => resolve(true) // Ignore error, allow saving
    });
  });
};

  onSaveDepartment(validationGroup: DxValidationGroupComponent) {
  const result = validationGroup.instance.validate();

  if (result.status === 'pending') {
    result.complete.then((res: any) => {
      if (res.isValid) {
        this.proceedToSave();
      }
    });
  } else if (result.isValid) {
    this.proceedToSave();
  }
}

proceedToSave() {
  const subdep = this.newDepartmentData.SUB_DEPARTMENT;
  const departmentID = this.newDepartmentData.DEPARTMENT_ID;

  this.service.addSubDepartment(subdep, departmentID).subscribe((res: any) => {
    if (res.flag === '1') {
      notify({ message: "Sub Department saved successfully!", type: "success", position: { at: "top center", my: "top center" } });
      this.newDepartmentData.SUB_DEPARTMENT = '';
      this.newDepartmentData.DEPARTMENT_ID = '';
      this.formClosed.emit();
    } else {
      notify({ message: "Failed to save Sub Department. Please try again.", type: "error", position: { at: "top center", my: "top center" } });
    }
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
    DxTextAreaModule,
    DxCheckBoxModule,
    DxButtonModule,
    DxValidatorModule,
    DxValidationGroupModule
  ],
  declarations: [SubDepartmentNewFormComponent],
  exports: [SubDepartmentNewFormComponent],
})
export class SubDepartmentNewFormModule {}
