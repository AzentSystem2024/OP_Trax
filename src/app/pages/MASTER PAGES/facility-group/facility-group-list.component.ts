import { Message } from 'src/app/types/messages';
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
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import notify from 'devextreme/ui/notify';
import {
  FacilityGroupNewFormComponent,
  FacilityGroupNewFormModule,
} from '../../POP-UP_PAGES/facility-group-new-form/facility-group-new-form.component';
import { FormPopupModule } from 'src/app/components';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-facility-group-list',
  templateUrl: './facility-group-list.component.html',
  styleUrls: ['./facility-group-list.component.scss'],
  providers: [DataService, ReportService],
})
export class FacilityGroupListComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;
  @ViewChild(FacilityGroupNewFormComponent, { static: false })
  facilityGroupComponent: FacilityGroupNewFormComponent;

  isAddFormPopupOpened: any = false;

  FacilityLevelDatasource: any;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.Get_Facility_Group_Data().subscribe({
          next: (response: any) => resolve(response.data),
          error: (error) => reject(error.message),
        });
      }),
  });
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };
  addButtonOptions: any;

  isFilterRowVisible: boolean = false;
  currentPathName: string;
  initialized: boolean;
  GroupNameCaption: string;

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private dataservice: DataService,
    private route: ActivatedRoute
  ) {
    this.get_FacilityGroup_DropDown();
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataservice.getMenuPrevilages(fullUrl);
    });
    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.show_new_FacilityGroup_Form(),
      elementAttr: { class: 'add-button' },
    };
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };
  //=============Showing the new Facility Form===================
  show_new_FacilityGroup_Form() {
    this.isAddFormPopupOpened = true;
  }
  //====================get Facility group category dropdown ==============
  get_FacilityGroup_DropDown() {
    this.masterService
      .Get_GropDown('FACILITY_GROUP_CATEGORY')
      .subscribe((response: any) => {
        this.FacilityLevelDatasource = response;
      });
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'facility_group';
    this.service.exportDataGrid(event, fileName);
  }
  //====================Add data ================================
  onClickSaveNewFacilityGroup = () => {
    const { FacilityGroupValue, FacilityCategoryValue, DescriptionValue } =
      this.facilityGroupComponent.getNewFacilityGroupData();
    this.masterService
      .Insert_FacilityGroup_Data(
        FacilityGroupValue,
        FacilityCategoryValue,
        DescriptionValue
      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: `New Facility Group "${FacilityGroupValue} ${DescriptionValue}" saved Successfully`,
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
  };

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_Facility_Group_Data(SelectedRow.ID)
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
    let facilityGroup = combinedData.FacilityGroup;
    let FacilityCategoryValue = combinedData.FacilityCategoryValue;
    let Description = combinedData.Description;

    this.masterService
      .update_facilityGroup_data(
        id,
        facilityGroup,
        FacilityCategoryValue,
        Description
      )
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: `New Facility Group updated Successfully`,
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
    FacilityGroupNewFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [FacilityGroupListComponent],
})
export class FacilityGroupListModule {}
