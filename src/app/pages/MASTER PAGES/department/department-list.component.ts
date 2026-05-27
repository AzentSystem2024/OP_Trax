import {
  Component,
  ViewChild,
  NgModule,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDataGridComponent,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxPopupModule,
} from 'devextreme-angular';
import { exportDataGrid as exportDataGridToPdf } from 'devextreme/pdf_exporter';
import { exportDataGrid as exportDataGridToXLSX } from 'devextreme/excel_exporter';
// import { CardActivitiesModule, ContactStatusModule } from 'src/app/components';
import DataSource from 'devextreme/data/data_source';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver-es';
import { jsPDF } from 'jspdf';
import notify from 'devextreme/ui/notify';
import { FormPopupModule } from 'src/app/components';
import { ContactPanelModule } from 'src/app/components/library/contact-panel/contact-panel.component';
// import {
//   DenialNewFormComponent,
//   DenialNewFormModule,
// } from 'src/app/pages/POP-UP_PAGES/denial-new-form/denial-new-form.component';
import { DepartmentNewFormComponent,DepartmentNewFormModule } from '../../POP-UP_PAGES/department-new-form/department-new-form.component';
import { DepartmentEditFormComponent,DepartmentEditFormModule } from '../../POP-UP_PAGES/department-edit-form/department-edit-form.component';
import { DxLookupModule } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';

@Component({
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
  providers: [DataService, ReportService],
})
export class DepartmentListComponent  {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(DepartmentNewFormComponent, { static: false })
  departmentComponent: DepartmentNewFormComponent;

  isPanelOpened = false;

  isAddDepartmentPopupOpened = false;
  isEditDepartmentPopupOpened = false;

  Denial_Type_DropDownData: any;
  Denial_category_DropDownData: any;
  ID: any;
  isFilterOpened = true;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  //=================Fetchiong DataSource=====================
  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.getDepartmentData().subscribe({
          next: (res: any) => resolve(res.datas),
          error: ({ message }) => reject(message),
        });
      }),
  });

  addButtonOptions :any

  isFilterRowVisible: boolean = false;

  GridSource: any;
  currentPathName: string;
  initialized: boolean;
  selectedDepartment: any;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean; };

  constructor(
    private service: MasterReportService,
    private router: Router,
    private route: ActivatedRoute,
    private reportservice: ReportService,
    private dataService: DataService
  ) {
    this.getDenial_DropDown();
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
      disabled:!this.menuPrevilage.CanAdd,
      onClick: () => this.addDenial(),
      elementAttr: { class: 'add-button' }
    };
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  openEditingStart(event: any) {
    event.cancel = true;
    const ID = event.data.ID;
    this.service.selectDepartment(ID).subscribe((response: any) => {
      this.selectedDepartment = response.data;
      this.isEditDepartmentPopupOpened = true;
    });
  }

  handleFormClosed() {
    this.isAddDepartmentPopupOpened = false;
    this.isEditDepartmentPopupOpened = false;

    this.departmentComponent.reset_NewDenialFormData()

    this.dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.getDepartmentData().subscribe({
          next: (res: any) => resolve(res.datas),
          error: ({ message }) => reject(message),
        });
      }),
  });
  }

  //=====================Search on Each Column===========
  applyFilter() {
    this.GridSource.filter();
  }

  addDenial() {
    this.isAddDepartmentPopupOpened = true;
  }

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  //================Exporting Function=====================
  onExporting(event: any) {
    const fileName = 'department';
    this.reportservice.exportDataGrid(event, fileName);
  }

  //=============Get Denial Type Drop dwn Data==============================
  getDenial_DropDown() {
    this.service.Get_GropDown('DENIALTYPE').subscribe((data: any) => {
      this.Denial_Type_DropDownData = data;
    });

    this.service.Get_GropDown('DENIALCATEGORY').subscribe((data: any) => {
      this.Denial_category_DropDownData = data;
    });
  }

  // =================Remove Denial=========================
  onRowRemoving(event: any) {
    event.cancel = true;
    var SelectedRow = event.key;
    this.service.removeDepartment(SelectedRow.ID).subscribe(() => {
      try {
        notify(
          {
            message: 'Delete operation successful',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'success'
        );

        // window.location.reload();
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
      event.component.refresh();
      this.dataGrid.instance.refresh();
    });
  }
}

@NgModule({
  imports: [
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    ContactPanelModule,
    FormPopupModule,
    CommonModule,
    DxPopupModule,
    DepartmentNewFormModule,
    DepartmentEditFormModule
  ],
  providers: [],
  exports: [],
  declarations: [DepartmentListComponent],
})
export class DepartmentListModule {}
