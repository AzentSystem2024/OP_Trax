import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxFormComponent,
  DxFormModule,
  DxRadioGroupModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
} from 'devextreme-angular';
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
  selector: 'department-edit-form',
  templateUrl: './department-edit-form.component.html',
  styleUrls: ['./department-edit-form.component.scss'],
  providers: [DataService],
})
export class DepartmentEditFormComponent implements OnChanges {
  @Input() departmentData: any;
  @Output() formClosed: EventEmitter<void> = new EventEmitter<void>();

  newDepartmentData: any = {
    ID: '',
    DEPARTMENT: '',
    COST_BUCKET_ID: '',
    IS_INACTIVE: '',
    COST_CENTER_TYPE_ID: 0,
    OverheadAllocationType: 0,
    OverheadAllocationDepartmentID: []
  };

  newDepartment = this.newDepartmentData;
  Cost_Bucket_DropDownData: any;
  Cost_Type_List: any;
  Denial_Category_DropDownData: any;
  getSizeQualifier = getSizeQualifier;

  allocationOptions = [
    { value: 0, text: 'Allocate all' },
    { value: 1, text: "Do not allocate" },
    { value: 2, text: 'Allocate from selected cost centers' },
  ];

  OverheadCostCenterList: any;

  constructor(private service: MasterReportService) {
    this.getCostBucket_DropDown();
  }

  getNewDenialData = () => ({ ...this.newDepartment });

  resetFormData() {
    this.newDepartmentData.DEPARTMENT = '';
    this.newDepartmentData.COST_BUCKET_ID = '';
    this.newDepartment.COST_CENTER_TYPE_ID = '';
    this.newDepartment.IS_INACTIVE = '';
    this.formClosed.emit();
  }
  //=============Get Denial Type Drop dwn Data==============================
  getCostBucket_DropDown() {
    this.service.Get_GropDown('COST_BUCKET').subscribe((data: any) => {
      this.Cost_Bucket_DropDownData = data;
    });
    this.service.Get_GropDown('COST_CENTER_TYPE').subscribe((data: any) => {
      this.Cost_Type_List = data;
    });
     this.service.Get_GropDown('OVERHEAD_COST_CENTERS').subscribe((data: any) => {
      this.OverheadCostCenterList = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
  if (changes['departmentData'] && changes['departmentData'].currentValue) {

    this.newDepartmentData = { ...this.departmentData };

    // 🔥 Convert "14,15" → [14,15] for TagBox
    const rawValue = this.newDepartmentData.OverheadAllocationDepartmentID;

    if (typeof rawValue === 'string' && rawValue.trim() !== '') {
      this.newDepartmentData.OverheadAllocationDepartmentID =
        rawValue.split(',').map((x: string) => Number(x.trim()));
    }

    // If backend sends null or empty → ensure array
    if (!this.newDepartmentData.OverheadAllocationDepartmentID) {
      this.newDepartmentData.OverheadAllocationDepartmentID = [];
    }

    console.log(this.newDepartmentData, "DEPARTMENT DATA AFTER FIX");
  }
}


  checkDuplicateDepartmentEdit = (params: any): Promise<boolean> => {
    return new Promise((resolve) => {
      const currentName =
        this.newDepartmentData.DEPARTMENT?.trim()?.toLowerCase();
      const currentId = this.newDepartmentData.ID;

      this.service.getDepartmentData().subscribe({
        next: (res: any) => {
          const exists = res.datas.some((d: any) => {
            return (
              d.DEPARTMENT?.toLowerCase() === currentName && d.ID !== currentId
            );
          });
          resolve(!exists); // ✅ valid if NOT duplicate
        },
        error: () => resolve(true), // Fail-safe: allow update if API fails
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

    const OverheadAllocationDepartmentID = this.newDepartmentData.OverheadAllocationDepartmentID.join(',')

    const { ID, DEPARTMENT, COST_BUCKET_ID, COST_CENTER_TYPE_ID, IS_INACTIVE,OverheadAllocationType } =
      this.newDepartmentData;
    console.log(
      'payload data:<<',
      DEPARTMENT,
      COST_BUCKET_ID,
      COST_CENTER_TYPE_ID
    );
    this.service
      .updateDepartment(
        ID,
        DEPARTMENT,
        COST_BUCKET_ID,
        COST_CENTER_TYPE_ID,
        IS_INACTIVE,
        OverheadAllocationType,
        OverheadAllocationDepartmentID
      )
      .subscribe((res: any) => {
        if (res.flag === '1') {
          notify({
            message: 'Department updated successfully!',
            type: 'success',
            position: { at: 'top center', my: 'top center' },
          });
          this.formClosed.emit();
        } else {
          notify({
            message: 'Failed to update department. Please try again.',
            type: 'error',
            position: { at: 'top center', my: 'top center' },
          });
        }
      });
  }

  onAllocationChanged(e: any) {
  this.newDepartmentData.OverheadAllocationType = e.value;

  console.log(this.newDepartmentData.OverheadAllocationType , "AllocationType")

  if (e.value !== 2) {
    this.newDepartmentData.OverheadAllocationDepartmentID = [];
  }
}

validateTagBoxRequired = (e: any) => {
  // Validate only if Allocation Type = 2
    if (this.newDepartmentData.OverheadAllocationType === 2) {
      const value = e.value;
      return Array.isArray(value) && value.length > 0;
    }
    
    // If allocation type is NOT 2, always valid
    return true;
  };
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
    DxValidationGroupModule,
    DxTagBoxModule,
    DxRadioGroupModule
  ],
  declarations: [DepartmentEditFormComponent],
  exports: [DepartmentEditFormComponent],
})
export class DepartmentEditFormModule {}
