import { CommonModule } from '@angular/common';
import {
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
  DxCheckBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { InsuranceNewFormModule } from '../../POP-UP_PAGES/insurance-new-form/insurance-new-form.component';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { SpecialityNewFormComponent } from '../../POP-UP_PAGES/speciality-new-form/speciality-new-form.component';
import { SpecialityNewFormModule } from '../../POP-UP_PAGES/speciality-new-form/speciality-new-form.component';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
@Component({
  selector: 'app-speciality',
  templateUrl: './speciality.component.html',
  styleUrls: ['./speciality.component.scss'],
  providers: [ReportService, DataService],
})
export class SpecialityComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(SpecialityNewFormComponent, { static: false })
  SpecialityNewForm!: SpecialityNewFormComponent;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;
  isAddFormPopupOpened: boolean = false;
  list_Speciality: any[] = [];

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_Speciality_List().subscribe({
          next: (response: any) => resolve(response.data),
          error: (error) => reject(error.message),
        });
      }),
  });

  addButtonOptions: any;

  isFilterRowVisible: boolean = false;
  menuPrevilage: any;
  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute, private notificationService: NotificationService
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
      onClick: () => this.show_new_Form(),
      elementAttr: { class: 'add-button' },
    };


    this.get_speciality_List()

  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };
  //========================show new popup=========================
  show_new_Form() {
    this.isAddFormPopupOpened = true;
    this.clearSpecialityForm()
  }

  // validateSpecialityForm = (): boolean => {
  //   return this.SpecialityNewForm?.validateForm() ?? false;
  // };
  validateSpecialityForm = (): boolean => {
    const isFormValid =
      this.SpecialityNewForm?.validateForm() ?? false;

    if (!isFormValid) {
      return false;
    }

    const { SpecialityCode } =
      this.SpecialityNewForm.getNewSpecialityData();

    const duplicate = this.list_Speciality.some(
      (item: any) =>
        item.SpecialityCode?.trim().toLowerCase() ===
        SpecialityCode?.trim().toLowerCase()
    );

    if (duplicate) {
      this.notificationService.showNotification('Speciality Code already exists', 'error');

      return false;
    }

    return true;
  };

  //========================Get Datasource =======================

  //====================Add data ================================
  onClickSaveNewData = () => {
    const { SpecialityCode, SpecialityName, SpecialityShortName, Description, IsADOCExcluded } =
      this.SpecialityNewForm.getNewSpecialityData();


    this.masterService
      .Insert_Speciality_Data(
        SpecialityCode,
        SpecialityName,
        SpecialityShortName,
        Description, IsADOCExcluded
      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New speciality  saved Successfully`, 'success');
        } else {
          this.notificationService.showNotification(`Your Data Not Saved`, 'error');
        }
      });
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Speciality';
    this.service.exportDataGrid(event, fileName);
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_Speciality_Row_Data(SelectedRow.ID)
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
    console.log('Row updating event:', this.list_Speciality);
    const updataDate = event.newData;
    const oldData = event.oldData;
    console.log(updataDate, oldData);
    const combinedData = { ...oldData, ...updataDate };
    
    let id = combinedData.ID;
    let SpecialityCode = combinedData.SpecialityCode;
    let SpecialityName = combinedData.SpecialityName;
    let SpecialityShortName = combinedData.SpecialityShortName;
    let Description = combinedData.Description;
    let IsADOCExcluded = combinedData.IsADOCExcluded;
    // Check duplicate SpecialityCode
    const duplicate = this.list_Speciality.find(
      (item: any) =>
        item.SpecialityCode?.toLowerCase().trim() ===
        combinedData.SpecialityCode?.toLowerCase().trim() &&
        item.ID !== combinedData.ID
    );

    if (duplicate) {
      this.notificationService.showNotification('Speciality Code already exists', 'error');

      event.cancel = true;
      return;
    }

    this.masterService
      .update_Speciality_data(
        id,
        SpecialityCode,
        SpecialityName,
        SpecialityShortName,
        Description,
        IsADOCExcluded
      )
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New speciality updated Successfully`, 'success');
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

  //================take list for duplication checking=====================
  get_speciality_List() {

    this.masterService.get_Speciality_List().subscribe((response: any) => {
      this.list_Speciality = response.data;
    })
  }
  
  clearSpecialityForm() {
    this.SpecialityNewForm.resetForm();
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
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    FormPopupModule,
    SpecialityNewFormModule,
    DxCheckBoxModule
  ],
  providers: [],
  exports: [],
  declarations: [SpecialityComponent],
})
export class SpecialityModule { }
