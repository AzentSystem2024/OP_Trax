import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { InsuranceNewFormComponent } from '../../POP-UP_PAGES/insurance-new-form/insurance-new-form.component';
import { InsuranceNewFormModule } from '../../POP-UP_PAGES/insurance-new-form/insurance-new-form.component';
import DataSource from 'devextreme/data/data_source';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
import { MasterReportService } from '../master-report.service';
import { ReportService } from 'src/app/services/Report-data.service';
@Component({
  selector: 'app-insurance-master',
  templateUrl: './insurance-master.component.html',
  styleUrl: './insurance-master.component.scss'
})
export class InsuranceMasterComponent {

  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;
  @ViewChild(InsuranceNewFormComponent, { static: false })
  InsuranceNewForm!: InsuranceNewFormComponent;
  insuranceList: any[] = []

  showSearchBox = false;
  showSearchIcon = true;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;
  isAddFormPopupOpened: boolean = false;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_Insurance_List().subscribe({
          next: (response: any) => {
            this.insuranceList = response.data;

            resolve(response.data)
          }, // Resolve with the data
          error: (error) => reject(error.message), // Reject with the error message
        });
      }),
  });

  addButtonOptions = {
    text: 'New',
    icon: 'bi bi-plus-circle-fill',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Add new entry',
    onClick: () => this.show_new_Form(),
    elementAttr: { class: 'add-button' },
  };
  isFilterRowVisible: boolean = false;
  currentPathName: any;
  initialized: boolean = false;
  insuranceClassificationList: any[] = [];
  menuPrevilage: any;

  constructor(
    private masterService: MasterReportService,
    private service: ReportService,
    private dataService: DataService,
    private activatedRoute: ActivatedRoute, private notificationService: NotificationService
  ) {
    this.fetch_classification_Dropdown();
    this.activatedRoute.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
  }

  fetch_classification_Dropdown() {
    this.masterService.Get_GropDown('INSURANCECLASSIFICATION').subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.insuranceClassificationList = res;
        } else {
          this.insuranceClassificationList = [];
          console.warn(
            'Insurance Classification dropdown: Invalid response format',
            res
          );
        }
      },
      error: (err: any) => {
        this.insuranceClassificationList = [];
        console.error('Failed to load Insurance Classification dropdown', err);
      },
    });
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  ShowSearch = () => {
    this.showSearchIcon = !this.showSearchIcon;
    this.showSearchBox = !this.showSearchBox;
  };

  //=========================show new popup======================
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }


  //==========================duplication validate=================
  validateInsuranceForm = (): boolean => {
    const isFormValid = this.InsuranceNewForm?.validateForm() ?? false;

    if (!isFormValid) {
      return false;
    }

    const {
      InsuranceID,
      InsuranceName,
      InsuranceShortName,
    } = this.InsuranceNewForm.getNewInsuranceData();

    // Insurance ID duplicate
    const duplicateID = this.insuranceList.some(
      (item: any) =>
        item.InsuranceID?.trim().toLowerCase() ===
        InsuranceID?.trim().toLowerCase()
    );

    if (duplicateID) {
      this.notificationService.showNotification('Insurance ID already exists.', 'error');
      return false;
    }

    // Insurance Name duplicate
    const duplicateName = this.insuranceList.some(
      (item: any) =>
        item.InsuranceName?.trim().toLowerCase() ===
        InsuranceName?.trim().toLowerCase()
    );

    if (duplicateName) {
      this.notificationService.showNotification('Insurance Name already exists.', 'error');
      return false;
    }

    // Insurance Short Name duplicate
    const duplicateShortName = this.insuranceList.some(
      (item: any) =>
        item.InsuranceShortName?.trim().toLowerCase() ===
        InsuranceShortName?.trim().toLowerCase()
    );

    if (duplicateShortName) {
      this.notificationService.showNotification('Insurance Short Name already exists.', 'error');
      return false;
    }

    return true;
  };

  //====================Add data ================================
  onClickSaveNewData = () => {
    const { InsuranceID, InsuranceName, InsuranceShortName, } =
      this.InsuranceNewForm.getNewInsuranceData();
    this.masterService
      .Insert_Insurance_Data(
        InsuranceID,
        InsuranceName,
        InsuranceShortName,


      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New Insurance "${InsuranceID} ${InsuranceName} ${InsuranceShortName}" saved Successfully`, 'success');
        } else {
          this.notificationService.showNotification(`Your Data Not Saved`, 'error');
        }
      });
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Insurance';
    this.service.exportDataGrid(event, fileName);
  }
  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_Insurance_Row_Data(SelectedRow.ID)
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

  //===================RTow Data Update==========================
  onRowUpdating(event: any) {
    const updataDate = event.newData;
    const oldData = event.oldData;
    const combinedData = { ...oldData, ...updataDate };
    let id = combinedData.ID;
    let Insuranceid = combinedData.InsuranceID;
    let InsuranceName = combinedData.InsuranceName;
    let InsuranceShortName = combinedData.InsuranceShortName;
    let ClassificationID = combinedData.ClassificationID;
    // Duplicate Insurance ID
    const duplicateID = this.insuranceList.some(
      (item: any) =>
        item.ID !== id &&
        item.InsuranceID?.trim().toLowerCase() ===
        Insuranceid?.trim().toLowerCase()
    );

    if (duplicateID) {
      this.notificationService.showNotification('Insurance ID already exists.', 'error');
      event.cancel = true;
      return;
    }

    // Duplicate Insurance Name
    const duplicateName = this.insuranceList.some(
      (item: any) =>
        item.ID !== id &&
        item.InsuranceName?.trim().toLowerCase() ===
        InsuranceName?.trim().toLowerCase()
    );

    if (duplicateName) {
      this.notificationService.showNotification('Insurance Name already exists.', 'error');
      event.cancel = true;
      return;
    }

    // Duplicate Insurance Short Name
    const duplicateShortName = this.insuranceList.some(
      (item: any) =>
        item.ID !== id &&
        item.InsuranceShortName?.trim().toLowerCase() ===
        InsuranceShortName?.trim().toLowerCase()
    );

    if (duplicateShortName) {
      this.notificationService.showNotification('Insurance Short Name already exists.', 'error');
      event.cancel = true;
      return;
    }


    this.masterService
      .update_Insurance_data(
        id,
        Insuranceid,
        InsuranceName,
        InsuranceShortName,
        ClassificationID

      )
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`f Insurance updated Successfully`, 'success');
        } else {
          this.notificationService.showNotification(`Your Data Not Saved`, 'error');
        }
        // event.component.refresh();
        event.component.cancelEditData(); // Close the popup
        this.dataGrid.instance.refresh();
      });

    event.cancel = true; // Prevent the default update operation
  }
  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    FormPopupModule,
    InsuranceNewFormModule,
  ],
  providers: [ReportService],
  exports: [],
  declarations: [InsuranceMasterComponent],
})
export class InsuranceMasterModule { }