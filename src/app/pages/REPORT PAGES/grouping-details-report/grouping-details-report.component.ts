import { MasterReportService } from 'src/app/pages/MASTER PAGES/master-report.service';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxResizableModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxDateBoxModule,
  DxToolbarModule,
  DxAccordionModule,
  DxCheckBoxModule,
  DxSliderModule,
  DxTagBoxModule,
  DxTemplateModule,
  DxPopupModule,
  DxTreeViewModule,
  DxSortableModule,
  DxTabPanelModule,
  DxListModule,
  DxValidatorModule,
  DxValidationSummaryModule,
  DxTreeViewComponent,
  DxLookupComponent,
  DxDataGridComponent,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { ReportService } from 'src/app/services/Report-data.service';
import { ReportEngineService } from '../report-engine.service';
import DataSource from 'devextreme/data/data_source';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import notify from 'devextreme/ui/notify';
import { DataService } from 'src/app/services';
import CustomStore from 'devextreme/data/custom_store';
import { PopupStateService } from 'src/app/popupStateService.service';
import * as XLSX from 'xlsx';
import validationEngine from 'devextreme/ui/validation_engine';
import { OperationReportService } from '../../OPERATION PAGES/operation-report.service';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver';
import { DxoSummaryModule } from 'devextreme-angular/ui/nested';
import {
  CptMasterEditFormComponent,
  CptMasterEditFormModule,
} from '../../POP-UP_PAGES/cpt-master-edit-form/cpt-master-edit-form.component';

