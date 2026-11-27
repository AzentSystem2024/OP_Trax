import { Component, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { FacilityRegionNewFormComponent } from '../../../../pages/POP-UP_PAGES/facility-region-new-form/facility-region-new-form.component';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../../../../pages/MASTER PAGES/master-report.service';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-facility-region',
  templateUrl: './facility-region.component.html',
  styleUrls: ['./facility-region.component.scss'],
  providers: [ReportService, DataService],
})
export class FacilityRegionComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;
  @ViewChild(FacilityRegionNewFormComponent, { static: false })
  facilityRegionComponent!: FacilityRegionNewFormComponent;

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
        this.masterService.Get_Facility_Region_Data().subscribe({
          next: (response: any) => resolve(response.data),
          error: (error) => reject(error.message),
        });
      }),
  });

  addButtonOptions :any

  isFilterRowVisible: boolean = false;

  currentPathName = '';
  initialized = false;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean; CanExport: boolean } = {
    CanAdd: false,
    CanEdit: false,
    CanDelete: false,
    CanExport: false,
  };

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
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl) ?? this.menuPrevilage;
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

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  //=========================show new popup=========================
  show_new_Form = () => {
    this.isAddFormPopupOpened = true;
  };

  //====================Add data ================================
  onClickSaveNewFacilityRegion = () => {
    const { FacilityregionValue, DescriptionValue } =
      this.facilityRegionComponent.getNewFacilityRegionData();
    this.masterService
      .Insert_FacilityRegion_Data(FacilityregionValue, DescriptionValue)
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New Facility region "${FacilityregionValue} ${DescriptionValue}" saved Successfully`, 'success');
        } else {
          this.notificationService.showNotification(`Your Data Not Saved`, 'error');
        }
      });
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'facility_region';
    this.service.exportDataGrid(event, fileName);
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_FacilityRegion_Row_Data(SelectedRow.ID)
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
    let FacilityRegion = combinedData.FacilityRegion;
    let Description = combinedData.Description;

    this.masterService
      .update_facilityRegion_data(id, FacilityRegion, Description)
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification(`New Facility Region updated Successfully`, 'success');
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
