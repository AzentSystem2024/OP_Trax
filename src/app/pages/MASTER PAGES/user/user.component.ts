import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
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
  DxPopupModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import notify from 'devextreme/ui/notify';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import {
  UserNewFormComponent,
  UserNewFormModule,
} from '../../POP-UP_PAGES/user-new-form/user-new-form.component';
import {
  UserEditFormComponent,
  UserEditFormModule,
} from '../../POP-UP_PAGES/user-edit-form/user-edit-form.component';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  providers: [MasterReportService, ReportService, DataService],
})
export class UserComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(UserNewFormComponent, { static: false })
  userNewForm: UserNewFormComponent;

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
  currentPathName: string;
  initialized: boolean;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };

  constructor(
    private service: MasterReportService,
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute
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

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onEditingRow(event): void {
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
          notify(
            {
              message: 'data saved successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
          this.dataGrid.instance.refresh();
        }
      } catch (error) {
        notify(
          {
            message: 'save operation failed',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error'
        );
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
        notify(
          {
            message: 'Delete operation successful',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'success'
        );
        this.dataGrid.instance.refresh();
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
    UserNewFormModule,
    DxPopupModule,
    UserEditFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [UserComponent],
})
export class UserModule {}
