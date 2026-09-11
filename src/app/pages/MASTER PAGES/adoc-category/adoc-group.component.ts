import { CommonModule } from '@angular/common';
import { Component, ViewChild, NgModule } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
  DxDataGridComponent,
  DxCheckBoxModule,
  DxFormModule,
  DxValidationSummaryModule,
  DxValidatorModule,
  DxFormComponent,
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-adoc-group',
  templateUrl: './adoc-group.component.html',
  styleUrl: './adoc-group.component.scss',
  providers: [ReportService, DataService],
})
export class ADOCGroupComponent {
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

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_adocGroup_List().subscribe({
          next: (response: any) => resolve(response.datas),
          error: (error: any) => reject(error.message),
        });
      }),
  });

  addButtonOptions: any;

  chargeableList = [
    { ID: true, Name: 'Yes' },
    { ID: false, Name: 'No' },
  ];

  menuPrevilage: any;

  newADOCGroup = {
    GroupCode: '',
    GroupName: '',
    Chargeable: '',
    Status: false,
  };

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private route: ActivatedRoute,
    private dataService: DataService, private notificationService: NotificationService
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
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
  }

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
    this.newADOCGroup = {
      GroupCode: '',
      GroupName: '',
      Chargeable: '',
      Status: false,
    };

    this.addForm?.instance.reset();
  }


  isDuplicateGroupCode(code: string, currentId: number = 0): boolean {

  const gridData = this.dataGrid.instance.getDataSource().items();

  return gridData.some((item: any) =>
    item.GroupCode?.trim().toLowerCase() === code.trim().toLowerCase() &&
    item.ID !== currentId
  );
}

  // =========== Save data  =========
  saveADOCGroup() {
    const result = validationEngine.validateGroup('adocGroupValidation');

    if (!result.isValid) {
      this.notificationService.showNotification('Please fill all required fields', 'warning');
      return;
    }


    if (this.isDuplicateGroupCode(this.newADOCGroup.GroupCode)) {

    this.notificationService.showNotification('Code already exists', 'error');

    return;
  }

    this.masterService
      .Insert_adocGroup_Data(
        this.newADOCGroup.GroupCode,
        this.newADOCGroup.GroupName,
        this.newADOCGroup.Chargeable,
        false,
      )
      .subscribe({
        next: () => {
          this.notificationService.showNotification('ADOC Group Added Successfully', 'success');

          this.isAddPopupVisible = false;

          this.newADOCGroup = {
            GroupCode: '',
            GroupName: '',
            Chargeable: '',
            Status: false,
          };

          this.dataGrid.instance.refresh();
        },
        error: () => {
          this.notificationService.showNotification('Save Failed', 'error');
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
      !combinedData.GroupCode?.trim() ||
      !combinedData.GroupName?.trim() ||
      combinedData.IsChargeable === null ||
      combinedData.IsChargeable === undefined ||
      combinedData.IsChargeable === ''
    ) {
      this.notificationService.showNotification('Please fill all required fields', 'warning');

      event.cancel = true;
      return;
    }

    let id = combinedData.ID;
    let GroupCode = combinedData.GroupCode;
    let GroupName = combinedData.GroupName;
    let Chargeable = combinedData.IsChargeable;
    let IsInactive = combinedData.IsInactive;

    this.masterService
      .update_adocGroup_data(id, GroupCode, GroupName, Chargeable, IsInactive)
      .subscribe((res: any) => {
        if (res.flag === '1') {
          this.notificationService.showNotification('Data Updated Successfully', 'success');
        } else {
          this.notificationService.showNotification('Your Data Not Saved', 'error');
        }

        event.component.cancelEditData();
        this.dataGrid.instance.refresh();
      });

    event.cancel = true;
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_adocGroupList_Row_Data(SelectedRow.ID)
      .subscribe(() => {
        try {
          this.notificationService.showNotification('Delete operation successful', 'success');
        } catch (error) {
          this.notificationService.showNotification('Delete operation failed', 'error');
        }
        event.component.refresh();
        this.dataGrid.instance.refresh();
      });
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileGroupName = 'ADOC-Group';
    this.service.exportDataGrid(event, fileGroupName);
  }

    isFilterApplied: boolean = false;

    onGridOptionChanged(e: any) {

            if (e.fullName && e.fullName.toLowerCase().includes('filter')) {
              setTimeout(() => {
                if (this.dataGrid && this.dataGrid.instance) {
                  this.isFilterApplied = !!this.dataGrid.instance.getCombinedFilter();
                }
              });
            }
                    
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
  declarations: [ADOCGroupComponent],
})
export class ADOCGroupModule {}
