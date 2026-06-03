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
import {
  ClinicianEditFormModule,
  ClinicianEditFormComponent,
} from '../../POP-UP_PAGES/clinician-edit-form/clinician-edit-form.component';

import {
  SingleClaimDetailsComponent,
  SingleClaimDetailsModule,
} from '../../REPORT POPUP PAGES/single-claim-details/single-claim-details.component';
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

  @ViewChild(ClinicianEditFormComponent, { static: false })
  clinicianEditComponent!: ClinicianEditFormComponent;

  @ViewChild('excelFileInput') excelFileInput!: any;
  @ViewChild('popupGrid', { static: false }) popupGrid: any;

  isAddFormPopupOpened: any = false;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;
  isFilterRowVisible: boolean = false;
  userID: any;

  isProcessDisabled = true;

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
    hint: 'Import',
    onClick: () => this.process_selected_Data(),
    elementAttr: { class: 'add-button' },
    disabled: true,
  };

  updateButtonOptions = {
    icon: 'columnproperties', // this becomes: dx-icon dx-icon-update-table
    type: 'default',
    stylingMode: 'text',
    hint: 'Update Qty Weightage',
    disabled: false,
    elementAttr: { class: 'add-button' },
    onClick: () => this.onClickUpdateQtyWeight(),
  };

  toolbarEditItems: any = [
    {
      widget: 'dxButton',
      options: {
        text: 'Cancel',
        stylingMode: 'outlined',
        type: 'normal',
        onClick: () => {
          this.isEditClinicianPopupOpened = false;
        },
      },
      toolbar: 'bottom',
      location: 'after',
    },
    {
      widget: 'dxButton',
      options: {
        text: 'Save',
        type: 'default',
        stylingMode: 'contained',
        onClick: () => this.onClickUpdateNewClinician(),
      },
      toolbar: 'bottom',
      location: 'after',
    },
  ];

  popupToolbar = [
    {
      location: 'after',
      widget: 'dxButton',
      options: {
        icon: 'exportxlsx',
        hint: 'Download Excel',
        stylingMode: 'text',
      },
    },
    {
      location: 'after',
      widget: 'dxButton',
      options: {
        icon: 'upload',
        hint: 'Import File',
        stylingMode: 'text',
      },
    },
  ];

  

  facilityListDataSource: any;
  selectedFacility: any[] = [];
  searchOnDataSource = [
    { id: 'EncounterStartDate', name: 'Encounter Start Date' },
    { id: 'EncounterEndDate', name: 'Encounter End Date' },
    { id: 'TransactionDate', name: 'Transaction Date' },
  ];

  selectedSearchOn: any;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  today: Date = new Date();

  dataSource!: DataSource<any, any>;
