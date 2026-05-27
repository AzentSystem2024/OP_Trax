import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NgZone,
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
import { DataSource } from 'devextreme/common/data';
import { FormTextboxModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { NewLedgerGroupPopupModule } from '../new-ledger-group-popup/ledger-group-popup.component';

@Component({
  selector: 'app-ledger-group',
  templateUrl: './ledger-group.component.html',
  styleUrl: './ledger-group.component.scss',
})
export class LedgerGroupComponent {
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
  selectedRowData: any;

  ledgerGroupData = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.dataService.get_Ledger_Group_List().subscribe({
          next: (response: any) => {
            if (response?.data && Array.isArray(response.data)) {
              const resultWithSno = response.data;
              resolve(resultWithSno);
            } else {
              resolve([]);
            }
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  constructor(private dataService: DataService, private ngZone: NgZone) {}

  // ======== filter row show and hide =========
  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };
  // ============= on edit click ==============
  onEditAccount(event: any) {
    event.cancel = true;
    const Id = event.data.ID;

    this.dataService.select_Ledger_Group(Id).subscribe({
      next: (response: any) => {
        if (response && response) {
          this.selectedRowData = response;
          this.editAccountPopupOpened = true;
        } else {
          notify('No ledger group details found for this ID.', 'warning', 3000);
        }
      },
      error: (err) => {
        console.error('Error fetching account details:', err);
        notify(
          'Failed to load ledger group details. Please try again later.',
          'error',
          3000
        );
      },
    });
  }

  // ============ add button clicked ==========
  addAccount() {
    this.addAccountPopupOpened = true;
  }
  // ======= delete data from the list ========
  onDeleteAccountHead(e: any) {
    const Id = e.data.ID;
    e.cancel = true;

    // Call your delete API
    this.dataService.delete_Ledger_Group(Id).subscribe(
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
  //========= closepopup event ==========
  handleClose() {
    this.addAccountPopupOpened = false; // closes the popup
    this.editAccountPopupOpened = false;
    this.refresh();
  }

  // =========== refresh button click ========
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
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
    NewLedgerGroupPopupModule,
  ],
  providers: [],
  declarations: [LedgerGroupComponent],
  exports: [LedgerGroupComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LedgerGroupModule {}
