import { MasterReportService } from './../../MASTER PAGES/master-report.service';
import { CommonModule, formatDate } from '@angular/common';
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
  DxLoadPanelModule,
  DxPopupModule,
  DxFormModule,
} from 'devextreme-angular';
import { SystemServicesService } from '../system-services.service';
import { ReportService } from 'src/app/services/Report-data.service';
import notify from 'devextreme/ui/notify';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';
import { of, switchMap } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-post-office-credentials',
  templateUrl: './post-office-credentials.component.html',
  styleUrls: ['./post-office-credentials.component.scss'],
  providers: [ReportService, DataService],
})
export class PostOfficeCredentialsComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  isSearchPanelVisible = false;
  postOffice_DropDownData: any;
  isRowSearchVisible: boolean = false;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.systemService.get_PostOfficeCredencial_List().subscribe({
          next: (response: any) => {
            if (response) {
              const transformedData = response.data.map((item: any) => ({
                ...item,
                LastModifiedTime: this.dataService.formatDateTime(
                  item.LastModifiedTime
                ),
              }));
              resolve(transformedData); // Resolve with the transformed data
            } else {
              resolve([]); // Resolve with an empty array if response is falsy
            }
          },
          error: (error) => reject(error.message), // Reject with the error message
        });
      }),
  });
  currentPathName: any;
  initialized: boolean;

  columns: any;

  showLoginName = false;
  showPassword = false;
  loginEditorOptions: any;
  passwordEditorOptions: any;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };

  loadingMessage: string = 'Processing...';
  loadingVisible: boolean = false;

  editPopupVisible: boolean = false;
  selectedRow: any;
  isVerified: boolean = false;

  constructor(
    private systemService: SystemServicesService,
    private service: ReportService,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
    this.get_PostOffice_DropDown();
    this.setLoginEditorOptions();
    this.setPasswordEditorOptions();
    this.dataGrid.instance.refresh();
  }

  toggleLoginNameVisibility() {
    this.showLoginName = !this.showLoginName;
    this.setLoginEditorOptions(); // refresh editor options
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.setPasswordEditorOptions(); // refresh editor options
  }

  setLoginEditorOptions() {
    this.loginEditorOptions = {
      mode: this.showLoginName ? 'text' : 'password',
      buttons: [
        {
          name: 'toggleLogin',
          location: 'after',
          options: {
            icon: this.showLoginName ? 'eyeopen' : 'eyeclose',
            stylingMode: 'text',
            onClick: () => this.toggleLoginNameVisibility(),
          },
        },
      ],
    };
  }

  setPasswordEditorOptions() {
    this.passwordEditorOptions = {
      mode: this.showPassword ? 'text' : 'password',
      buttons: [
        {
          name: 'togglePassword',
          location: 'after',
          options: {
            icon: this.showPassword ? 'eyeopen' : 'eyeclose',
            stylingMode: 'text',
            onClick: () => this.togglePasswordVisibility(),
          },
        },
      ],
    };
  }
  //=============Get Denial Type Drop dwn Data==============================
  get_PostOffice_DropDown() {
    let dropdownType = 'POSTOFFICE';
    this.systemService.Get_GropDown(dropdownType).subscribe((data: any) => {
      this.postOffice_DropDownData = data;
      this.columns = [
        {
          dataField: 'FacilityLicense',
          caption: 'Facility License',
          allowEditing: false,
          allowReordering: false,
          allowHiding: false,
        },
        {
          dataField: 'FacilityName',
          caption: 'Facility Name',
          allowEditing: false,
          allowReordering: false,
          allowHiding: false,
          width: '150',
        },
        {
          dataField: 'PostOfficeID',
          caption: 'Post Office',

          lookup: {
            dataSource: this.postOffice_DropDownData,
            displayExpr: 'DESCRIPTION',
            valueExpr: 'ID',
          },
        },
        {
          dataField: 'LoginName',
          caption: 'Login Name',
          editorOptions: {
            mode: 'password',
          },
          cellTemplate: (container: any, options: any) => {
            const maskedPassword = '*'.repeat(options.value?.length || 0);
            container.textContent = maskedPassword;
          },
        },
        {
          dataField: 'Password',
          caption: 'Password',
          editorOptions: {
            mode: 'password',
          },
          cellTemplate: (container: any, options: any) => {
            const maskedPassword = '*'.repeat(options.value?.length || 0);
            container.textContent = maskedPassword;
          },
        },
        {
          dataField: 'LastModifiedTime',
          caption: 'Last Verified Time',
          width: 'auto',
        },
        {
          caption: 'Status',
          dataField: 'IsVerified',
          allowEditing: false,
          alignment: 'center',
          cellTemplate: (container, options) => {
            const icon = document.createElement('i');
            icon.className = options.value ? 'fas fa-flag' : 'fas fa-flag';
            icon.style.color = options.value ? '#4ef748' : 'red';
            icon.title = options.value;
            icon.style.fontSize = '18px';
            icon.style.display = 'inline-block';
            icon.style.width = '100%';
            // icon.style.textAlign = 'center';
            container.appendChild(icon);
          },
        },
      ];
    });
  }

  //====== Function to verify credentials ======
  verifyCredentials(
    FacilityLicense: any,
    PostOfficeID: any,
    LoginName: any,
    Password: any
  ) {
    return this.systemService.verify_update_PostOfficeCredencial_Data(
      FacilityLicense,
      PostOfficeID,
      LoginName,
      Password
    );
  }

  // ====== Function to update credentials =======
  updateCredentials(
    FacilityID: any,
    PostOfficeID: any,
    LoginName: any,
    Password: any
  ) {
    return this.systemService.update_PostOfficeCredencial_Data(
      FacilityID,
      PostOfficeID,
      LoginName,
      Password
    );
  }

  // ======== editing start event =======
  onEditingStart(e: any) {
    // open popup with row data
    this.selectedRow = { ...e.data };
    this.showPassword = false;
    this.showLoginName = false;
    this.setLoginEditorOptions();
    this.setPasswordEditorOptions();
    this.editPopupVisible = true;

    // cancel default inline editing
    e.cancel = true;
  }

  // ====== Main verify handler =======
  onVerifyClick() {
    const { FacilityLicense, PostOfficeID, LoginName, Password } = this.selectedRow;

    this.loadingVisible = true;
    this.loadingMessage = 'Verifying...';

    this.verifyCredentials(
      FacilityLicense,
      PostOfficeID,
      LoginName,
      Password
    ).subscribe({
      next: (res: any) => {
        if (res.flag === '1' || res.flag === 1) {
          this.isVerified = true;
          notify(
            {
              message: res.message || 'Verification successful',
              position: 'top right',
            },
            'success',
            3000
          );
        } else {
          this.isVerified = false;
          notify(
            {
              message: res.message || 'Verification failed',
              position: 'top right',
            },
            'error',
            3000
          );
        }
        this.loadingVisible = false;
      },
      error: (err) => {
        this.isVerified = false;
        notify(
          { message: `Error: ${err.message}`, position: 'top right' },
          'error',
          3000
        );
        this.loadingVisible = false;
      },
    });
  }

  // ====== Main update handler =======
  onUpdateClick() {
    const { FacilityID, PostOfficeID, LoginName, Password } = this.selectedRow;

    this.loadingVisible = true;
    this.loadingMessage = 'Updating...';

    this.updateCredentials(
      FacilityID,
      PostOfficeID,
      LoginName,
      Password
    ).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          notify(
            {
              message: res.message || 'Data updated successfully',
              position: 'top right',
            },
            'success',
            3000
          );
          this.dataGrid.instance.refresh();
          this.editPopupVisible = false;
        } else {
          notify(
            { message: res.message || 'Update failed', position: 'top right' },
            'error',
            3000
          );
        }
        this.loadingVisible = false;
      },
      error: (err) => {
        notify(
          { message: `Error: ${err.message}`, position: 'top right' },
          'error',
          3000
        );
        this.loadingVisible = false;
      },
    });
  }

  // ====== Page refreshing =====
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  showSearch = () => {
    this.isRowSearchVisible = !this.isRowSearchVisible;
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Post-office-credentials';
    this.service.exportDataGrid(event, fileName);
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
    DxLoadPanelModule,
    DxPopupModule,
    DxFormModule
  ],
  providers: [],
  exports: [],
  declarations: [PostOfficeCredentialsComponent],
})
export class PostOfficeCredentialsModule {}
