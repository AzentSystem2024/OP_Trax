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
import { SubDepartmentNewFormComponent,SubDepartmentNewFormModule } from '../../POP-UP_PAGES/sub-department-new-form/sub-department-new-form.component';
import { SubDepartmentEditFormComponent,SubDepartmentEditFormModule } from '../../POP-UP_PAGES/sub-department-edit-form/sub-department-edit-form.component';
import { DxLookupModule } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';

@Component({
  templateUrl: './sub-department-list.component.html',
  styleUrls: ['./sub-department-list.component.scss'],
  providers: [DataService, ReportService],
})
export class SubDepartmentListComponent  {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  // @ViewChild(DepartmentNewFormComponent, { static: false })
  // denialComponent: DepartmentNewFormComponent;

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
        this.service.getSubDepartmentData().subscribe({
          next: (res: any) => resolve(res.datas),
          error: ({ message }) => reject(message),
        });
      }),
  });

  addButtonOptions:any

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
    this.getDenial_DropDown();

  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  openEditingStart(event: any) {
    event.cancel = true;
    // this.editingStart.emit(event);

    const ID = event.data.ID;

    // Open the popup
    // this.isEditDepartmentPopupOpened = true;

    // Fetch the item data
    this.service.selectSubDepartment(ID).subscribe((response: any) => {
      // console.log(response, "select!!!");
      this.selectedDepartment = response.data;
      this.isEditDepartmentPopupOpened = true;
    });
  }

  handleFormClosed() {
    this.isAddDepartmentPopupOpened = false;
    this.isEditDepartmentPopupOpened = false;

    this.dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.getSubDepartmentData().subscribe({
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
    const fileName = 'sub_department';
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
  //============ADD NEW DENIALS======================

  // onClickSaveNewDenial = () => {
  //   const { DenialCode, Description, DenialTypeID, DenialCategoryID } =
  //     this.denialComponent.getNewDenialData();
  //   this.service
  //     .addDenial(DenialCode, Description, DenialTypeID, DenialCategoryID)
  //     .subscribe((result: any) => {
  //       if (result) {
  //         this.dataGrid.instance.refresh();
  //         notify(
  //           {
  //             message: `New Denial "${DenialCode} ${Description} ${DenialTypeID} ${DenialCategoryID}" saved Successfully`,
  //             position: { at: 'top right', my: 'top right' },
  //           },
  //           'success'
  //         );
  //         this.denialComponent.reset_NewDenialFormData();
  //       } else {
  //         notify(
  //           {
  //             message: `Your Data Not Saved`,
  //             position: { at: 'top right', my: 'top right' },
  //           },
  //           'error'
  //         );
  //       }
  //     });
  // };

  //====================Update Denial Row Data==============

  // onRowUpdating(event: any) {
  //   const updataDate = event.newData;
  //   const oldData = event.oldData;
  //   const combinedData = { ...oldData, ...updataDate };
  //   let id = combinedData.ID;
  //   let code = combinedData.DenialCode;
  //   let Description = combinedData.Description;
  //   let DenialTypeID = combinedData.DenialTypeID;
  //   let DenialCategoryID = combinedData.DenialCategoryID;

  //   this.service
  //     .updateDenial(id, code, Description, DenialTypeID, DenialCategoryID)
  //     .subscribe((data: any) => {
  //       if (data) {
  //         notify(
  //           {
  //             message: `New Denial updated Successfully`,
  //             position: { at: 'top center', my: 'top center' },
  //             displayTime: 500,
  //           },
  //           'success'
  //         );
  //       } else {
  //         notify(
  //           {
  //             message: `Your Data Not Saved`,
  //             position: { at: 'top right', my: 'top right' },
  //             displayTime: 500,
  //           },
  //           'error'
  //         );
  //       }
  //       // event.component.refresh();
  //       event.component.cancelEditData(); // Close the popup
  //       this.dataGrid.instance.refresh();
  //     });

  //   event.cancel = true; // Prevent the default update operation
  // }

  // =================Remove Denial=========================
  onRowRemoving(event: any) {
    event.cancel = true;
    var SelectedRow = event.key;
    this.service.removeSubDepartment(SelectedRow.ID).subscribe(() => {
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
    SubDepartmentNewFormModule,
    SubDepartmentEditFormModule
  ],
  providers: [],
  exports: [],
  declarations: [SubDepartmentListComponent],
})
export class SubDepartmentListModule {}
