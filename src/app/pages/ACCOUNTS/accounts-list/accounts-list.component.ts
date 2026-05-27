import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import {
  DxSelectBoxModule,
  DxTextAreaModule,
  DxDateBoxModule,
  DxFormModule,
  DxTextBoxModule,
  DxCheckBoxModule,
  DxRadioGroupModule,
  DxFileUploaderModule,
  DxDataGridModule,
  DxButtonModule,
  DxValidatorModule,
  DxProgressBarModule,
  DxPopupModule,
  DxDropDownBoxModule,
  DxToolbarModule,
  DxTabPanelModule,
  DxTabsModule,
  DxNumberBoxModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import {
  DxoItemModule,
  DxoFormItemModule,
  DxoLookupModule,
  DxiItemModule,
  DxiGroupModule,
  DxoSummaryModule,
} from 'devextreme-angular/ui/nested';
import { FormTextboxModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import { AddAccountModule } from '../add-account/add-account.component';

import notify from 'devextreme/ui/notify';
import { DataSource } from 'devextreme/common/data';
import { ReportService } from 'src/app/services/Report-data.service';

@Component({
  selector: 'app-accounts-list',
  templateUrl: './accounts-list.component.html',
  styleUrls: ['./accounts-list.component.scss'],
  providers: [DataService, ReportService],
})
export class AccountsListComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  readonly allowedPageSizes: any = [10, 20, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;

  showHeaderFilter: true;
  showFilterRow = true;
  isFilterOpened = false;
  filterRowVisible: boolean = false;
  isFilterRowVisible: boolean = false;
  addAccountPopupOpened: boolean = false;
  editAccountPopupOpened: boolean = false;

  filterButtonOptions: any = {
    icon: 'filter',
    hint: 'Show Filter Row',
    onClick: () => this.toggleFilterRow(),
    stylingMode: 'text',
    elementAttr: { class: 'commonButtons' },
  };

  addButtonOptions = {
    text: 'New',
    icon: 'bi bi-plus-circle',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Add new entry',
    onClick: () => this.addAccount(),
    elementAttr: { class: 'add-button' },
  };

  auto: string = 'auto';
  selectedAccountHead: any;

  accountsGroupList = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.dataService.getAccountGroupHeadList().subscribe({
          next: (response: any) => {
            if (response?.Data && Array.isArray(response.Data)) {
              const resultWithSno = response.Data.map(
                (item: any, index: number) => ({
                  ...item,
                  sno: index + 1,
                })
              );
              resolve(resultWithSno);
            } else {
              resolve([]); // Resolve with empty array if Data is invalid
            }
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  constructor(private dataService: DataService, 
    private reportservice:ReportService,
    private ngZone: NgZone) {}

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  //================Exporting Function=====================
  onExporting(event: any) {
    const fileName = 'ChartOfAccounts';
    this.reportservice.exportDataGrid(event, fileName);
  }

  onEditAccount(event: any) {
    event.cancel = true;
    const accHeadId = event.data.ID;
    this.dataService.selectAccountHead(accHeadId).subscribe((response: any) => {
      this.selectedAccountHead = response.Data;
      this.editAccountPopupOpened = true;
    });
  }

  addAccount() {
    this.addAccountPopupOpened = true;
  }

  onDeleteAccountHead(e: any) {
    const accHeadId = e.data.ID;
    e.cancel = true;

    // Call your delete API
    this.dataService.deleteAccountHeadlData(accHeadId).subscribe(
      (response: any) => {
        if (response) {
          notify(
            {
              message: 'Account Head Deleted Successfully',
              position: { at: 'top center', my: 'top center' },
            },
            'success'
          );
          this.refresh();
        } else {
          notify(
            {
              message: 'Your Data Not deleted',
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
        }
      },
      (error) => {
        console.error('Error deleting employee:', error);
      }
    );
  }

  handleClose() {
    this.addAccountPopupOpened = false; // closes the popup
    this.editAccountPopupOpened = false;
    this.refresh();
  }
}

@NgModule({
  imports: [
    BrowserModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxDateBoxModule,
    DxFormModule,
    DxTextBoxModule,
    FormTextboxModule,
    DxCheckBoxModule,
    DxRadioGroupModule,
    DxFileUploaderModule,
    DxDataGridModule,
    DxButtonModule,
    DxoItemModule,
    DxoFormItemModule,
    DxoLookupModule,
    DxValidatorModule,
    DxProgressBarModule,
    DxPopupModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxToolbarModule,
    DxiItemModule,
    DxoItemModule,
    DxTabPanelModule,
    DxTabsModule,
    DxiGroupModule,
    FormsModule,
    DxNumberBoxModule,
    DxoSummaryModule,
    AddAccountModule,
  ],
  providers: [],
  declarations: [AccountsListComponent],
  exports: [AccountsListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AccountsListModule {}
