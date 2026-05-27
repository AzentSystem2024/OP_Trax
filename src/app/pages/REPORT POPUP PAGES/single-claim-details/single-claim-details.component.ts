import { CommonModule } from '@angular/common';
import {
  Component,
  NgModule,
  Input,
  SimpleChanges,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { DataSource } from 'devextreme/common/data';
import { ReportService } from 'src/app/services/Report-data.service';
import notify from 'devextreme/ui/notify';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxLoadPanelModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { firstValueFrom } from 'rxjs';
import { ReportEngineService } from '../../REPORT PAGES/report-engine.service';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-single-claim-details',
  templateUrl: './single-claim-details.component.html',
  styleUrl: './single-claim-details.component.scss',
  providers: [ReportService],
})
export class SingleClaimDetailsComponent implements OnChanges {
  @Input() rowData: any;

  @ViewChild('detailsdatagrid', { static: false })
  detailsGrid!: DxDataGridComponent;

  ClaimColumns: any;
  ClaimDetailsDataSource: any;
  ClaimsummaryColumnsData: any;

  ActivityColumnData: any;
  originalActivityDataSource: any[] = [];
  AcitivityDataSource: any;
  AcitivitysummaryColumnsData: any;

  ActivityCostingColumnData: any;
  filteredActivityCostingDataSource: any;
  ActivityCostingDataSource: any;
  AcitivityCostingsummaryColumnsData: any;

  ExpenseColumnData: any;
  ExpenseDataSource: any;
  ExpenseSummaryColumnData: any;

  loadingVisible: boolean = false;

  objectKeys = Object.keys;

  isPopupVisible: boolean = false;
  isUpdateButtonVisible: boolean = false;

  selectedGridRows: any[] = [];
  selectedDepartment: any = null;
  reasonText: string = '';

  costingDepartments = [
    { id: 1, name: 'Finance' },
    { id: 2, name: 'Procurement' },
    { id: 3, name: 'Operations' },
  ];

