import {
  Component,
  EventEmitter,
  NgModule,
  OnInit,
  Output,
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
import { DxValidationGroupComponent } from 'devextreme-angular';

@Component({
  selector: 'department-new-form',
  templateUrl: './department-new-form.component.html',
  styleUrls: ['./department-new-form.component.scss'],
  providers: [DataService],
})
export class DepartmentNewFormComponent {
  @Output() formClosed: EventEmitter<void> = new EventEmitter<void>();

  newDepartmentData = {
    ID: '',
    DEPARTMENT: '',
    COST_BUCKET_ID: '',
    COST_CENTER_TYPE_ID: 0,
    OverheadAllocationType: 0,
    OverheadAllocationDepartmentID: [],
  };

  Cost_Type_List: any;
  Cost_Bucket_DropDownData: any;
  Denial_Category_DropDownData: any;
  getSizeQualifier = getSizeQualifier;

  allocationOptions = [
    { value: 0, text: 'Allocate all' },
    { value: 1, text: "Do not allocate" },
    { value: 2, text: 'Allocate from selected cost centers' },
  ];

  OverheadCostCenterList: any;

  newDepartment = this.newDepartmentData;
  constructor(private service: MasterReportService) {
    this.getCostBucket_DropDown();
  }

  getNewDenialData = () => ({ ...this.newDepartment });

  reset_NewDenialFormData() {
    this.newDepartment.DEPARTMENT = null;
    this.newDepartment.COST_BUCKET_ID = null;
    this.newDepartment.COST_CENTER_TYPE_ID = null;
    this.newDepartment.OverheadAllocationDepartmentID = [];
    this.newDepartment.OverheadAllocationType = 0;

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

    this.service
      .Get_GropDown('OVERHEAD_COST_CENTERS')
      .subscribe((data: any) => {
        this.OverheadCostCenterList = data;
      });
  }

  checkDepartmentExists = (params: any) => {
    const enteredDept = (params.value || '').trim().toLowerCase();

    return new Promise((resolve) => {
      this.service.getDepartmentData().subscribe({
        next: (res: any) => {
          const departments = res.datas || [];
          const isDuplicate = departments.some(
            (d: any) =>
              (d.DEPARTMENT || '').trim().toLowerCase() === enteredDept
          );
          resolve(!isDuplicate); // return false to show validation error
        },
        error: () => {
          resolve(true); // Allow it if error fetching (optional)
        },
      });
    });
  };

  onSaveDepartment(validationGroup: DxValidationGroupComponent) {
    const result = validationGroup.instance.validate();

    // Check if validation result is async
    if (result.status === 'pending') {
      // Wait for async validation to resolve
      result.complete.then((res: any) => {
        if (res.isValid) {
          this.proceedToSave(); // Safe to save
        }
      });
    } else if (result.isValid) {
      this.proceedToSave(); // Safe to save immediately
    }
  }

  proceedToSave() {
    const dep = this.newDepartmentData.DEPARTMENT;
    const costBucketID = this.newDepartmentData.COST_BUCKET_ID;
    const TypeID = this.newDepartmentData.COST_CENTER_TYPE_ID;
    const isInactive = false;
    const OverheadAllocationType =
      this.newDepartmentData.OverheadAllocationType;
    const OverheadAllocationDepartmentID =
      this.newDepartmentData.OverheadAllocationDepartmentID.join(',');

    this.service
      .addDepartment(
        dep,
        costBucketID,
        TypeID,
        isInactive,
        OverheadAllocationType,
        OverheadAllocationDepartmentID
      )
      .subscribe((res: any) => {
        if (res.flag === '1') {
          notify({
            message: 'Department saved successfully!',
            type: 'success',
            position: { at: 'top center', my: 'top center' },
          });
          this.newDepartmentData.DEPARTMENT = '';
          this.newDepartmentData.COST_BUCKET_ID = '';
          (this.newDepartment.OverheadAllocationType = 0),
            (this.newDepartment.OverheadAllocationDepartmentID = []);
          this.formClosed.emit();
        } else {
          notify({
            message: 'Failed to save department. Please try again.',
            type: 'error',
            position: { at: 'top center', my: 'top center' },
          });
        }
      });
  }

  onAllocationChanged(e: any) {
    this.newDepartment.OverheadAllocationType = e.value;

    console.log(this.newDepartment.OverheadAllocationType, 'AllocationType');

    if (e.value !== 2) {
      this.newDepartment.OverheadAllocationDepartmentID = [];
    }
  }


  validateTagBoxRequired = (e: any) => {
  // Validate only if Allocation Type = 2
    if (this.newDepartment.OverheadAllocationType === 2) {
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
    DxRadioGroupModule,
    DxTagBoxModule,
  ],
  declarations: [DepartmentNewFormComponent],
  exports: [DepartmentNewFormComponent],
})
export class DepartmentNewFormModule {}
