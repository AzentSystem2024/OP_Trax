import {
  Component,
  ElementRef,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import notify from 'devextreme/ui/notify';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxLoadPanelModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { ReportService } from 'src/app/services/Report-data.service';
import { CommonModule } from '@angular/common';
import { FormPopupModule } from 'src/app/components';
import DataSource from 'devextreme/data/data_source';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services';
import { OperationReportService } from '../operation-report.service';
import { ClinicalDataImportFormModule } from '../../POP-UP_PAGES/clinical-data-import-form/clinical-data-import-form.component';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  CptMasterEditFormComponent,
  CptMasterEditFormModule,
} from '../../POP-UP_PAGES/cpt-master-edit-form/cpt-master-edit-form.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

import { NotificationService } from 'src/app/services/notification.service';
import { InactivityService } from 'src/app/services/inactivity.service';
import { ReportEngineService } from '../../REPORT PAGES/report-engine.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DxoSummaryModule } from 'devextreme-angular/ui/nested';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';

@Component({
  selector: 'app-clinical-data',
  templateUrl: './clinical-data.component.html',
  styleUrls: ['./clinical-data.component.scss'],
  providers: [ReportService, DataService, OperationReportService, DatePipe],
})
export class ClinicalDataComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(CptMasterEditFormComponent, { static: false })
  CptEditFormComponent!: CptMasterEditFormComponent;

  @ViewChild('popupGrid', { static: false }) popupGrid: any;

  isAddFormPopupOpened: any = false;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [10, 20, 50, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  isFilterRowVisible: boolean = false;

  addButtonOptions = {
    icon: 'import',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Import',
    onClick: () => this.openPopup(),
    elementAttr: { class: 'add-button' },
  };

  processButtonOptions = {
    icon: '',
    text: 'Process',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Process Selected',
    onClick: () => this.process_selected_Data(),
    elementAttr: { class: 'add-button' },
    disabled: true,
  };

  facilityListDataSource: any;
  selectedFacility: any[] = [];
  cptCodes: string = '';

  fromDate: any | null = null;
  toDate: any | null = null;
  today: Date = new Date();

  dataSource!: DataSource<any, any>;

  isRowPopupVisible: boolean = false;
  selectedRowData: any = {};
  isContentVisible: boolean = true;

  selectedCptCodeData: any;
  isCptEditFormPopupOpened: boolean = false;

  selectedmonth: any = '';
  selectedYear: any = null;
  minDate: Date;
  maxDate: Date;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  isLoading: boolean = false;

  popupGridData: any[] = [];
  isPopupProcessing: boolean = false;

  exportFormats = [
    { text: 'Excel', format: 'xlsx' },
    { text: 'CSV', format: 'csv' },
  ];

  billableTotal: any = 0;
  selectedRowIndex: any;
  isLookupLoading: boolean = false;
  isReRunProcessing = false;
  isMultiProcessing: boolean = false;
  processProgressMessage: string = '0/0 completed';

  constructor(
    private service: ReportService,
    private router: Router,
    private dataService: DataService,
    private operationService: OperationReportService,
    private datePipe: DatePipe,
    private masterService: MasterReportService,
    private notificationService: NotificationService,
    private inactivityService: InactivityService,
    private reportengine: ReportEngineService,
  ) {
    this.minDate = new Date(2023, 0, 1);
    this.maxDate = new Date(); // Set the maximum date
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
  }

  async ngOnInit() {
    try {
      await this.loadFacilityData();
      this.initializeDefaults();
      this.isFilterRowVisible = false;
    } catch (error) {
      console.error('Initialization error:', error);
    }
    this.onApplyFilter();
  }

  //================ Year value change ===================
  onYearChanged(e: any): void {
    if (!e.event) return; // Prevent programmatic changes from overwriting dates

    this.selectedYear = e.value;
    this.selectedmonth = '';
    const currentYear = new Date().getFullYear();
    const today = new Date();
    if (this.selectedYear === currentYear) {
      // Set from date to the start of the year and to date to today
      this.fromDate = new Date(this.selectedYear, 0, 1); // January 1 of the current year
      this.toDate = today; // Today's date
    } else {
      this.fromDate = new Date(this.selectedYear, 0, 1); // January 1
      this.toDate = new Date(this.selectedYear, 11, 31); // December 31
    }
  }

  //================Month value change ===================
  onMonthValueChanged(e: any) {
    if (!e.event) return; // Prevent programmatic changes from overwriting dates

    this.selectedmonth = e.value ?? '';

    const today = new Date();
    const currentYear = today.getFullYear();

    if (this.selectedmonth === '') {
      if (this.selectedYear === currentYear) {
        this.fromDate = new Date(currentYear, 0, 1);
        this.toDate = today;
      } else {
        this.fromDate = new Date(this.selectedYear, 0, 1);
        this.toDate = new Date(this.selectedYear, 11, 31);
      }
    } else {
      this.fromDate = new Date(this.selectedYear, this.selectedmonth, 1);
      this.toDate = new Date(this.selectedYear, this.selectedmonth + 1, 0);
    }
  }

  async loadFacilityData(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.dataService.Get_User_Facility_List_Data(),
      );
      this.facilityListDataSource = res?.data ?? [];

      if (this.facilityListDataSource?.length == 1) {
        // Auto-select first facility
        this.selectedFacility = [
          this.facilityListDataSource[0].FacilityLicense,
        ];
      }
    } catch (error) {
      console.error('Error fetching facility data:', error);
    }
  }

  initializeDefaults(): void {
    const today = new Date();
    this.selectedYear = today.getFullYear();
    this.selectedmonth = today.getMonth();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const defaultFacility = this.facilityListDataSource.find(
      (f: any) => f.ID === 16,
    );
    if (defaultFacility) {
      this.selectedFacility = [defaultFacility.FacilityLicense];
    }
  }

  // ================= load grid data by using filter values ==============
  onApplyFilter() {
    if (this.isLookupLoading) {
      return; // Prevent multiple API calls
    }

    this.isLookupLoading = true;

    const formatDate = (date: Date | null) =>
      date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;

    const payload = {
      FacilityID: Array.isArray(this.selectedFacility)
        ? this.selectedFacility.join(',')
        : '',
      DateFrom: formatDate(this.fromDate),
      DateTo: formatDate(this.toDate),
      CPTCodes: this.cptCodes || '',
    };

    this.dataSource = new DataSource<any>({
      load: async () => {
        try {
          const res: any = await firstValueFrom(
            this.operationService.getClinicalData(payload),
          );
          this.isLookupLoading = false;
          const data = res?.flag === '1' ? (res.data ?? []) : [];
          this.isContentVisible = data.length === 0;
          return data;
        } catch (err: any) {
          this.isLookupLoading = false;
          console.error('Error loading data:', err.message || err);
          throw err.message || 'Error loading data';
        }
      },
    });
  }

  // ========== process button hide and show depends row selection ========
  onSelectionChanged(e: any) {
    const selected = e.selectedRowsData.length > 0;
    const items: any = this.dataGrid.instance.option('toolbar.items');
    const processButton = items.find(
      (item: any) => item.name === 'processButton',
    );
    if (processButton) {
      processButton.options.disabled = !selected;
      this.dataGrid.instance.option('toolbar.items', items);
    }
  }

  // ============ Process selected row data ===========
  async process_selected_Data() {
    const selectedRows = this.dataGrid.instance.getSelectedRowsData();

    if (!selectedRows.length) {
      this.notificationService.showNotification(
        'Please select at least one row to process.',
        'warning',
      );
      return;
    }

    // Remove duplicate ClaimUID
    const uniqueClaimUIDs = [
      ...new Map(selectedRows.map((row) => [row.ClaimUID, row])).values(),
    ];

    const total = uniqueClaimUIDs.length;
    let completed = 0;

    this.isMultiProcessing = true;
    this.processProgressMessage = `0/${total} completed`;

    this.inactivityService.setApiInProgress(true);

    for (const row of uniqueClaimUIDs) {
      const payload = { ClaimUID: row.ClaimUID || 0 };

      try {
        const res: any = await firstValueFrom(
          this.operationService.getClinicalDataInPopup(payload),
        );
        // We only process the API, no need to show popup or change status manually
      } catch (err) {
        console.error(`Error processing ClaimUID ${row.ClaimUID}:`, err);
      }

      completed++;
      this.processProgressMessage = `${completed}/${total} completed`;
    }

    this.isMultiProcessing = false;
    this.inactivityService.setApiInProgress(false);

    this.notificationService.showNotification(
      'Processing completed successfully.',
      'success',
    );
    this.onApplyFilter(); // Refresh grid
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
      .update_CptMaster_data(
        ID,
        CPTTypeID,
        CPTCode,
        CPTName,
        CPTADOCMappings,
        IsADOCExcluded,
      )
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

  //========= Page refreshing =========
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  openPopup() {
    this.isAddFormPopupOpened = true;
  }

  CloseForm() {
    this.isAddFormPopupOpened = false;
    // this.dataGrid.instance.refresh();
  }

  //===== Export data ============
  onExporting(event: any) {
    const fileName = 'clinical_data';
    this.service.exportDataGrid(event, fileName);
  }

  displayFacility = (item: any) => {
    if (!item) return '';
    return `${item.FacilityLicense} - ${item.FacilityName}`;
  };

  onViewClick = (e: any) => {
    this.selectedRowData = e.row.data;
    this.selectedRowIndex = e.row.rowIndex;

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

          // Repaint only the affected row
          this.dataGrid.instance.repaintRows([this.selectedRowIndex]);

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

    console.log('Billable Total:', this.billableTotal);
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
    ClinicalDataImportFormModule,
    DxPopupModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
    CptMasterEditFormModule,
    DxLoadPanelModule,
    DxoSummaryModule,
    DxFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [ClinicalDataComponent],
})
export class ClinicianMajorModule {}
