import { Component, EventEmitter, Input, NgModule, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
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
  selector: 'sub-department-edit-form',
  templateUrl: './sub-department-edit-form.component.html',
  styleUrls: ['./sub-department-edit-form.component.scss'],
  providers: [DataService],
})
export class SubDepartmentEditFormComponent implements OnChanges {
  @Input() departmentData: any;
  @Output() formClosed: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('validationGroup', { static: false }) validationGroup: any;
  

  newDepartmentData:any = {
    ID: '',
    SUB_DEPARTMENT: '',
    DEPARTMENT_ID: '',
    IS_INACTIVE:''
  };

  newDepartment = this.newDepartmentData;
  Department_DropDownData: any;
  Denial_Category_DropDownData: any;
  getSizeQualifier = getSizeQualifier;

  constructor(private service: MasterReportService) {
    this.getCostBucket_DropDown();
  }

  getNewDenialData = () => ({ ...this.newDepartment });

  resetFormData() {
    this.newDepartmentData.DEPARTMENT = '';
    this.newDepartmentData.COST_BUCKET_ID = '';

  }
  //=============Get Denial Type Drop dwn Data==============================
  getCostBucket_DropDown() {
    this.service.Get_GropDown('DEPARTMENT').subscribe((data: any) => {
      this.Department_DropDownData = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {

  if (changes['departmentData'] && changes['departmentData'].currentValue) {
    this.newDepartmentData = { ...this.departmentData };
  }
}

checkDuplicateSubDepartment = (params: any): Promise<boolean> => {
  return new Promise((resolve) => {
    const inputValue = params.value?.toLowerCase().trim();
    if (!inputValue) {
      resolve(true);
      return;
    }

    this.service.getSubDepartmentData().subscribe({
      next: (res: any) => {
        const existing = res.datas?.some((item: any) =>
          item.SUB_DEPARTMENT?.toLowerCase().trim() === inputValue &&
          item.DEPARTMENT_ID === this.newDepartmentData.DEPARTMENT_ID &&
          item.ID !== this.newDepartmentData.ID // Exclude current record
        );
        resolve(!existing);
      },
      error: () => resolve(true),
    });
  });
};


  onUpdateDepartment(validationGroup: DxValidationGroupComponent) {
  const result = validationGroup.instance.validate();

  if (result.status === 'pending') {
    result.complete.then((res: any) => {
      if (res.isValid) {
        this.proceedToUpdate();
      }
    });
  } else if (result.isValid) {
    this.proceedToUpdate();
  }
}

proceedToUpdate() {
  const { ID, SUB_DEPARTMENT, DEPARTMENT_ID, IS_INACTIVE } = this.newDepartmentData;

  this.service.updateSubDepartment(ID, SUB_DEPARTMENT, DEPARTMENT_ID, IS_INACTIVE).subscribe((res: any) => {
    if (res.flag == '1') {
      notify({ message: 'Sub Department updated successfully!', type: 'success', position: { at: 'top center', my: 'top center' } });
      this.formClosed.emit();
    } else {
      notify({ message: 'Failed to update. Please try again.', type: 'error', position: { at: 'top center', my: 'top center' } });
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
  declarations: [SubDepartmentEditFormComponent],
  exports: [SubDepartmentEditFormComponent],
})
export class SubDepartmentEditFormModule {}
