import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { ReportService } from 'src/app/services/Report-data.service';
import { SystemServicesService } from '../system-services.service';
import DataSource from 'devextreme/data/data_source';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-license-info',
  templateUrl: './license-info.component.html',
  styleUrls: ['./license-info.component.scss'],
  providers: [ReportService, DataService],
})
export class LicenseInfoComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;
  @ViewChild('fileInput', { static: false }) fileInput: any;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [25, 50, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  ProductKey: any;
  LicensedTo: any;

  Columns: any;

  isManualRefresh: boolean = false;

  DataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        const isLoading = this.isManualRefresh;
        this.systemService.list_license_info_data(isLoading).subscribe({
          next: (response: any) => {
            this.LicensedTo = response.CustomerName;
            this.ProductKey = response.ProductKey;
            response.data.forEach((item: any, index: number) => {
              item.serialNumber = index + 1;

              item.Expiry_Date = this.dataService.formatDateTime(
                item.Expiry_Date,
              );
            });

            this.isManualRefresh = false;

            resolve(response.data); // Resolve with the modified data
          },
          error: (error) => {
            this.isManualRefresh = false;
            reject(error.message);
          }, // Reject with the error message
        });
      }),
  });
  currentPathName: any;
  initialized: boolean;
  isRowSearchVisible: boolean = false;
  importButtonVisibility: any;

  constructor(
    private service: ReportService,
    private systemService: SystemServicesService,
    private dataService: DataService,
  ) {
    this.importButtonVisibility = false;
    const sessionData = localStorage.getItem('logData');
    if (sessionData) {
      try {
        const parsedData = JSON.parse(sessionData);
        this.importButtonVisibility =
          parsedData?.OfflineLicenseRenewal === true ||
          parsedData?.OfflineLicenseRenewal === 'true';
      } catch (e) {
        console.error('Error parsing logdata from localStorage', e);
      }
    }
  }

  ngOnInit(): void {
    this.update_Columns();

    this.dataGrid.instance.refresh();
  }

  update_Columns() {
    this.Columns = [
      {
        caption: 'License',
        dataField: 'FacilityLicense',
        allowEditing: false,
      },
      {
        caption: 'Name',
        dataField: 'FacilityName',
        allowEditing: false,
      },
      {
        caption: 'Region',
        dataField: 'FacilityRegion',
        allowEditing: false,
      },
      {
        caption: 'Post Office',
        dataField: 'PostOffice',
        allowEditing: false,
      },
      {
        caption: 'Expiry Date',
        dataField: 'Expiry_Date',
        dataType: 'date',
        format: 'dd-MM-yyyy',
        allowEditing: false,
      },
      {
        caption: 'Status',
        dataField: 'status',
        allowEditing: false,
        alignment: 'center',
        cellTemplate: (container: any, options: any) => {
          const icon = document.createElement('i');
          icon.className =
            options.value === 'Active' ? 'fas fa-flag' : 'fas fa-flag';
          icon.style.color = options.value === 'Active' ? '#4ef748' : 'red';
          icon.style.fontSize = '18px';
          icon.style.display = 'inline-block';
          icon.style.width = '100%';
          icon.style.textAlign = 'center';
          icon.title = options.value;
          container.appendChild(icon);
        },
      },
    ];
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'licence-info';
    this.service.exportDataGrid(event, fileName);
  }
  
  //=================== Page refreshing===========================
  refresh = () => {
    this.isManualRefresh = true;
    this.dataGrid.instance.refresh();
  };

  showSearch = () => {
    this.isRowSearchVisible = !this.isRowSearchVisible;
  };

  onImportClick = () => {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  };

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const encryptedText = e.target.result;

        const payload = {
          LicenseInfo: encryptedText,
        };

        console.log('File selected:', file.name);
        console.log('Payload created for API:', payload);

        this.systemService.importLicense(payload).subscribe({
          next: (res: any) => {
            if (res.flag === 1 || res.flag === '1') {
              notify(res.message || 'License imported successfully', 'success');
              this.refresh();
            } else {
              notify(res.message || 'Failed to import license', 'error');
            }
          },
          error: (err: any) => {
            notify('Error importing license', 'error');
            console.error('Error importing license', err);
          },
        });
      };
      reader.readAsText(file);

      // Reset the file input so the same file can be imported again if needed
      event.target.value = null;
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
  ],
  providers: [],
  exports: [],
  declarations: [LicenseInfoComponent],
})
export class LicenseInfoModule {}