  constructor(
    private service: ReportService,
    private reportengine: ReportEngineService,
    private dataservice: DataService
  ) {
    this.loadingVisible = true;
    this.fetch_Department_dropdown_data();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rowData'] && this.rowData?.ClaimUID) {
      this.loadingVisible = true;
      this.get_Datagrid_DataSource();
    }
  }

  //======= Fetch DataSource For The Datagrid Table =========
  async get_Datagrid_DataSource(): Promise<void> {
    this.loadingVisible = true;

    const formData = { ClaimUID: this.rowData.ClaimUID };
    try {
      const response: any = await firstValueFrom(
        this.service.fetch_Single_Claim_Details_Data(formData)
      );

      if (response.flag === '1') {
        const userLocale = navigator.language || 'en-US';

        this.ClaimColumns = this.generateColumnsConfig(
          response.claimdetails.ReportColumns,
          userLocale
        );
        this.ClaimsummaryColumnsData = this.generateSummaryColumns(
          response.claimdetails.ReportColumns
        );

        this.ActivityColumnData = this.generateColumnsConfig(
          response.activitydetails.ReportColumns,
          userLocale
        );
        this.AcitivitysummaryColumnsData = this.generateSummaryColumns(
          response.activitydetails.ReportColumns
        );

        this.ActivityCostingColumnData = this.generateColumnsConfig(
          response.subactivitydetails.ReportColumns,
          userLocale
        );
        this.AcitivityCostingsummaryColumnsData = this.generateSummaryColumns(
          response.subactivitydetails.ReportColumns
        );

        this.ExpenseColumnData = this.generateColumnsConfig(
          response.expensedetails.ReportColumns,
          userLocale
        );
        this.ExpenseSummaryColumnData = this.generateSummaryColumns(
          response.expensedetails.ReportColumns
        );

        this.originalActivityDataSource = response.activitydetails.ReportData;
        this.AcitivityDataSource = response.activitydetails.ReportData;
        this.ActivityCostingDataSource = response.subactivitydetails.ReportData;
        this.ExpenseDataSource = response.expensedetails.ReportData;

        this.ClaimDetailsDataSource = new DataSource<any>({
          load: () => Promise.resolve(response.claimdetails.ReportData),
        });
      } else {
        notify(
          {
            message: response.message,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    } catch (error) {
      notify(
        {
          message:
            'An error occurred while fetching the data. Please try again later.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 3000,
        },
        'error'
      );
    } finally {
      this.loadingVisible = false; // ✅ always hide
    }
  }

  // ======= Datagrid column formating ========
  generateColumnsConfig(reportColumns, userLocale) {
    return reportColumns.map((column) => {
      let columnFormat;

      if (column.Type === 'DateTime') {
        columnFormat = {
          type: 'date',
          formatter: (date) =>
            new Intl.DateTimeFormat(userLocale, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            }).format(new Date(date)),
        };
      }

      if (column.Type === 'Decimal') {
        columnFormat = {
          formatter: (value: number) => {
            if (value == null) return '';

            return new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);
          },
        };
      }

      if (column.Type === 'percentage') {
        columnFormat = {
          type: 'percent',
          precision: 2,
          formatter: (value) =>
            new Intl.NumberFormat(userLocale, {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value / 100),
        };
      }

      return {
        dataField: column.Name,
        caption: column.Title,
        visible: column.Visibility,
        type: column.Type,
        format: columnFormat,
      };
    });
  }

  // ======= Summary column formatting =========
  generateSummaryColumns(reportColumns: any) {
    const decimalColumns = reportColumns.filter(
      (col) => col.Type === 'Decimal' && col.Summary
    );

    const intColumns = reportColumns.filter(
      (col) => col.Type === 'Int32' && col.Summary
    );

    return {
      totalItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'decimal')
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'count')
        ),
      ],
      groupItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'decimal')
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'count')
        ),
      ],
    };
  }

  // =========== Custom summary item with same smart decimal logic ==========
  createSummaryItem(col, isGroupItem = false, summaryType = 'sum', formatType) {
    return {
      column: col.Name,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? 'Count: {0}' : '{0}',
      valueFormat:
        formatType === 'decimal'
          ? {
              formatter: (value) => {
                if (value == null) return '';

                const fixed = value.toFixed(3);
                const decimals = fixed.split('.')[1] || '000';

                // Decide 2 or 3 decimal places
                const decimalPlaces = decimals[2] === '0' ? 2 : 3;

                // Format number in US style, no currency, no grouping
                return new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: decimalPlaces,
                  maximumFractionDigits: decimalPlaces,
                }).format(value);
              },
            }
          : {
              formatter: (value) =>
                value != null
                  ? new Intl.NumberFormat('en-US', {
                      useGrouping: false,
                    }).format(Number(value))
                  : '',
            },
      alignByColumn: isGroupItem,
      showInGroupFooter: isGroupItem,
    };
  }
  // ============ department dropdown loading =================
  fetch_Department_dropdown_data() {
    this.dataservice.Get_GropDown('DEPARTMENT').subscribe((response: any) => {
      this.costingDepartments = response;
    });
  }
  // ========= show edit edit ========
  canEditRow = (e: any) => {
    return e.row?.data?.IsCostingProcessed === false;
  };
  // ==== editing strat event =======
  onEditingStart(e: any) {
    if (e.data.IsCostingProcessed) {
      e.cancel = true;
    }
  }
  // ========== revenue grid selection change event =========
  onRevenueRowSelected(event: any): void {
    const validRows = [];
    let hasInvalid = false;
    for (const row of event.selectedRowsData) {
      if (row.IsCostingProcessed) {
        hasInvalid = true;
      } else {
        validRows.push(row);
      }
    }
    if (hasInvalid) {
      notify(
        'One or more rows are already processed. You can’t update them.',
        'warning',
        3000
      );
      setTimeout(() => {
        event.component.selectRowsByIndexes(
          event.component
            .getVisibleRows()
            .map((row, index) => (validRows.includes(row.data) ? index : -1))
            .filter((index) => index !== -1)
        );
      });
    }
    this.selectedGridRows = validRows;
    this.isUpdateButtonVisible = validRows.length > 0;
  }
  // ========== activity details grid content ready =========
  onGridContentReady(e: any): void {
    if (
      e.component.getSelectedRowKeys().length === 0 &&
      this.AcitivityDataSource?.length > 0
    ) {
      e.component.selectRows(
        [this.AcitivityDataSource[0].ClaimActivityUID],
        true
      );
    }
  }

  // ======= main datagrid row expanding function =======
  headerDataRowExpanding(e: any): void {
    const activityId = e.selectedRowsData?.[0]?.ClaimActivityUID;

    if (activityId) {
      this.filteredActivityCostingDataSource =
        this.ActivityCostingDataSource.filter(
          (item) => item.ClaimActivityUID === activityId
        );
    } else {
      this.filteredActivityCostingDataSource = [];
    }
  }


  formatQtyWeight = (row) => {
  const value = row?.Qty_Weight;

  // show blank if value is 0, null or undefined
  if (value == null || Number(value) === 0) return '';

  // show 2 decimals for non-zero values
  return Number(value).toFixed(2);
};

  // ======= main datagrid row collapsing function =======
  // onRowCollapsing(e: any): void {
  //   // Reset to full data
  //   this.AcitivityDataSource = new DataSource<any>({
  //     load: () => Promise.resolve(this.originalActivityDataSource),
  //   });

  //   this.filteredActivityCostingDataSource = [];
  // }
  // ============= update costing department of revenue data ===========
  Update_Costing_Department(): void {
    if (this.selectedGridRows.length === 0 || !this.selectedDepartment) {
      notify(
        'Please select at least one row and fill in all fields.',
        'warning',
        2000
      );
      return;
    }

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const userID = logData.UserID;
    const sessionID = logData.SessionID;

    const data = this.selectedGridRows.map((row) => ({
      ClaimActivityUID: row.ClaimActivityUID,
      NewDepartmentID: this.selectedDepartment,
      Remarks: this.reasonText.trim(),
    }));

    const payload = {
      UserID: userID,
      SessionID: sessionID,
      data: data,
    };

    console.log('Payload to send:', payload);

    this.reportengine
      .update_Claim_Activity_Costing_Department(payload)
      .subscribe((response: any) => {
        if (response.flag == '1') {
          this.get_Datagrid_DataSource();
          this.isPopupVisible = false;
          notify(
            {
              message: response.message,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
        }
      });
  }

  onRowUpdating(e: any) {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const userID = logData.UserID;
    const sessionID = logData.SessionID;
    const row = e.oldData;
    const updated = e.newData;

    if (updated.RevenueDepartment) {
      const payload = {
        UserID: userID,
        SessionID: sessionID,
        data: [
          {
            ClaimActivityUID: row.ClaimActivityUID,
            NewDepartmentID: updated.RevenueDepartment,
            Remarks: '',
          },
        ],
      };

      console.log('Payload to send:', payload);

      // Stop default update so grid does not commit automatically
      e.cancel = true;

      this.reportengine
        .update_Claim_Activity_Costing_Department(payload)
        .subscribe((response: any) => {
          if (response.flag === '1') {
            this.get_Datagrid_DataSource();

            // Close the edit mode (hides Save/Cancel buttons)
            e.component.cancelEditData();

            notify(
              {
                message: response.message,
                position: { at: 'top right', my: 'top right' },
              },
              'success'
            );
          } else {
            // if failed, keep edit mode active
            notify(
              {
                message: response.message,
                position: { at: 'top right', my: 'top right' },
              },
              'error'
            );
          }
        });
    }

    if (updated.Qty_Weight !== undefined){
      const payload = {
        UserID: userID,
        SessionID: sessionID,
        ClaimActivityUID:row.ClaimActivityUID,
        Qty_Weight: updated.Qty_Weight
      };

      console.log('Payload to send:', payload);

      // Stop default update so grid does not commit automatically
      e.cancel = true;

      this.reportengine
        .update_Claim_Activity_Qty_Weight(payload)
        .subscribe((response: any) => {
          if (response.flag === '1') {
            this.get_Datagrid_DataSource();

            // Close the edit mode (hides Save/Cancel buttons)
            e.component.cancelEditData();

            notify(
              {
                message: response.message,
                position: { at: 'top right', my: 'top right' },
              },
              'success'
            );
          } else {
            // if failed, keep edit mode active
            notify(
              {
                message: response.message,
                position: { at: 'top right', my: 'top right' },
              },
              'error'
            );
          }
        });
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxButtonModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxTextBoxModule,
  ],
  declarations: [SingleClaimDetailsComponent],
  exports: [SingleClaimDetailsComponent],
})
export class SingleClaimDetailsModule {}
