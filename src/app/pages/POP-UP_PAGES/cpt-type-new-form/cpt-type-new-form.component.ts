import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxFormModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormPhotoUploaderModule, FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-cpt-type-new-form',
  templateUrl: './cpt-type-new-form.component.html',
  styleUrls: ['./cpt-type-new-form.component.scss'],
})
export class CptTypeNewFormComponent {
  CpyTypeData = {
    CptTypeValue: '',
    DescriptionValue: '',
  };

  newCptTypeData = this.CpyTypeData;
  CptTypeDatasource: any;
  constructor(private masterService: MasterReportService) {}

  getNewCptTypeData = () => ({ ...this.newCptTypeData });

  checkDuplicateCptType = (params: any): Promise<boolean> => {
  const inputValue = params.value?.toLowerCase().trim();

  if (!inputValue) {
    return Promise.resolve(true); // Allow if input is empty
  }

  return new Promise((resolve) => {
    this.masterService.get_CptType_List().subscribe({
      next: (res: any) => {
        const exists = res?.data?.some(
          (item: any) =>
            item.CptType?.toLowerCase().trim() === inputValue
        );
        resolve(!exists); // true = valid, false = duplicate
      },
      error: () => {
        resolve(true); // Allow if error occurs
      }
    });
  });
};

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
  declarations: [CptTypeNewFormComponent],
  exports: [CptTypeNewFormComponent],
})
export class CptTypeNewFormModule {}