//  dataSource: DataSource<any> | any[] = [
//   {
//     FacilityID: 'FAC001',
//     ClaimNumber: 'CLM10001',
//     ClaimActivityNumber: 'ACT5001',
//     TransactionDate: '01-06-2026',
//     PatientID: 'PAT12345',
//     EncounterType: 'Outpatient',
//     EncounterStartDate: '01-06-2026',
//     EncounterEndDate: '01-06-2026',
//     Quantity: 2.0,
//     Qty_Weight: 1.5,
//     CPTCode: 'CPT99213',
//     OrderingClinician: 'Dr. John Mathew',
//     RenderingClinician: 'Dr. Sarah Thomas',
//     Amount: 1500.75,
//     Billable: 1500.75,
//     CostingDepartment: 'Radiology',
//     ProcessStatus: 'Pending',
//     pendingReason: 'Awaiting Approval',
//   },
// ];
isRowPopupVisible: boolean = false;
selectedRowData: any = {};


  selectedCptCodeData: any;
  selectedClinicianData: any;
  isCptEditFormPopupOpened: boolean = false;
  isEditClinicianPopupOpened: boolean = false;

  selectedmonth: any = '';
  selectedYear: any = null;
  minDate: Date;
  maxDate: Date;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  isLoading: boolean = false;
  clickedCellRowData: any;
  isSingleClaimDetailsVisible: boolean = false;

  isQtyWeightUpdatePopupOpened: boolean = false;

  QtyUpdateGridData: any;

  isExcelLoading: boolean = false;

  isUpdating: boolean = false;

  FileName: any;
  popupGridData: any[] = [];
  isPopupProcessing: boolean = false;

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
  }

  //================ Year value change ===================
  onYearChanged(e: any): void {
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

  qtyWeightFormatter = (value: any) => {
    if (value === 0 || value === '0' || value == null) {
      return '';
    }
    return Number(value).toFixed(2);
  };

  // ========= show edit edit ========
  canEditRow = (e: any) => {
    return e.row?.data?.IsCostingProcessed === false;
  };

  initializeDefaults(): void {
    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), 0, 1);
    this.selectedSearchOn = 'EncounterEndDate';

    const defaultFacility = this.facilityListDataSource.find(
      (f: any) => f.ID === 16,
    );
    if (defaultFacility) {
      this.selectedFacility = [defaultFacility.FacilityLicense];
    }
  }

  // ================= load grid data by using filter values ==============
  onApplyFilter() {
    const formatDate = (date: Date | null) =>
      date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;

    const payload = {
      FacilityID: Array.isArray(this.selectedFacility)
        ? this.selectedFacility.join(',')
        : '',
      // SearchOn: this.selectedSearchOn,
      DateFrom: formatDate(this.fromDate),
      DateTo: formatDate(this.toDate),
    };

    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.operationService.getClinicalData(payload).subscribe({
            next: (res: any) => {
              if (res?.flag === '1') {
                resolve(res.data ?? []);
              } else {
                resolve([]);
              }
            },
            error: (err) => {
              console.error('Error loading data:', err.message || err);
              reject(err.message || 'Error loading data');
            },
          });
        }),
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
  process_selected_Data(): void {
    this.isLoading = true;
    const selectedRows = this.dataGrid.instance.getSelectedRowsData();

    if (!selectedRows.length) {
      this.isLoading = false; // stop loader if no selection
      this.notificationService.showNotification(
        'Please select at least one row to Allocate.',
        'warning',
      );
      return;
    }

    // 🔹 Remove duplicate ClaimUID
    const uniqueClaimUIDs = [
      ...new Map(selectedRows.map((row) => [row.ClaimUID, row])).values(),
    ];

    const payload = {
      Items: uniqueClaimUIDs.map((row) => ({
        ClaimUID: row.ClaimUID,
      })),
    };

    // Mark API as in progress to prevent inactivity logout
    this.inactivityService.setApiInProgress(true);

    this.operationService.allocate_Clinical_Data(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.flag === '1') {
          this.notificationService.showNotification(
            'Data Allocated successfully.',
            'success',
          );
          this.onApplyFilter();
        } else {
          this.notificationService.showNotification(
            res.message || 'Allocation failed. Please try again.',
            'error',
          );
        }

        // Mark API as finished
        this.inactivityService.setApiInProgress(false);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error Allocation data:', err);

        this.notificationService.showNotification(
          'An error occurred while allocating data.',
          'error',
        );

        // Mark API as finished
        this.inactivityService.setApiInProgress(false);
      },
    });
  }

  // ======= cpt code and ordering clinician edit function ============
  onCellClick(e: any) {
    // if (!e.column || e.rowType !== 'data') {
    //   return;
    // }
    // if (e.rowType === 'group') return;

    // const dataField = e.column.dataField;

    // // --- Helper to avoid repeated notify options---
    // const showError = (message: string) => {
    //   notify(message, 'error', 3000);
    // };

    // // ===== Check for Claim Number click =====
    // if (dataField === 'ClaimNumber') {
    //   this.clickedCellRowData = e.data;
    //   this.isSingleClaimDetailsVisible = true;
    //   return;
    // }

    // if (dataField === 'CPTCode') {
    //   const code = e.data?.CPTCode;

    //   if (!code) {
    //     showError('CPT Code is empty');
    //     return;
    //   }

    //   this.operationService
    //     .fetch_selected_CptCode_Data(code)
    //     .subscribe((res: any) => {
    //       if (res.flag === '1' && res.data?.[0]) {
    //         this.selectedCptCodeData = res.data[0];
    //         this.isCptEditFormPopupOpened = true;
    //       } else {
    //         showError('No CPT Code data found');
    //       }
    //     });
    // }

    // if (dataField === 'OrderingClinician') {
    //   const clinicianId = e.data?.OrderingClinician;

    //   if (!clinicianId) {
    //     showError('Ordering Clinician is empty');
    //     return;
    //   }

    //   this.operationService
    //     .fetch_selected_orderingClinician_Data(clinicianId)
    //     .subscribe((res: any) => {
    //       if (res.flag === '1' && res.data?.[0]) {
    //         this.selectedClinicianData = res.data[0];
    //         this.isEditClinicianPopupOpened = true;
    //       } else {
    //         showError('No Ordering Clinician data found');
    //       }
    //     });
    // }

    // if (dataField === 'RenderingClinician') {
    //   const clinicianId = e.data?.RenderingClinician;

    //   if (!clinicianId) {
    //     showError('Rendering Clinician is empty');
    //     return;
    //   }
    //   this.operationService
    //     .fetch_selected_orderingClinician_Data(clinicianId)
    //     .subscribe((res: any) => {
    //       if (res.flag === '1' && res.data?.[0]) {
    //         this.selectedClinicianData = res.data[0];
    //         this.isEditClinicianPopupOpened = true;
    //       } else {
    //         showError('No Rendering Clinician data found');
    //       }
    //     });
    // }

  }

  // =========== update Cpt data ===========
  onClickUpdateNewCptType = () => {
    this.CptEditFormComponent.newCptMasterData.selectedLedgerID =
      this.CptEditFormComponent.ledgerMode === 1
        ? this.CptEditFormComponent.selectedLedgerIds.join(',')
        : '';
    const {
      ID,
      CPTTypeID,
      CPTCode,
      CPTName,
      Description,
      CPTGroup,
      DepartmentID,
      CPTDepartmentID,
      CostDepartmentID,
      CostDriveID,
      FixedQuantity,
      IsDifferentCPTDepartment,
      IsDifferentLedger,
      selectedLedgerID,
      CPTEncounterDepartments,
      ADOCClassID,
      ADOCGroupID,
      data,
    } = this.CptEditFormComponent.getUpdateCptMasterData();

    this.masterService
      .update_CptMaster_data(
        ID,
        CPTTypeID,
        CPTCode,
        CPTName,
        Description,
        CPTGroup,
        DepartmentID,
        CPTDepartmentID,
        CostDepartmentID,
        CostDriveID,
        FixedQuantity,
        IsDifferentCPTDepartment,
        IsDifferentLedger,
        selectedLedgerID,
        CPTEncounterDepartments,
        ADOCClassID,
      ADOCGroupID,
        data,
      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `Cpt Master Updated Successfully`,
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );
        } else {
          notify(
            {
              message: `Your Data Not Updated`,
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      });
  };

  // =========== update oredering clinician =========
  onClickUpdateNewClinician = () => {
    const data = this.clinicianEditComponent.getnewClinicianData();
    const {
      ID,
      ClinicianLicense,
      ClinicianName,
      ClinicianShortName,
      SpecialityID,
      MajorID,
      ProfessionID,
      CategoryID,
      Gender,
      DepartmentID,
    } = this.clinicianEditComponent.getnewClinicianData() || {};

    this.masterService
      .update_Clinician_data(
        ID,
        ClinicianLicense,
        ClinicianName,
        ClinicianShortName,
        SpecialityID,
        MajorID,
        ProfessionID,
        CategoryID,
        Gender,
        DepartmentID,
      )
      .subscribe((response: any) => {
        if (response) {
          notify(
            {
              message: `Clinician updated Successfully`,
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );
          this.isEditClinicianPopupOpened = false;
          this.dataGrid.instance.refresh();
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      });
  };

  onRowUpdating(e: any) {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const userID = logData.UserID;
    const sessionID = logData.SessionID;
    const row = e.oldData;
    const updated = e.newData;

    if (updated.Qty_Weight !== undefined) {
      const payload = {
        UserID: userID,
        SessionID: sessionID,
        ClaimActivityUID: row.ClaimActivityUID,
        Qty_Weight: updated.Qty_Weight,
      };

      // Stop default update so grid does not commit automatically
      e.cancel = true;

      this.reportengine
        .update_Claim_Activity_Qty_Weight(payload)
        .subscribe((response: any) => {
          if (response.flag === '1') {
            this.dataGrid.instance.refresh();

            // Close the edit mode (hides Save/Cancel buttons)
            e.component.cancelEditData();

            notify(
              {
                message: response.message,
                position: { at: 'top right', my: 'top right' },
              },
              'success',
            );
          } else {
            // if failed, keep edit mode active
            notify(
              {
                message: response.message,
                position: { at: 'top right', my: 'top right' },
              },
              'error',
            );
          }
        });
    }
  }

  //========= Page refreshing =========
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  openPopup() {
    this.isAddFormPopupOpened = true;
  }
  onClickUpdateQtyWeight() {
    this.isQtyWeightUpdatePopupOpened = true;
  }

  downloadQtyTemplate = () => {
    // Column headers with empty values
    const headers = [
      {
        FacilityID: '',
        ClaimNumber: '',
        ActivityNumber: '',
        CPTCode: '',
        QuantityWeightage: '',
      },
    ];

    // Convert JSON → Worksheet
    const worksheet = XLSX.utils.json_to_sheet(headers);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'QtyWeightTemplate');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    // Save file
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'Qty_Weightage_Update_Template.xlsx');
  };

  openQtyUpdateImportPopup = () => {
    // const input = document.createElement('input');
    // input.type = 'file';
    // input.accept = '.xlsx,.xls';

    // input.addEventListener('change', (event: any) => {
    //   this.onExcelFileSelected(event);
    // });

    // input.click();
    this.excelFileInput.nativeElement.value = '';
    this.excelFileInput.nativeElement.click();
  };

  onExcelFileSelected = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    this.FileName = file.name;
    this.isExcelLoading = true; // 🔄 start loader

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const excelData = new Uint8Array(e.target.result);
        const workbook = XLSX.read(excelData, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        // ❌ Empty file check
        if (!jsonData.length) {
          notify('Excel file is empty', 'warning', 3000);
          return;
        }

        // ✅ Expected template columns
        const expectedColumns = [
          'FacilityID',
          'ClaimNumber',
          'ActivityNumber',
          'CPTCode',
          'QuantityWeightage',
        ];

        // ✅ Columns from uploaded Excel
        const actualColumns = Object.keys(jsonData[0]);

        // ❌ Missing columns
        const missingColumns = expectedColumns.filter(
          (col) => !actualColumns.includes(col),
        );

        // ❌ Extra columns (optional – usually better to block)
        const extraColumns = actualColumns.filter(
          (col) => !expectedColumns.includes(col),
        );

        // ❌ Validation failed
        if (missingColumns.length || extraColumns.length) {
          let message = 'Invalid Excel Template';

          if (missingColumns.length) {
            message += '\n\nMissing Columns:\n' + missingColumns.join(', ');
          }

          if (extraColumns.length) {
            message += '\n\nUnexpected Columns:\n' + extraColumns.join(', ');
          }

          notify(message, 'error', 5000);
          return;
        }

        // ❌ Column count mismatch (extra safety)
        if (actualColumns.length !== expectedColumns.length) {
          notify(
            `Invalid column count. Expected ${expectedColumns.length} but found ${actualColumns.length}`,
            'error',
            4000,
          );
          return;
        }

        // ✅ Passed validation
        this.QtyUpdateGridData = jsonData;
        this.isQtyWeightUpdatePopupOpened = true;
      } catch (err) {
        console.error(err);
        notify('Failed to read Excel file', 'error', 3000);
      } finally {
        this.isExcelLoading = false; // ✅ stop loader ALWAYS
      }
    };

    reader.readAsArrayBuffer(file);
  };

  updateImportedQtyWeightage() {
    if (!this.QtyUpdateGridData || this.QtyUpdateGridData.length === 0) {
      notify(
        {
          message: 'Please import a file before updating.',
          position: { at: 'top right', my: 'top right' },
        },
        'error',
      );
      return;
    }

    this.isUpdating = true;

    let gridData = [...this.QtyUpdateGridData];

    // 🔥 Generate unique BatchNo only ONCE
    const batchNo = (() => {
      const now = new Date();
      return 'Q' + now.toISOString().replace(/[-:.]/g, '').slice(0, 14);
    })();

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const userID = logData.UserID;

    const basePayload: any = {
      UserID: userID,
      BatchNo: batchNo,
      FileName: this.FileName, // set this when importing file
      Action: 1,
    };

    // ============= SEND ONE CHUNK =============
    const sendChunk = (chunkData: any[], index: number) => {
      const payload = {
        ...basePayload,
        data: chunkData, // UDT table data
      };

      this.operationService.Import_QtyWeight_Update(payload).subscribe({
        next: (res: any) => {
          if (res.flag === '1') {
            if (gridData.length > 0) {
              sendNextChunk(); // Continue sending other chunks
            } else {
              //  All chunks uploaded → commit final update
              this.sendQtyFinalCommit(batchNo);
            }
          } else {
            notify(
              {
                message: res.message || 'Error saving data.',
                position: { at: 'top right', my: 'top right' },
              },
              'error',
            );
            this.isUpdating = false;
          }
        },
        error: (err) => {
          notify(
            {
              message: 'Failed uploading data',
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
          console.error('Chunk error:', err);
          this.isUpdating = false;
        },
      });
    };

    // ============= SEND THE NEXT CHUNK =============
    const sendNextChunk = () => {
      const chunkSize = 15000; // safe for 1 lakh rows
      const chunk = gridData.slice(0, chunkSize);
      gridData = gridData.slice(chunkSize);

      const uploadedIndex =
        Math.ceil(this.QtyUpdateGridData.length / chunkSize) -
        Math.ceil(gridData.length / chunkSize);

      sendChunk(chunk, uploadedIndex);
    };

    // Start
    sendNextChunk();
  }

  sendQtyFinalCommit(batchNo: string) {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const userID = logData.UserID;

    const payload = {
      UserID: userID,
      BatchNo: batchNo,
      Action: 2,
    };

    this.operationService.Import_QtyWeight_Update(payload).subscribe({
      next: (res: any) => {
        this.isUpdating = false;

        if (res.flag === '1') {
          notify(
            {
              message: res.message,
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );
          this.isQtyWeightUpdatePopupOpened = false;
        } else {
          notify(
            {
              message: res.message || 'update failed.',
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      },
      error: (err) => {
        this.isUpdating = false;

        notify(
          {
            message: 'Error during update',
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
        console.error('update error:', err);
      },
    });
  }

  CloseQtyUpdatePopUp() {
    this.QtyUpdateGridData = [];
  }

  CloseForm() {
    this.isAddFormPopupOpened = false;
    this.dataGrid.instance.refresh();
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'clinical_data';
    this.service.exportDataGrid(event, fileName);
  }

  usNumberFormat = (value: number) => {
    if (value == null) return '';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  displayFacility = (item: any) => {
    if (!item) return '';
    return `${item.FacilityLicense} - ${item.FacilityName}`;
  };

getClinicalDataPopupData() {
  const payload = {
    ClaimUID: this.selectedRowData?.ClaimUID || 0
  };
  this.operationService
    .getClinicalDataInPopup(payload)
    .subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.popupGridData = res.data || [];
          this.isRowPopupVisible = true;
        } else {
          this.popupGridData = [];
          notify('No data found', 'warning', 3000);
        }
      },
      error: (err) => {
        console.error(err);
        notify('Error loading popup data', 'error', 3000);
      }
    });
}

 onViewClick(e: any) {
  console.log(e)
  this.selectedRowData = e.row.data;
  this.isRowPopupVisible = true;
  this.getClinicalDataPopupData();
}


onProcessPopupData() {
  this.isPopupProcessing = true;
  const payload = {
    ClaimUID: this.selectedRowData?.ClaimUID || 0
  };

  this.operationService
    .processClinicalDataInPopup(payload)
    .subscribe({
      next: (res: any) => {
        this.isPopupProcessing = false;
        if (res.flag === '1') {
          notify('Processed Successfully', 'success', 3000);
          // close popup if needed
          // this.isRowPopupVisible = false;

          // refresh main grid
          // this.onApplyFilter();
        } else {
          notify(res.message || 'Process Failed', 'error', 3000);
        }
      },
      error: (err) => {
        this.isPopupProcessing = false;
        console.error(err);
        notify('Error while processing', 'error', 3000);
      }
    });
}

billableText = (rowData: any) => {
  return rowData.Billable ? 'Yes' : 'No';
};

calculateBillableSummary(e: any) {
  if (e.name === 'BillableTotal') {
    if (e.summaryProcess === 'start') {
      e.totalValue = 0;
    }
    if (e.summaryProcess === 'calculate') {
      if (e.value.Billable === true) {
        e.totalValue += Number(e.value.BillPrice || 0);
      }
    }
  }
}

exportFormats = [
  { text: 'Excel', format: 'xlsx' },
  { text: 'CSV', format: 'csv' }
];

async onExportClick(e: any) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('ADOC Report');
  await exportDataGrid({
    component: this.popupGrid.instance,
    worksheet: worksheet
  });

  // Excel Export
  if (e.itemData.format === 'xlsx') {
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      'ADOC_Report.xlsx'
    );
  }

  // CSV Export
  if (e.itemData.format === 'csv') {
    const csvBuffer = await workbook.csv.writeBuffer();
    saveAs(
      new Blob([csvBuffer], {
        type: 'text/csv;charset=utf-8;'
      }),
      'ADOC_Report.csv'
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
    ClinicianEditFormModule,
    DxLoadPanelModule,
    SingleClaimDetailsModule,
    DxoSummaryModule
  ],
  providers: [],
  exports: [],
  declarations: [ClinicalDataComponent],
})
export class ClinicianMajorModule {}
