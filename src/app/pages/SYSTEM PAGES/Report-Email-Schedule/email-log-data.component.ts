import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { ReportService } from 'src/app/services/Report-data.service';
import DataSource from 'devextreme/data/data_source';
import { DataService } from 'src/app/services';
import CustomStore from 'devextreme/data/custom_store';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-email-log-data',
  templateUrl: './email-log-data.component.html',
  styleUrls: ['./email-log-data.component.scss'],
  providers: [DataService, MasterReportService, ReportService],
})
export class EmailLogDataComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.dataService.get_email_Log_data().subscribe({
          next: (response: any) => {
            resolve(response.data);
            this.update_Columns();
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  newButtonOptions = {
    text: 'New',
    icon: 'bi bi-file-earmark-plus',
    type: 'default',
    width: 'auto',
    stylingMode: 'contained',
    hint: 'Add new clinician',
    onClick: () => this.show_new__Form(),
    elementAttr: { class: 'add-button' },
  };

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;

  SearchOn_DataSource: any;
  EncounterType_DataSource: any;
  FacilityDataSource: any;
  timePeriodDataSource: any;
  reportNameDatasource: any;
  userListDataSource: any;
  columns: any[];

  is_EditFormVisible: boolean = false;
  is_addFormVisible: boolean = false;

  selectedRowData: any;
  editableColumns: any;

  Facility_DataSource: any;

  formData: any;
  newReportIDValue: any[];
  newSearchOnValue: any;
  Facility_Value: any[];
  newEncounterTypeValue: any;
  newDatePeriodValue: any;
  newUserIDValue: any = [];
  isFilterRowVisible: boolean = false;

  constructor(
    private masterService: MasterReportService,
    private service: ReportService,
    private dataService: DataService
  ) {
    this.get_filter_dropdownValues();
    this.get_dropdown_Datasource();
  }

  //===================on editing start event of datagrid===================
  onEditingStart(event) {
    const rowData = event.data;
    event.cancel = true;
    this.selectedRowData = {
      ...rowData,
      DatePeriod: parseInt(rowData.DatePeriod, 10),
    };
    console.log('edit row data:>>', this.selectedRowData);
    this.is_EditFormVisible = true;
  }
  //======================
  onFacilityValueChanged(cellInfo: any, event: any) {
    cellInfo.setValue(event.value);
  }

  //==================MAking cutom datasource for facility datagrid and dropdown loADING=======
  makeAsyncDataSourceFromJson(jsonData: any) {
    return new CustomStore({
      loadMode: 'raw',
      key: 'ID',
      load: () => {
        return new Promise((resolve, reject) => {
          try {
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      },
    });
  }

  // ================================

  makeAsyncDataSourceFromJsonforUser(jsonData: any) {
    return new CustomStore({
      loadMode: 'raw',
      key: 'UserID',
      load: () => {
        return new Promise((resolve, reject) => {
          try {
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      },
    });
  }
  //=======================update column data custom=====================
  update_Columns() {
    this.columns = [
      {
        dataField: 'ReportName',
        caption: 'ReportName',
        alignment: 'left',
        cellTemplate: (container: any, options: any) => {
          const textDiv = document.createElement('div');
          textDiv.innerText = options.value;
          textDiv.style.whiteSpace = 'normal';
          textDiv.style.wordWrap = 'break-word';
          container.appendChild(textDiv);
        },
      },
      // {
      //   dataField: 'SearchOn',
      //   caption: 'Search On',
      // },
      {
        dataField: 'EncounterType',
        caption: 'Encounter Type',
        width: 'auto',
      },
      {
        dataField: 'FacilityName',
        caption: 'Facility Name',
        cellTemplate: (container: any, options: any) => {
          const textDiv = document.createElement('div');
          textDiv.innerText = options.value;
          textDiv.style.whiteSpace = 'normal';
          textDiv.style.wordWrap = 'break-word';
          container.appendChild(textDiv);
        },
      },
      {
        dataField: 'DatePeriodValue',
        caption: 'Date Period',
        width: 'auto',
      },
      {
        dataField: 'EmailUserName',
        caption: 'Users',
        cellTemplate: (container: any, options: any) => {
          const textDiv = document.createElement('div');
          textDiv.innerText = options.value;
          textDiv.style.whiteSpace = 'normal';
          textDiv.style.wordWrap = 'break-word';
          container.appendChild(textDiv);
        },
      },
    ];
  }
  //=======================fetch values dropdown fields================
  get_filter_dropdownValues() {
    this.masterService.Get_Facility_List_Data().subscribe((response: any) => {
      if (response.flag == '1') {
        this.Facility_DataSource = this.makeAsyncDataSourceFromJson(
          response.data
        );
      }
    });

    this.masterService.get_User_data().subscribe((response: any) => {
      this.userListDataSource =
        this.makeAsyncDataSourceFromJsonforUser(response);
    });

    this.service.get_SearchParametrs_Data().subscribe((response: any) => {
      if (response.flag == '1') {
        this.SearchOn_DataSource = response.SearchOn;
        this.EncounterType_DataSource = response.EncounterType;
        this.FacilityDataSource = response.facility;
      }
    });
  }

  //======================Drop down datas===========================
  get_dropdown_Datasource() {
    this.masterService
      .Get_GropDown('REPORT_PERIOD')
      .subscribe((response: any) => {
        this.timePeriodDataSource = response;
      });

    this.masterService.Get_GropDown('REPORT').subscribe((response: any) => {
      this.reportNameDatasource = this.makeAsyncDataSourceFromJson(response);
    });
  }
  //===============show add new alert popup===================
  show_new__Form = () => {
    this.is_addFormVisible = true;
  };
  //=================Reset add new form============
  resert_addNew_Form() {
    this.newReportIDValue = null;
    this.Facility_Value = [];
    this.newSearchOnValue = null;
    this.newEncounterTypeValue = null;
    this.newDatePeriodValue = null;
    this.newUserIDValue = [];
    this.is_addFormVisible = false;
    this.is_EditFormVisible = false;
  }

  //===============Save New Email Alert Data===================
  On_Click_save_new_Data() {
    this.formData = {
      reportID: this.newReportIDValue.join(','),
      facilities: this.Facility_Value.join(','),
      searchOn: this.newSearchOnValue,
      encounterType: this.newEncounterTypeValue,
      datePeriod: this.newDatePeriodValue,
      userEmailID: this.newUserIDValue.join(','),
    };
    this.dataService
      .insert_Email_alert_Data(this.formData)
      .subscribe((response: any) => {
        if (response.Flag === 1) {
          this.resert_addNew_Form();
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
        } else {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
        }
      });
  }

  //===============reset the datagrid===================
  resetForm() {
    this.is_EditFormVisible = false;
  }
  //==================Edit Save Button============================
  On_Update_Log_Data() {
    const formdata = this.selectedRowData;
    this.dataService
      .update_Email_alert_Data(formdata)
      .subscribe((response: any) => {
        if (response.Flag === 1) {
          this.resert_addNew_Form();
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
        } else {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
        }
      });
  }
  //======================Refresh Datagrid==================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };
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
    DxDateBoxModule,
    DxTagBoxModule,
    DxPopupModule,
    DxFormModule,
    DxDropDownBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [EmailLogDataComponent],
})
export class EmailLogDataModule {}
