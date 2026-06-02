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
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-adoc-group',
  templateUrl: './adoc-group.component.html',
  styleUrl: './adoc-group.component.scss',
  providers: [ReportService, DataService],
})
export class ADOCGroupComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

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
    private dataService: DataService,
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

  // =========== Save data  =========
  saveADOCGroup() {
    this.masterService
      .Insert_adocGroup_Data(
        this.newADOCGroup.GroupCode,
        this.newADOCGroup.GroupName,
        this.newADOCGroup.Chargeable,
        false, // Status always false while adding
      )
      .subscribe({
        next: () => {
          notify(
            {
              message: 'ADOC Group Added Successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
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
          notify(
            {
              message: 'Save Failed',
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
    const updataDate = event.newData;
    const oldData = event.oldData;
    const combinedData = { ...oldData, ...updataDate };
    let id = combinedData.ID;
    let GroupCode = combinedData.GroupCode;
    let GroupName = combinedData.GroupName;
    let Chargeable = combinedData.IsChargeable;
    let IsInactive = combinedData.IsInactive;

    this.masterService
      .update_adocGroup_data(id, GroupCode, GroupName, Chargeable, IsInactive)
      .subscribe((res: any) => {
        if (res.flag === '1') {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: `data updated Successfully`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
        }
        event.component.cancelEditData(); // Close the popup
        this.dataGrid.instance.refresh();
      });

    event.cancel = true; // Prevent the default update operation
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_adocGroupList_Row_Data(SelectedRow.ID)
      .subscribe(() => {
        try {
          notify(
            {
              message: 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
        } catch (error) {
          notify(
            {
              message: 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
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
  ],
  declarations: [ADOCGroupComponent],
})
export class ADOCGroupModule {}
