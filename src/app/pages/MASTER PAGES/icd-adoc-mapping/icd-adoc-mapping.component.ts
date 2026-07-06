import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDataGridComponent,
  DxLoadPanelModule,
  DxCheckBoxModule,
  DxDropDownButtonModule,
  DxFormComponent,
  DxFormModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidationSummaryModule,
  DxValidatorModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'devextreme/common/data';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-icd-adoc-mapping',
  templateUrl: './icd-adoc-mapping.component.html',
  styleUrls: ['./icd-adoc-mapping.component.scss'],
  providers: [ReportService, DataService],
})
export class IcdAdocMappingComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild('addForm', { static: false })
  addForm!: DxFormComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  isAddPopupVisible = false;

  specialityList: any[] = [];
  adocClassList: any[] = [];

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_icdAdocMapping_List().subscribe({
          next: (response: any) =>
            resolve(response.datas || response.data || response),
          error: (error: any) => reject(error.message),
        });
      }),
  });

  addButtonOptions: any;
  editButtonOptions: any;
  isEditingEnabled: boolean = false;

  menuPrevilage: any;

  newIcdAdocMapping = {
    SpecialtyID: null,
    ICDCode: '',
    ADOCClassID: null,
  };

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });

    this.dataService.Get_GropDown('SPECIALITY').subscribe((res: any) => {
      this.specialityList = res;
    });

    this.dataService.Get_GropDown('ADOC_CLASS').subscribe((res: any) => {
      this.adocClassList = res;
    });

    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.showNewPopup(),
      elementAttr: { class: 'add-button' },
    };

    this.editButtonOptions = {
      class: 'ms-2',
      text: '',
      icon: 'edit',
      type: 'default',
      stylingMode: 'default',
      hint: 'Toggle Edit Mode',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: this.toggleEditMode,
      elementAttr: { class: 'edit-button' },
    };
  }

  toggleEditMode = () => {
    this.isEditingEnabled = !this.isEditingEnabled;
    this.editButtonOptions = {
      ...this.editButtonOptions,
      icon: this.isEditingEnabled ? 'close' : 'edit',
    };

    if (!this.isEditingEnabled) {
      // this.refresh();
    }
  };

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  showNewPopup() {
    this.isAddPopupVisible = true;
  }

  onPopupHiding() {
    this.newIcdAdocMapping = {
      SpecialtyID: null,
      ICDCode: '',
      ADOCClassID: null,
    };

    this.addForm?.instance.reset();
  }

  // =========== Save data  =========
  saveIcdAdocMapping() {
    const result = validationEngine.validateGroup('icdAdocMappingValidation');

    if (!result.isValid) {
      notify(
        {
          message: 'Please fill all required fields',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'warning',
      );
      return;
    }

    const payload = {
      SpecialtyID: this.newIcdAdocMapping.SpecialtyID,
      ICDCode: this.newIcdAdocMapping.ICDCode,
      ADOCClassID: this.newIcdAdocMapping.ADOCClassID,
      UserID: sessionStorage.getItem('UserID'),
    };

    this.masterService.insert_icdAdocMapping_Data(payload).subscribe({
      next: (res: any) => {
        if (
          res &&
          (res.flag === '1' || res.status === 'success' || res === '1')
        ) {
          notify(
            {
              message: 'ICD ADOC Mapping Added Successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );

          this.isAddPopupVisible = false;

          this.newIcdAdocMapping = {
            SpecialtyID: null,
            ICDCode: '',
            ADOCClassID: null,
          };

          this.dataGrid.instance.refresh();
        } else {
          notify(
            {
              message: res?.message || 'Save Failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
        }
      },
      error: (err: any) => {
        notify(
          {
            message: err?.message || 'Save Failed',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error',
        );
      },
    });
  }

  // =========== row data updating =========
  onRowUpdating(event: any) {
    const combinedData = {
      ...event.oldData,
      ...event.newData,
    };

    if (
      !combinedData.SpecialtyID ||
      !combinedData.ICDCode?.trim() ||
      !combinedData.ADOCClassID
    ) {
      notify(
        {
          message: 'Please fill all required fields',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'warning',
      );

      event.cancel = true;
      return;
    }

    const payload = {
      ID: combinedData.ID,
      SpecialtyID: combinedData.SpecialtyID,
      ICDCode: combinedData.ICDCode,
      ADOCClassID: combinedData.ADOCClassID,
      UserID: sessionStorage.getItem('UserID'),
    };

    this.masterService.update_icdAdocMapping_data(payload).subscribe({
      next: (res: any) => {
        if (
          res &&
          (res.flag === '1' || res.status === 'success' || res === '1')
        ) {
          notify(
            {
              message: 'Data Updated Successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
        } else {
          notify(
            {
              message: res?.message || 'Your Data Not Saved',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
        }

        event.component.cancelEditData();
        this.dataGrid.instance.refresh();
      },
      error: (err: any) => {
        notify(
          {
            message: err?.message || 'Update Failed',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error',
        );
        event.component.cancelEditData();
      },
    });

    event.cancel = true;
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_icdAdocMapping_Row_Data(SelectedRow.ID)
      .subscribe({
        next: (res: any) => {
          if (
            res &&
            (res.flag === '1' ||
              res.status === 'success' ||
              res === '1' ||
              res.data === 'Deleted Successfully')
          ) {
            notify(
              {
                message: 'Delete operation successful',
                position: { at: 'top right', my: 'top right' },
                displayTime: 500,
              },
              'success',
            );
          } else {
            notify(
              {
                message: res?.message || 'Delete operation failed',
                position: { at: 'top right', my: 'top right' },
                displayTime: 500,
              },
              'error',
            );
          }
          event.component.refresh();
          this.dataGrid.instance.refresh();
        },
        error: (err: any) => {
          notify(
            {
              message: err?.message || 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
          event.component.refresh();
        },
      });
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileGroupName = 'ICD-ADOC-Mapping';
    this.service.exportDataGrid(event, fileGroupName);
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxPopupModule,
    DxCheckBoxModule,
    DxFormModule,
    DxValidatorModule,
    DxValidationSummaryModule,
  ],
  declarations: [IcdAdocMappingComponent],
  exports: [IcdAdocMappingComponent],
})
export class IcdAdocMappingModule {}
