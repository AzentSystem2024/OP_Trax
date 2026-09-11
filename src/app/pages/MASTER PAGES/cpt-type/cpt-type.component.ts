import { CommonModule } from '@angular/common';
import {
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxLookupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { CptTypeNewFormModule } from '../../POP-UP_PAGES/cpt-type-new-form/cpt-type-new-form.component';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { CptTypeNewFormComponent } from '../../POP-UP_PAGES/cpt-type-new-form/cpt-type-new-form.component';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
@Component({
  selector: 'app-cpt-type',
  templateUrl: './cpt-type.component.html',
  styleUrls: ['./cpt-type.component.scss'],
  providers: [ReportService, DataService],
})
export class CPTTypeComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;
  @ViewChild(CptTypeNewFormComponent, { static: false })
  CptTypeComponent: CptTypeNewFormComponent;

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
        this.masterService.get_CptType_List().subscribe({
          next: (response: any) => resolve(response.data), // Resolve with the data
          error: (error) => reject(error.message), // Reject with the error message
        });
      }),
  });

  addButtonOptions: any;

  isFilterRowVisible: boolean = false;
  currentPathName: string;
  initialized: boolean;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean; CanExport: boolean };

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
  }

  //=========================show new popup=========================
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  //=========================== cpt type validation =============

  //   checkDuplicateCptType = (params: any): Promise<boolean> => {
  //   const inputValue = params.value?.toLowerCase().trim();
  //   const originalValue = params?.data?.CptType?.toLowerCase().trim(); // existing value before edit
  //   const currentId = params.data?.ID;

  //   if (!inputValue) return Promise.resolve(true);

  //   // ✅ If the input hasn't changed, skip validation
  //   if (inputValue === originalValue) {
  //     return Promise.resolve(true);
  //   }

  //   return new Promise((resolve) => {
  //     this.masterService.get_CptType_List().subscribe({
  //       next: (res: any) => {
  //         const isDuplicate = res.data?.some((item: any) =>
  //           item.CptType?.toLowerCase().trim() === inputValue &&
  //           item.ID !== currentId // Exclude current record
  //         );
  //         resolve(!isDuplicate); // true = valid, false = duplicate
  //       },
  //       error: () => resolve(true) // Allow on error
  //     });
  //   });
  // };

  //====================Add data ================================
  onClickSaveNewCptType = () => {
    const { CptTypeValue, DescriptionValue } =
      this.CptTypeComponent.getNewCptTypeData();
    this.masterService
      .Insert_CptType_Data(CptTypeValue, DescriptionValue)
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New Cpt Type "${CptTypeValue} ${DescriptionValue}" saved Successfully`, 'success');
        } else {
          this.notificationService.showNotification(`Your Data Not Saved`, 'error');
        }
      });
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'cpt_type';

    this.service.exportDataGrid(event, fileName);
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService.Remove_CPTType_Row_Data(SelectedRow.ID).subscribe(() => {
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
    let CptType = combinedData.CptType;
    let Description = combinedData.Description;

    this.masterService
      .update_CptType_data(id, CptType, Description)
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New Cpt Type updated Successfully`, 'success');
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
    CptTypeNewFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [CPTTypeComponent],
})
export class CPTTypeModule {}