@Component({
  selector: 'app-grouping-details-report',
  templateUrl: './grouping-details-report.component.html',
  styleUrl: './grouping-details-report.component.scss',
  providers: [
    ReportService,
    ReportEngineService,
    DatePipe,
    DataService,
    OperationReportService,
  ],
})
export class GroupingDetailsReportComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('filterPopupdataGrid', { static: false })
  filterPopupdataGrid!: any;

  @ViewChild(DxTreeViewComponent, { static: false })
  treeView: DxTreeViewComponent;

  @ViewChild('popupGrid', { static: false }) popupGrid: any;

  @ViewChild(CptMasterEditFormComponent, { static: false })
  CptEditFormComponent!: CptMasterEditFormComponent;

  isCptEditFormPopupOpened: boolean = false;
  selectedCptCodeData: any;

  isRowPopupVisible: boolean = false;
  selectedRowData: any = {};
  popupGridData: any[] = [];
  isPopupProcessing: boolean = false;

  exportFormats = [
    { text: 'Excel', format: 'xlsx' },
    { text: 'CSV', format: 'csv' },
  ];

  billableTotal: any = 0;
  selectedRowIndex: any;
  isReRunProcessing = false;
  isLoading: boolean = false;

  //=================DataSource for data Grid Table========
  dataGrid_DataSource: DataSource<any>;
  columnsConfig: any; // Column data storing variable

  //================Variables for Storing DataSource========
  Facility_DataSource: any;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  //================Variables for Storing selected Parameters========
  Facility_Value: any = [];
  From_Date_Value: any;
  To_Date_Value: any;
  selectedmonth: any;
  selectedYear: number | null;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [10, 20, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  show_Pagination = true;

  //=====================other variables==================
  isContentVisible: boolean = true;
  hint_for_Parametr_div: any = 'Hide Parameters';
  currentPathName: any;

  minDate: Date;
  maxDate: Date;
  ColumnNames: any;
  memorise_Dropdown_DataList: any;
  isFilterOpened = false; //filter row enable-desable variable
  GridSource: any;
  isEmptyDatagrid: boolean = true;
  summaryColumnsData: any;
  columndata: any;
  isAdvancefilterOpened: boolean = false;
  filterpopupWidth: any = '70%';
  advanceFilterGridColumns: any;
  MemoriseReportName: any;
  isSaveMemorisedOpened: boolean = false;
  personalReportData: any;
  loadingVisible: boolean = false;
  isGridLoading: boolean = false;
  columnFixed: boolean = true;
  initialized: boolean;

  constructor(
    private service: ReportService,
    private router: Router,
    private reportengine: ReportEngineService,
    private datePipe: DatePipe,
    private masterService: MasterReportService,
    private popupStateService: PopupStateService,
    private cdr: ChangeDetectorRef,
    private operationService: OperationReportService,
  ) {
    // this.loadingVisible = true;

    this.minDate = new Date(2000, 1, 1);
    this.maxDate = new Date();
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2020; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
    this.get_searchParameters_Dropdown_Values();
  }

  ngOnInit(): void {
    const today = new Date();
    this.To_Date_Value = today;
    this.From_Date_Value = new Date(today.getFullYear(), today.getMonth(), 1);

    this.selectedYear = today.getFullYear();
    this.selectedmonth = today.getMonth();
  }

  //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  //============Show Parametrs Div=======================
  show_Parameter_Div = () => {
    this.isContentVisible = !this.isContentVisible;
    this.hint_for_Parametr_div = this.isContentVisible
      ? 'Hide Parameters'
      : 'Show Parameters';
  };

  //============Show Filter Row==========================
  filterClick = () => {
    if (this.dataGrid_DataSource) {
      this.isFilterOpened = !this.isFilterOpened;
    }
  };

  //============Show Filter Row==========================
  SummaryClick = () => {
    const reportGridElement = document.querySelector('.reportGrid');
    if (reportGridElement) {
      reportGridElement.classList.toggle('reportGridFooter');
    }
  };

  //================ Year value change ===================
  onYearChanged(e: any): void {
    this.selectedYear = e.value;
    const currentYear = new Date().getFullYear();
    const today = new Date();

    if (
      this.selectedmonth === '' ||
      this.selectedmonth === null ||
      this.selectedmonth === undefined
    ) {
      if (this.selectedYear === currentYear) {
        // Set from date to the start of the year and to date to today
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the current year
        this.To_Date_Value = today; // Today's date
      } else {
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1
        this.To_Date_Value = new Date(this.selectedYear, 11, 31); // December 31
      }
    } else {
      this.From_Date_Value = new Date(this.selectedYear, this.selectedmonth, 1);
      this.To_Date_Value = new Date(
        this.selectedYear,
        this.selectedmonth + 1,
        0,
      );
    }
  }

  //================Month value change ===================
  onMonthValueChanged(e: any) {
    this.selectedmonth = e.value ?? '';
    const currentYear = new Date().getFullYear();
    const today = new Date();

    if (this.selectedmonth === '') {
      if (this.selectedYear === currentYear) {
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the current year
        this.To_Date_Value = today; // Today's date
      } else {
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the selected year
        this.To_Date_Value = new Date(this.selectedYear, 11, 31); // December 31 of the selected year
      }
    } else {
      this.From_Date_Value = new Date(this.selectedYear, this.selectedmonth, 1);
      this.To_Date_Value = new Date(
        this.selectedYear,
        this.selectedmonth + 1,
        0,
      );
    }
  }

  //=====================Search on Each Column===========
  applyFilter() {
    this.GridSource.filter();
  }

  //============Get search parameters dropdown values=======
  get_searchParameters_Dropdown_Values() {
    this.loadingVisible = true;
    this.masterService.Get_Facility_List_Data().subscribe({
      next: (response: any) => {
        if (response.flag == '1') {
          this.Facility_DataSource = response.data;

          if (
            this.Facility_DataSource &&
            this.Facility_DataSource.length === 1
          ) {
            this.Facility_Value = [this.Facility_DataSource[0].FacilityLicense];
          }
        }
      },
      error: (error) => {
        console.error('Error fetching facility data:', error);
      },
      complete: () => {
        this.loadingVisible = false;
      },
    });
  }

  //=========Fetch DataSource For The Datagrid Table==========
  async get_Datagrid_DataSource() {
    const validationResult = validationEngine.validateGroup('resubValidation');

    if (!validationResult.isValid) {
      notify(
        {
          message: 'Please fill all required fields',
          position: { at: 'top right', my: 'top right' },
        },
        'warning',
        3000,
      );
      return;
    }
    const formData = {
      FacilityID: this.Facility_Value.join(','),
      DateFrom: this.reportengine.formatDate(this.From_Date_Value),
      DateTo: this.reportengine.formatDate(this.To_Date_Value),
    };
    this.isContentVisible = false;
    this.dataGrid.instance.beginCustomLoading('Loading...');
    this.isGridLoading = true;
    try {
      const response: any = await this.service
        .fetch_Grouping_Details_Data(formData)
        .toPromise();
      if (response.flag === '1') {
        this.isEmptyDatagrid = false;

        this.columndata = response.data.ReportColumns;

        const userLocale = navigator.language || 'en-US';

        this.summaryColumnsData = this.generateSummaryColumns(
          response.data.ReportColumns,
        );

        this.columnsConfig = this.generateColumnsConfig(
          response.data.ReportColumns,
          userLocale,
        );
        this.ColumnNames = this.columnsConfig
          .filter((column) => column.visible)
          .map((column) => column.caption);
        setTimeout(() => {
          this.updateVisibleColumnNames();
        }, 0);

        // Format dates in ReportData
        const formattedReportData = response.data.ReportData;

        this.dataGrid_DataSource = new DataSource<any>({
          load: () => Promise.resolve(formattedReportData),
        });
        this.dataGrid.instance.endCustomLoading();
        this.isContentVisible = false;
      } else {
        this.dataGrid.instance.endCustomLoading();
        this.isContentVisible = false;
        notify(
          {
            message: `${response.message}`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
      }
    } catch (error) {
      this.dataGrid.instance.endCustomLoading();
      this.isContentVisible = true;
      notify(
        {
          message: `An error occurred while fetching the data. Please try again later.`,
          position: { at: 'top right', my: 'top right' },
          displayTime: 3000,
        },
        'error',
      );
    } finally {
      this.isGridLoading = false;
    }
  }

  generateSummaryColumns(reportColumns) {
    const decimalColumns = reportColumns.filter(
      (col) => col.Type && col.Type.toLowerCase() === 'decimal' && col.Summary,
    );

    const intColumns = reportColumns.filter(
      (col) => col.Type && col.Type.toLowerCase() === 'int32' && col.Summary,
    );

    return {
      totalItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'decimal'),
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'count'),
        ),
      ],
      groupItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'decimal'),
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'count'),
        ),
      ],
    };
  }

  createSummaryItem(col, isGroupItem = false, summaryType = 'sum', formatType) {
    return {
      column: col.Name,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? 'Total Qty: {0} ' : 'Total: {0}',
      valueFormat:
        formatType === 'decimal'
          ? {
              style: 'decimal',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          : null,
      alignByColumn: isGroupItem, // Align by column if it's a group item
      showInGroupFooter: isGroupItem, // Show in group footer for group items
    };
  }

  generateColumnsConfig(reportColumns, userLocale) {
    return reportColumns.map((column) => {
      let columnFormat;
      const colType = column.Type ? column.Type.toLowerCase() : '';

      if (colType === 'datetime') {
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
      if (colType === 'decimal') {
        columnFormat = {
          type: 'fixedPoint',
          precision: 2,
          formatter: (value) =>
            new Intl.NumberFormat(userLocale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value),
        };
      }
      if (colType === 'percentage') {
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

  //====================Find the column location from the datagrid================
  findColumnLocation = (e: any) => {
    const columnName = e.itemData;
    if (columnName != '' && columnName != null) {
      this.reportengine.makeColumnVisible(this.dataGrid, columnName);
    }
  };

  updateVisibleColumnNames() {
    if (this.dataGrid && this.dataGrid.instance) {
      const visibleCols = this.dataGrid.instance.getVisibleColumns();
      this.ColumnNames = visibleCols
        .filter((col) => col.caption && col.dataField)
        .map((col) => col.caption);
    }
  }

  onGridOptionChanged(e: any) {
    if (e.name === 'columns' || (e.fullName && e.fullName.includes('visible'))) {
      this.updateVisibleColumnNames();
    }
  }

  //=============DataGrid Refreshing=====================
  refresh = () => {
    // this.dataGrid.instance.refresh();
    this.get_Datagrid_DataSource();
  };

  // ================Exporting Function===================
  onExporting(event: any) {
    const fileName = 'ADOC Grouping Details';
    this.service.exportDataGrid(event, fileName);
  }

  // ============== Popup functionalities ==================
  onViewClick = (e: any) => {
    this.selectedRowData = e.row.data;
    this.selectedRowIndex = e.row.rowIndex;
    console.log('selected row data', this.selectedRowData);
    this.isRowPopupVisible = true;
    this.getClinicalDataPopupData();
  };

  getClinicalDataPopupData() {
    this.popupGrid?.instance.beginCustomLoading('Loading...');

    const payload = {
      ClaimUID: this.selectedRowData?.ClaimUID || 0,
    };

    this.operationService.getClinicalDataInPopup(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.popupGridData = res.data || [];

          // Update status in the row object
          this.selectedRowData.Status = 'Applied';

          // Repaint only the affected row if it exists in current grid
          if (this.selectedRowIndex !== undefined && this.dataGrid) {
            this.dataGrid.instance.repaintRows([this.selectedRowIndex]);
          }

          this.calculateBillableTotal();

          setTimeout(() => {
            this.isRowPopupVisible = true;
            this.popupGrid?.instance.endCustomLoading();
          }, 0);
        } else {
          this.popupGridData = [];
          this.popupGrid?.instance.endCustomLoading();
          notify('No data found', 'warning', 3000);
        }
      },
      error: (err) => {
        this.popupGrid?.instance.endCustomLoading();
        console.error(err);
        notify('Error loading popup data', 'error', 3000);
      },
    });
  }

  calculateBillableTotal(): void {
    this.isLoading = true;

    this.billableTotal = (this.popupGridData || [])
      .filter((item: any) => item.Billable === true)
      .reduce(
        (total: number, item: any) => total + Number(item.BillPrice || 0),
        0,
      );

    this.isLoading = false;
  }

  billableSummaryText = () => {
    if (this.isLoading) {
      return 'Calculating...';
    }

    return `Net Billable : AED ${this.billableTotal.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  ReRunGrouper() {
    this.isReRunProcessing = true;
    const payload = {
      ClaimUID: this.selectedRowData?.ClaimUID || 0,
      IsReprocess: true,
    };
    this.operationService.get_ReProcess_ClinicalDataInPopup(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.getClinicalDataPopupData();
          notify('Grouper re-run successfully', 'success', 3000);
        }
        this.isReRunProcessing = false;
      },
      error: (err) => {
        console.error(err);
        notify('Error re-running grouper', 'error', 3000);
        this.isReRunProcessing = false;
      },
    });
  }

  onPopupHidden() {
    this.isRowPopupVisible = false;
    this.popupGridData = [];
  }

  async onExportClick(e: any) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('ADOC Report');

    await exportDataGrid({
      component: this.popupGrid.instance,
      worksheet: worksheet,

      customizeCell: ({ gridCell, excelCell }) => {
        if (
          gridCell?.rowType === 'data' &&
          gridCell.column?.caption === 'Billable'
        ) {
          excelCell.value = gridCell.data?.Billable === true ? 'Yes' : 'No';
        }
      },
    });

    // Excel Export
    if (e.itemData.format === 'xlsx') {
      const buffer = await workbook.xlsx.writeBuffer();

      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        'ADOC_Report.xlsx',
      );
    }

    // CSV Export
    if (e.itemData.format === 'csv') {
      const csvBuffer = await workbook.csv.writeBuffer();

      saveAs(
        new Blob([csvBuffer], {
          type: 'text/csv;charset=utf-8;',
        }),
        'ADOC_Report.csv',
      );
    }
  }

  // ======= cpt code and ordering clinician edit function ============
  onCellClick(e: any) {
    if (!e.column || e.rowType !== 'data') {
      return;
    }
    if (e.rowType === 'group') return;
    const dataField = e.column.dataField;
    // --- Helper to avoid repeated notify options---
    const showError = (message: string) => {
      notify(message, 'error', 3000);
    };

    if (dataField === 'CPTCode') {
      const code = e.data.CPTID;
      console.log('clicked row data', code);
      if (!code) {
        showError('CPT Code is empty');
        return;
      }
      this.masterService.selectCptMaster(code).subscribe((res: any) => {
        if (res.flag === '1' && res.data?.[0]) {
          this.selectedCptCodeData = res.data[0];
          this.isCptEditFormPopupOpened = true;
        } else {
          showError('No CPT Code data found');
        }
      });
    }
  }

  //======= Update data ==========
  onClickUpdateNewCptType = () => {
    const { ID, CPTTypeID, CPTCode, CPTName, CPTADOCMappings, IsADOCExcluded } =
      this.CptEditFormComponent.getUpdateCptMasterData();

    this.masterService
      .update_CptMaster_data(ID, CPTTypeID, CPTCode, CPTName, CPTADOCMappings, IsADOCExcluded)
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: 'Cpt Master Updated Successfully',
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );

          this.resetCptForm();
        } else {
          notify(
            {
              message: 'Your Data Not Updated',
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      });
  };

  resetCptForm() {
    this.CptEditFormComponent.clearForm();
  }
}

@NgModule({
  imports: [
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxResizableModule,
    DxDropDownBoxModule,
    FormPopupModule,
    CommonModule,
    DxFormModule,
    DxDateBoxModule,
    DxToolbarModule,
    DxAccordionModule,
    DxCheckBoxModule,
    DxSliderModule,
    DxTagBoxModule,
    DxTemplateModule,
    DxPopupModule,
    ReactiveFormsModule,
    DxTreeViewModule,
    DxSortableModule,
    DxTabPanelModule,
    DxListModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxLoadPanelModule,
    DxoSummaryModule,
    CptMasterEditFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [GroupingDetailsReportComponent],
})
export class ClaimDetailsModule {}
