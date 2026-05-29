import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
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
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-facility-list',
  templateUrl: './facility-list.component.html',
  styleUrls: ['./facility-list.component.scss'],
  providers: [ReportService, DataService],
})
export class FacilityListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  FacilityType_DataSource: any;
  Facilitygroup_DataSource: any;
  postOffice_DataSource: any;
  //================Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.Get_Facility_List_Data().subscribe({
          next: (response: any) => {
            if (response) {
              resolve(response.data); // Resolve with the data if response exists
            } else {
              reject('No data received'); // Handle case when no response is returned
            }
          },
          error: (error) => reject(error.message), // Reject with the error message
        });
      }),
  });
  isFilterRowVisible: boolean = false;
  currentPathName: string='';
  initialized: boolean=false;
  menuPrevilage:any;

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private dataservice: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataservice.getMenuPrevilages(fullUrl);
    });
    this.get_All_DropDown_Data();
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  get_All_DropDown_Data() {
    this.masterService
      .Get_GropDown('FACILITYTYPE')
      .subscribe((response: any) => {
        if (response) {
          this.FacilityType_DataSource = response;
        }
      });

    this.masterService
      .Get_GropDown('FACILITYGROUP')
      .subscribe((response: any) => {
        if (response) {
          this.Facilitygroup_DataSource = response;
        }
      });

    this.masterService.Get_GropDown('POSTOFFICE').subscribe((response: any) => {
      if (response) {
        this.postOffice_DataSource = response;
      }
    });
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'facility';
    this.service.exportDataGrid(event, fileName);
  }

  //===================Row Data Update==========================
  onRowUpdating(event: any) {
    const updataDate = event.newData;
    const oldData = event.oldData;
    const combinedData = { ...oldData, ...updataDate };
    let id = combinedData.ID;
    let FacilityLicense = combinedData.FacilityLicense;
    let FacilityName = combinedData.FacilityName;
    let FacilityShortName = combinedData.FacilityShortName;
    let Region = combinedData.Region;
    let FacilityTypeID = combinedData.FacilityTypeID;
    let FacilityAddress = combinedData.FacilityAddress;
    let PostOfficeID = combinedData.PostOfficeID;
    let RegionID = combinedData.RegionID;
    let EmirateID = combinedData.EmirateID;
    let ZoneID = combinedData.ZoneID;
    let TypeID = combinedData.TypeID;
    let CategoryID = combinedData.CategoryID;
    let KPI=combinedData.KPI

    this.masterService
      .update_facility_data(
        id,
        FacilityLicense,
        FacilityName,
        FacilityShortName,
        Region,
        FacilityTypeID,
        FacilityAddress,
        PostOfficeID,
        RegionID,
        EmirateID,
        ZoneID,
        TypeID,
        CategoryID,
        KPI
      )
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: `Facility updated Successfully`,
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
        event.component.cancelEditData(); // Close the popup
        this.dataGrid.instance.refresh();
      });
    event.cancel = true; // Prevent the default update operation
  }

  //====================Row Data Deleting=========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_Facility_Row_Data(SelectedRow.ID)
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
  ],
  providers: [],
  exports: [],
  declarations: [FacilityListComponent],
})
export class FacilityListModule {}
