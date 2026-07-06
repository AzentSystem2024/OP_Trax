import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DxDataGridModule,
  DxButtonModule,
  DxPopupModule,
  DxFormModule,
  DxFormComponent,
  DxDataGridComponent,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import DataSource from 'devextreme/data/data_source';
import { MasterReportService } from '../master-report.service';
import { ReportService } from 'src/app/services/Report-data.service';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-icd-master',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxPopupModule,
    DxFormModule,
  ],
  templateUrl: './icd-master.component.html',
  styleUrls: ['./icd-master.component.scss'],
  providers: [MasterReportService, ReportService, DataService]
})
export class IcdMasterComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;
  @ViewChild('addForm', { static: false }) addForm!: DxFormComponent;

  menuPrevilage: any = { CanEdit: true, CanDelete: true, CanAdd: true };
  
  allowedPageSizes: any = [10, 20, 50, 100, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  
  isFilterRowVisible = false;
  
  isAddPopupVisible = false;
  newIcdData: any = {
    ICDCode: '',
    ICDName: '',
    ICDDescription: '',
    IsInactive: false
  };

  addButtonOptions: any;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.Get_IcdMaster_Data().subscribe({
          next: (response: any) => resolve(response.datas),
          error: (error) => reject(error.message),
        });
      }),
  });

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });

    this.toggleFilterRow = this.toggleFilterRow.bind(this);
    this.refresh = this.refresh.bind(this);
    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage?.CanAdd,
      onClick: () => {
        this.newIcdData = { ICDCode: '', ICDName: '', ICDDescription: '', IsInactive: false };
        this.isAddPopupVisible = true;
      },
      elementAttr: { class: 'add-button' },
    };
  }

  ngOnInit(): void {
  }

  onExporting(e: any) {
    const fileName = 'icd_master';
    this.service.exportDataGrid(e, fileName);
  }

  onRowRemoving(e: any) {
    e.cancel = true;
    let SelectedRow = e.key;
    this.masterService
      .Remove_IcdMaster_Row_Data(SelectedRow.ID)
      .subscribe(() => {
        try {
          notify(
            {
              message: 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
        } catch (error) {
          notify(
            {
              message: 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
        e.component.refresh();
        if (this.dataGrid && this.dataGrid.instance) {
            this.dataGrid.instance.refresh();
        }
      });
  }

  onRowUpdating(e: any) {
    const updataDate = e.newData;
    const oldData = e.oldData;
    const combinedData = { ...oldData, ...updataDate };
    let id = combinedData.ID;
    let ICDCode = combinedData.ICDCode;
    let ICDName = combinedData.ICDName;
    let ICDDescription = combinedData.ICDDescription;
    let IsInactive = combinedData.IsInactive;

    this.masterService
      .update_IcdMaster_data(id, ICDCode, ICDName, ICDDescription, IsInactive)
      .subscribe((data: any) => {
        if (data) {
          if (this.dataGrid && this.dataGrid.instance) {
            this.dataGrid.instance.refresh();
          }
          notify(
            {
              message: `ICD Master updated Successfully`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
        e.component.cancelEditData(); // Close the popup
        if (this.dataGrid && this.dataGrid.instance) {
            this.dataGrid.instance.refresh();
        }
      });

    e.cancel = true; // Prevent the default update operation
  }

  toggleFilterRow() {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  }

  refresh() {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.refresh();
    }
  }

  onPopupHiding() {
    this.isAddPopupVisible = false;
  }

  saveNewIcd(formInstance: any) {
    const validation = formInstance.validate();
    if (validation.isValid) {
      const { ICDCode, ICDName, ICDDescription } = this.newIcdData;
      this.masterService
        .Insert_IcdMaster_Data(ICDCode, ICDName, ICDDescription)
        .subscribe((response: any) => {
          if (response) {
            if (this.dataGrid && this.dataGrid.instance) {
                this.dataGrid.instance.refresh();
            }
            notify(
              {
                message: `New ICD Master "${ICDCode}" saved Successfully`,
                position: { at: 'top right', my: 'top right' },
              },
              'success'
            );
          } else {
            notify(
              {
                message: `Your Data Not Saved`,
                position: { at: 'top right', my: 'top right' },
              },
              'error'
            );
          }
        });
      this.isAddPopupVisible = false;
    }
  }
}
