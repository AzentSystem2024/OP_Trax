import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../../../../pages/MASTER PAGES/master-report.service';
import {
  UserNewFormComponent,
} from '../../../../pages/POP-UP_PAGES/user-new-form/user-new-form.component';
import {
  UserEditFormComponent,
} from '../../../../pages/POP-UP_PAGES/user-edit-form/user-edit-form.component';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  providers: [MasterReportService, ReportService, DataService],
})
export class UserComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(UserNewFormComponent, { static: false })
  userNewForm!: UserNewFormComponent;

  popupwidth: any = '65%';

  isAddFormPopupOpened: boolean = false;
  isEditPopupOpened: boolean = false;
  selectedRowData: any;
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.get_User_data().subscribe({
          next: (data: any) => {
            resolve(data);
          },
          error: (error) => reject(error.message),
        });
      }),
  });
  addButtonOptions: any;

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
    private service: MasterReportService,
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
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

  onEditingRow(event: any): void {
    event.cancel = true;
    const Id = event.data.UserID;
    this.isEditPopupOpened = true;
    this.service.get_User_Data_By_Id(Id).subscribe((res) => {
      this.selectedRowData = res;
      this.cdr.detectChanges(); // Ensure Angular picks up the change
    });
  }

  canShowDelete = (e: any): boolean => {
  return (
    this.menuPrevilage.CanDelete &&
    e.row?.data?.UserRoleName !== 'Administrator'
    );
  };
  
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  onClickSaveNewData() {
    const data = this.userNewForm.getNewUserData();
    console.log(data, 'PAYLOAD IN SAVE');
    this.service.insert_User_Data(data).subscribe((res: any) => {
      try {
        if (res.message === 'Success') {
          this.notificationService.showNotification('data saved successfully', 'success');
          this.dataGrid.instance.refresh();
        }
      } catch (error) {
        this.notificationService.showNotification('save operation failed', 'error');
      }
    });
  }

  onClearData() {
    this.userNewForm.removeImage();
    this.userNewForm.clearData();
  }

  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.service.remove_User_Data(SelectedRow.UserID).subscribe(() => {
      try {
        this.notificationService.showNotification('Delete operation successful', 'success');
        this.dataGrid.instance.refresh();
      } catch (error) {
        this.notificationService.showNotification('Delete operation failed', 'error');
      }
      event.component.refresh();
      this.dataGrid.instance.refresh();
    });
  }
  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'user';
    this.reportService.exportDataGrid(event, fileName);
  }

  CloseEditForm() {
    this.isEditPopupOpened = false;
    // this.getUSerData();
    this.dataGrid.instance.refresh();
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
