import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
  DxCheckBoxModule,
  DxDataGridComponent,
  DxFormModule,
} from 'devextreme-angular';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-adoc-class',
  templateUrl: './adoc-class.component.html',
  styleUrl: './adoc-class.component.scss',
  providers: [ReportService, DataService],
})
export class ADOCClassComponent {
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
        this.masterService.get_adocClass_List().subscribe({
          next: (response: any) => resolve(response.datas),
          error: (error: any) => reject(error.message),
        });
      }),
  });

  addButtonOptions: any;
  menuPrevilage: any;

  newADOCClass = {
    Code: '',
    Name: '',
    ADOCGroupID: null,
    Isinactive: false,
  };
  ADOC_Category_List: any[] = [];

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

    this.get_ADOC_GROUP_Dropdown();

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

  async get_ADOC_GROUP_Dropdown(): Promise<void> {
    const dropdownType = 'ADOC_GROUP';
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType),
    );
    if (response) {
      this.ADOC_Category_List = response;
    }
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
  onDataSaving() {
    this.masterService
      .Insert_adocClass_Data(
        this.newADOCClass.Code,
        this.newADOCClass.Name,
        this.newADOCClass.ADOCGroupID,
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
          this.newADOCClass = {
            Code: '',
            Name: '',
            ADOCGroupID: null,
            Isinactive: false,
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
    let Code = combinedData.ClassCode;
    let Name = combinedData.ClassName;
    let adocCategory = combinedData.ADOCGroupID;
    let IsInactive = combinedData.IsInactive;

    this.masterService
      .update_adocClass_data(id, Code, Name, adocCategory, IsInactive)
      .subscribe((data: any) => {
        if (data) {
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
      .Remove_adocClass_Row_Data(SelectedRow.ID)
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
    const fileName = 'ADOC-Class';
    this.service.exportDataGrid(event, fileName);
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
  declarations: [ADOCClassComponent],
})
export class ADOCClassListModule {}
