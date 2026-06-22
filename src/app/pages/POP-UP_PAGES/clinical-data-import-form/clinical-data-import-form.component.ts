import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  NgModule,
  Output,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxTextBoxModule,
  DxFormModule,
  DxValidatorModule,
  DxTextAreaModule,
  DxSelectBoxModule,
  DxRadioGroupModule,
  DxFileUploaderModule,
  DxButtonModule,
  DxPopupModule,
  DxDataGridModule,
  DxProgressBarModule,
  DxTagBoxModule,
  DxTabPanelModule,
  DxTabsModule,
  DxValidationGroupComponent,
  DxLoadPanelModule,
  DxCheckBoxModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { FormTextboxModule, FormPhotoUploaderModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import notify from 'devextreme/ui/notify';
import * as XLSX from 'xlsx';
import { OperationReportService } from '../../OPERATION PAGES/operation-report.service';
import { ReportService } from 'src/app/services/Report-data.service';
import { firstValueFrom } from 'rxjs';
import { InactivityService } from 'src/app/services/inactivity.service';

@Component({
  selector: 'app-clinical-data-import-form',
  templateUrl: './clinical-data-import-form.component.html',
  styleUrls: ['./clinical-data-import-form.component.scss'],
})

export class ClinicalDataImportFormComponent {
  @Output() closeForm = new EventEmitter();
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('importGrid', { static: false }) importGrid!: DxDataGridComponent;
  validationGroup!: DxValidationGroupComponent;

  selectedOption: string = 'Import Excel File';
  isApplygrouper: boolean = false;
  selectedXmlFile: any | null = null;
  importResults: any[] = [];
  isResponsePopupOpened: boolean = false;
  isExcelpopupOpened: boolean = false;
  totalFiles = 0;
  uploadedCount = 0;
  successCount = 0;
  alreadyImportedCount = 0;
  failCount = 0;
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  userID: any;
  facilityData: any;
  selectedFacilityIDs: any[] = [];
  claimDataSource: any[] = [];
  diagnosisDataSource: any[] = [];
  activityDataSource: any[] = [];
  observationDataSource: any[] = [];
  isLoading: boolean = false;
  isExcelLoading: boolean = false;
  hasError: boolean = false;
  isSaving: boolean = false;
  highlightedHeaderIds: string[] = [];
  importedFileName: any;
  cptCodeList: any;
  clinicianLicenseList: any;

  combinedDataSource: any[] = [];

  combinedColumnMeta: any = [
    {
      dataField: 'FacilityGroupID',
      caption: 'Facility Group ID',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'HealthAuthority',
      caption: 'Health Authority',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'FacilityID',
      caption: 'Facility ID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'Facility_Name',
      caption: 'Facility Name',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'InvoiceNo',
      caption: 'Invoice No',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'PatientID',
      caption: 'Patient ID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'TransactionDate',
      caption: 'Transaction Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ActivityStartDate',
      caption: 'Activity Start Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'EncounterType',
      caption: 'Encounter Type',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'EncounterStartDate',
      caption: 'Encounter Start Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'EncounterEndDate',
      caption: 'Encounter End Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ClaimActivityNumber',
      caption: 'Claim Activity Number',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'CPTCode',
      caption: 'CPT Code',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'CPTCategory',
      caption: 'CPT Category',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'CPTType',
      caption: 'CPT Type',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Quantity',
      caption: 'Quantity',
      IsMandatory: false,
      IsNumeric: true,
    },
    {
      dataField: 'OrderingClinician',
      caption: 'Ordering Clinician',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'OrderingClinician_Name',
      caption: 'Ordering Clinician Name',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Clinician',
      caption: 'Clinician',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Clinician_Name',
      caption: 'Clinician Name',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ReceiverID',
      caption: 'Receiver ID',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Receiver_Name',
      caption: 'Receiver Name',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PayerID',
      caption: 'Payer ID',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Payer_Name',
      caption: 'Payer Name',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'MemberID',
      caption: 'Member ID',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'IDPayer',
      caption: 'ID Payer',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PaymentReference',
      caption: 'Payment Reference',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PriorAuthorizationID',
      caption: 'Prior Authorization ID',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'NetAmt',
      caption: 'Net Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'InitialNetAmt',
      caption: 'Initial Net Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'Diagnosis',
      caption: 'Diagnosis',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PrimaryDiagnosis',
      caption: 'Primary Diagnosis',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastResubmissionDate',
      caption: 'Last Resubmission Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'FirstRemittanceDate',
      caption: 'First Remittance Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastRemittanceDate',
      caption: 'Last Remittance Date',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'RemittedAmt',
      caption: 'Remitted Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'LastRemittedAmount',
      caption: 'Last Remitted Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'InitialRejectedAmt',
      caption: 'Initial Rejected Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'RejectedAmt',
      caption: 'Rejected Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'UnprocessedAmt',
      caption: 'Unprocessed Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'RejectionPercentage',
      caption: 'Rejection Percentage',
      IsMandatory: false,
      IsNumeric: true,
    },
    {
      dataField: 'WriteOffAmt',
      caption: 'Write Off Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'WriteOffStatus',
      caption: 'Write Off Status',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'WriteOffComment',
      caption: 'Write Off Comment',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastDenailCode',
      caption: 'Last Denial Code',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'DenialComment',
      caption: 'Denial Comment',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'DenialCategory',
      caption: 'Denial Category',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'DenialType',
      caption: 'Denial Type',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'InitialDenialCode',
      caption: 'Initial Denial Code',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'InitialDenialComment',
      caption: 'Initial Denial Comment',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'InitialDenialCategory',
      caption: 'Initial Denial Category',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'InitialDenialType',
      caption: 'Initial Denial Type',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ResubmissionCount',
      caption: 'Resubmission Count',
      IsMandatory: false,
      IsNumeric: true,
    },
    {
      dataField: 'RemittanceCount',
      caption: 'Remittance Count',
      IsMandatory: false,
      IsNumeric: true,
    },
    {
      dataField: 'RemittanceComment',
      caption: 'Remittance Comment',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ResubmissionComment',
      caption: 'Resubmission Comment',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ClaimYear',
      caption: 'Claim Year',
      IsMandatory: false,
      IsNumeric: true,
    },
    {
      dataField: 'ClaimMonth',
      caption: 'Claim Month',
      IsMandatory: false,
      IsNumeric: true,
    },
    {
      dataField: 'AllSubmissionFiles',
      caption: 'All Submission Files',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'SubmissionAllTransactionIds',
      caption: 'Submission All Transaction Ids',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastSubmissionFile',
      caption: 'Last Submission File',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastSubmissionTransactionId',
      caption: 'Last Submission Transaction Id',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastRemittanceFile',
      caption: 'Last Remittance File',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'LastRemittanceTransactionId',
      caption: 'Last Remittance Transaction Id',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'SettledAmt',
      caption: 'Settled Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'ReceiptStatus',
      caption: 'Receipt Status',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'InitialDateSettlement',
      caption: 'Initial Date Settlement',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ClaimStatus',
      caption: 'Claim Status',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PaymentStatus',
      caption: 'Payment Status',
      IsMandatory: false,
      IsNumeric: false,
    },
  ];

  get progressValue() {
    return this.totalFiles > 0
      ? (this.uploadedCount / this.totalFiles) * 100
      : 0;
  }

  clinicianMajor = {
    MajorValue: '',
    DescriptionValue: '',
  };

  newclinicianMajor = this.clinicianMajor;

  constructor(
    private service: MasterReportService,
    private operationservice: OperationReportService,
    private reportservice: ReportService,
    private inactivityService: InactivityService,
  ) {
    this.userID = sessionStorage.getItem('UserID');
    this.getUserFacilityData();
  }
  // ================== Load all initial lists in parallel ==================
  async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadcptCodeList(),
        this.loadclinicianLicenseList(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  // ================== cpt code list ==================
  async loadcptCodeList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.service.Get_GropDown('CPT_CODE'),
      );
      this.cptCodeList = res ?? [];
    } catch (error) {
      console.error('Error fetching cpt code list:', error);
    }
  }

  // ================== cpt clicician list ==================
  async loadclinicianLicenseList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.service.Get_GropDown('CLINICIAN_LICENSE'),
      );
      this.clinicianLicenseList = res ?? [];
    } catch (error) {
      console.error('Error fetching clinician license list:', error);
    }
  }
  // dispaly Facility for dropdown
  displayFacility(item: any): string {
    return item ? `${item.FacilityLicense} - ${item.FacilityName}` : '';
  }

  getUserFacilityData() {
    this.service
      .Get_User_Facility_List_Data(this.userID)
      .subscribe((res: any) => {
        this.facilityData = res.data;
        // AUTO SELECT if only one facility
        if (this.facilityData?.length === 1) {
          this.selectedFacilityIDs = [this.facilityData[0].FacilityLicense];
        }
      });
  }

  getNewclinicianMajor = () => ({
    ...this.newclinicianMajor,
  });

  reset_newclinicianMajorFormData() {
    this.newclinicianMajor.MajorValue = '';
    this.newclinicianMajor.DescriptionValue = '';
  }

  showGridLoading(message: string) {
    if (this.importGrid && this.importGrid.instance) {
      this.importGrid.instance.beginCustomLoading(message);
    } else {
      setTimeout(() => {
        if (this.importGrid && this.importGrid.instance) {
          this.importGrid.instance.beginCustomLoading(message);
        }
      }, 150);
    }
  }

  hideGridLoading() {
    if (this.importGrid && this.importGrid.instance) {
      this.importGrid.instance.endCustomLoading();
    } else {
      setTimeout(() => {
        if (this.importGrid && this.importGrid.instance) {
          this.importGrid.instance.endCustomLoading();
        }
      }, 150);
    }
  }

  formatProgress = (value: number) => {
    return `${value}% Completed`;
  };

  // ================ Called when a file is selected
  async onFileSelected(event: any, fileInput: HTMLInputElement): Promise<void> {
    this.hasError = false;
    this.importResults = [];
    this.isExcelLoading = true;
    this.inactivityService.setApiInProgress(true);

    // Yield to the event loop so the loading spinner can render before heavy processing
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log(this.selectedFacilityIDs, 'selectedFacility');

    const files = event.target.files || [];
    this.totalFiles = files.length;
    this.uploadedCount = 0;
    this.successCount = 0;
    this.alreadyImportedCount = 0;
    this.failCount = 0;
    if (!files.length) {
      this.isExcelLoading = false;
      this.inactivityService.setApiInProgress(false);
      return;
    }

    const hasXml = Array.from(files).some((f: any) => f.name.toLowerCase().endsWith('.xml'));
    if (hasXml) {
      this.isResponsePopupOpened = true;
      this.showGridLoading('Importing XML...');
    }

    this.selectedXmlFile = [];

    // Helper to process one XML file sequentially
    const processXmlFile = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          const filePayload: any = {
            facilityID: this.selectedFacilityIDs.join(','),
            fileName: file.name,
            fileData: base64String,
            userID: this.userID || 1,
            IsApplyGrouper: this.isApplygrouper,
          };

          this.selectedXmlFile.push(filePayload);
          this.isResponsePopupOpened = true;

          this.service.ImportClinicalData(filePayload).subscribe({
            next: (res: any) => {
              this.uploadedCount++;
              if (res.message === 'Success') this.successCount++;
              else if (res.message === 'File already imported.')
                this.alreadyImportedCount++;
              else this.failCount++;

              if (Array.isArray(res.data)) {
                this.importResults.push(...res.data);
                console.log(this.importResults, 'import response');
              }
            },
            error: (err: any) => {
              console.error('Import error:', err);
              this.failCount++;
            },
            complete: () => resolve(),
          });
        };
        reader.readAsDataURL(file);
      });
    };

    for (const file of files) {
      const fileName = file.name.toLowerCase();

      // XML import (sequential)
      if (fileName.endsWith('.xml')) {
        await processXmlFile(file);
        continue;
      }

      // File Type Validation
      if (
        !fileName.endsWith('.xlsx') &&
        !fileName.endsWith('.xls') &&
        !fileName.endsWith('.csv')
      ) {
        notify(
          {
            message: `Invalid file type: ${file.name}. Supported types: XML, XLS, XLSX, CSV`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
        continue;
      }

      // File Size Validation (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        notify(
          {
            message: `File size exceeds 50MB limit: ${file.name}`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
        continue;
      }
      try {
        await this.loadInitialData();
        this.importedFileName = file.name;
        const rows = await new Promise<any[]>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => {
            reject(new Error('Unable to read file.'));
          };
          reader.onload = (e: any) => {
            try {
              let workbook: XLSX.WorkBook;
              // CSV
              if (fileName.endsWith('.csv')) {
                workbook = XLSX.read(e.target.result, {
                  type: 'string',
                  raw: true,
                });
              }
              // Excel
              else {
                workbook = XLSX.read(new Uint8Array(e.target.result), {
                  type: 'array',
                  cellDates: true,
                });
              }
              if (
                !workbook ||
                !workbook.SheetNames ||
                workbook.SheetNames.length === 0
              ) {
                reject(new Error('No worksheet found in the selected file.'));
                return;
              }
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const importedRows = XLSX.utils.sheet_to_json(sheet, {
                raw: true,
                defval: '',
              });
              resolve(importedRows);
            } catch (err: any) {
              reject(new Error(err?.message || 'Failed to parse file.'));
            }
          };
          if (fileName.endsWith('.csv')) {
            reader.readAsText(file);
          } else {
            reader.readAsArrayBuffer(file);
          }
        });
        // Empty File Validation
        if (!rows || rows.length === 0) {
          notify(
            {
              message: 'Selected file contains no data.',
              position: {
                at: 'top right',
                my: 'top right',
              },
            },
            'warning',
          );
          continue;
        }

        // Row Count Validation
        if (rows.length > 50000) {
          notify(
            {
              message: 'Selected file contains more than 50,000 rows.',
              position: {
                at: 'top right',
                my: 'top right',
              },
            },
            'error',
          );
          continue;
        }
        // Header Validation
        const expectedColumns = this.combinedColumnMeta.map(
          (x: any) => x.dataField,
        );
        const actualColumns = Object.keys(rows[0]);
        const missingColumns = expectedColumns.filter(
          (col: any) => !actualColumns.includes(col),
        );
        if (missingColumns.length > 0) {
          notify(
            {
              message: 'Missing Columns: ' + missingColumns.join(', '),
              position: {
                at: 'top right',
                my: 'top right',
              },
            },
            'error',
          );
          continue;
        }
        // Date Formatting
        const formattedRows = this.formatDateFields(rows, [
          'TransactionDate',
          'ActivityStartDate',
          'EncounterStartDate',
          'EncounterEndDate',
          'LastResubmissionDate',
          'FirstRemittanceDate',
          'LastRemittanceDate',
          'InitialDateSettlement',
        ]);
        // Validation
        this.combinedDataSource = this.validateAndSort(
          formattedRows,
          this.combinedColumnMeta,
        );
        if (!this.combinedDataSource || this.combinedDataSource.length === 0) {
          notify(
            {
              message: 'No valid records found.',
              position: {
                at: 'top right',
                my: 'top right',
              },
            },
            'warning',
          );
          continue;
        }
        console.log('Imported Data:', this.combinedDataSource);
        notify(
          {
            message: `${this.combinedDataSource.length.toLocaleString()} records loaded successfully.`,
            position: {
              at: 'top right',
              my: 'top right',
            },
          },
          'success',
        );
        this.isExcelpopupOpened = true;
      } catch (error: any) {
        console.error('Import Error:', error);
        notify(
          {
            message: error?.message || 'Failed to import file.',
            position: {
              at: 'top right',
              my: 'top right',
            },
          },
          'error',
        );
      }
    }
    this.isExcelLoading = false;
    this.hideGridLoading();
    this.inactivityService.setApiInProgress(false);
    fileInput.value = '';
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  getSystemDateFormat(): string {
    const testDate = new Date(2024, 0, 5); // 5 Jan 2024
    const formatted = new Intl.DateTimeFormat(undefined).format(testDate);
    // Detect separator
    const sep = formatted.includes('/')
      ? '/'
      : formatted.includes('-')
        ? '-'
        : formatted.includes('.')
          ? '.'
          : ' ';
    const parts = formatted.split(sep);
    // Figure out positions of day, month, year
    let format = parts.map((p) => {
      if (p.length === 4) return 'yyyy'; // year
      if (+p === 5) return 'dd'; // day = 5
      if (+p === 1) return 'MM'; // month = Jan
      return '??'; // fallback
    });
    return format.join(sep);
  }

  //========== Format date as dd/MM/yyyy
  formatDateFields(data: any[], dateFields: string[]): any[] {
    return data.map((row) => {
      const newRow = { ...row };
      dateFields.forEach((field) => {
        const val = newRow[field];
        if (val === null || val === undefined || val === '') {
          return;
        }
        let dateObj: Date | null = null;
        // Excel Date Object
        if (val instanceof Date) {
          dateObj = val;
        }
        // Excel Serial Number
        else if (typeof val === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          dateObj = new Date(excelEpoch.getTime() + val * 86400000);
        }
        // String Dates
        else if (typeof val === 'string') {
          const value = val.trim();
          // Try native parse first
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            dateObj = parsedDate;
          } else {
            const [datePart, timePart] = value.split(' ');
            const parts = datePart.split(/[\/\-]/);
            if (parts.length === 3) {
              let day = 0;
              let month = 0;
              let year = 0;
              // yyyy/MM/dd
              if (parts[0].length === 4) {
                year = +parts[0];
                month = +parts[1];
                day = +parts[2];
              }
              // MM/dd/yyyy
              else if (+parts[0] <= 12 && +parts[1] > 12) {
                month = +parts[0];
                day = +parts[1];
                year = +parts[2];
              }
              // dd/MM/yyyy
              else {
                day = +parts[0];
                month = +parts[1];
                year = +parts[2];
              }
              let hours = 0;
              let minutes = 0;
              let seconds = 0;
              if (timePart) {
                const timeParts = timePart.split(':');
                hours = Number(timeParts[0]) || 0;
                minutes = Number(timeParts[1]) || 0;
                seconds = Number(timeParts[2]) || 0;
              }
              dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
            }
          }
        }
        // Format Output
        if (dateObj && !isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          newRow[field] = `${year}/${month}/${day}`;
        } else {
          newRow[field] = '';
        }
      });
      return newRow;
    });
  }

  // Validate rows of imported excel
  validateAndSort(data: any[], columnMeta: any[]): any[] {
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    for (const row of data) {
      let isValid = true;
      for (const col of columnMeta) {
        let val = row[col.dataField];
        // Mandatory validation
        if (
          col.IsMandatory &&
          (val === null || val === undefined || val === '')
        ) {
          isValid = false;
          break;
        }
        // Numeric validation
        if (col.IsNumeric && val !== null && val !== undefined && val !== '') {
          // Handle comma-separated values and currency symbols
          const cleanedValue = String(val)
            .trim()
            .replace(/,/g, '')
            .replace(/[^0-9.-]/g, '');
          const numericValue = Number(cleanedValue);
          if (isNaN(numericValue)) {
            isValid = false;
            break;
          }
          // Store normalized numeric value back into row
          row[col.dataField] = numericValue;
        }
      }
      if (isValid) {
        validRows.push(row);
      } else {
        invalidRows.push(row);
      }
    }
    // Invalid rows first, valid rows after
    return [...invalidRows, ...validRows];
  }

  onStatusCellPrepared(e: any) {
    if (e.rowType === 'data' && e.column.dataField === 'Status') {
      switch ((e.value || '').toLowerCase()) {
        case 'success':
          e.cellElement.style.color = 'green';
          break;
        case 'failed':
          e.cellElement.style.color = 'red';
          break;
        case 'file already imported':
          e.cellElement.style.color = 'orange';
          break;
        default:
          e.cellElement.style.color = 'black';
      }
    }
  }

  // ============ excel data saving click ========
  onSaveClick() {
    if (!this.combinedDataSource?.length) {
      notify(
        {
          message: 'Please import your file',
          position: { at: 'top right', my: 'top right' },
        },
        'error',
      );
      return;
    }
    if (this.hasError) {
      notify(
        {
          message: 'Please fix the validation errors before saving.',
          position: { at: 'top right', my: 'top right' },
        },
        'error',
      );
      return;
    }
    this.isSaving = true;
    this.isLoading = true;
    this.inactivityService.setApiInProgress(true);
    const chunkSize = 15000;
    const importData = [...this.combinedDataSource];
    const maxChunks = Math.ceil(importData.length / chunkSize);
    const batchNo =
      this.userID +
      new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, '')
        .slice(0, 14);
    const baseData = {
      UserID: this.userID,
      FileName: this.importedFileName,
      BatchNo: batchNo,
      Action: 1,
      IsApplyGrouper: this.isApplygrouper,
    };
    const sendChunk = (index: number) => {
      if (index >= maxChunks) {
        this.sendFinalRequest(batchNo);
        return;
      }
      const payload = {
        ...baseData,
        CLAIM_DATA: importData.slice(
          index * chunkSize,
          (index + 1) * chunkSize,
        ),
      };
      this.operationservice
        .Insert_Clinical_Data_Excel_Import(payload)
        .subscribe({
          next: (res: any) => {
            if (res.flag === '1') {
              sendChunk(index + 1);
            } else {
              notify(
                {
                  message: 'Import failed.',
                  position: {
                    at: 'top right',
                    my: 'top right',
                  },
                },
                'error',
              );
              this.isSaving = false;
              this.isLoading = false;
              this.inactivityService.setApiInProgress(false);
            }
          },
          error: (err) => {
            this.handleError(err);
            this.isSaving = false;
            this.isLoading = false;
            this.inactivityService.setApiInProgress(false);
          },
        });
    };
    sendChunk(0);
  }

  // ======== New function to handle final request with consistent batchNo ======
  sendFinalRequest(batchNo: string) {
    const finalData = {
      UserID: this.userID,
      BatchNo: batchNo,
      FileName: 'test',
      Action: 2,
      CLAIM_DATA: [],
      IsApplyGrouper: this.isApplygrouper,
    };
    this.operationservice
      .Insert_Clinical_Data_Excel_Import(finalData)
      .subscribe({
        next: (res: any) => {
          if (res.flag === '1') {
            notify(
              {
                message: 'Data imported successfully.',
                position: { at: 'top right', my: 'top right' },
                displayTime: 1000,
              },
              'success',
            );
            this.close();
          } else {
            notify(
              {
                message: 'Import failed.',
                position: { at: 'top right', my: 'top right' },
                displayTime: 1000,
              },
              'error',
            );
          }
          this.isLoading = false;
          this.isSaving = false;
          this.inactivityService.setApiInProgress(false); // 🔥 stop progress
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
          this.isSaving = false;
          this.inactivityService.setApiInProgress(false); // 🔥 stop progress
        },
      });
  }

  // ============ common function for notification handler ========
  handleError(error: any) {
    if (error.status === 0) {
      notify(
        {
          message: 'Network error: Please check your internet connection.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
    } else if (error.status === 500) {
      notify(
        {
          message: 'Server error: Unable to process request. Try later.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
    } else {
      notify(
        {
          message: 'Failed to import data. Please try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
    }
    console.error('Error during data import:', error);
    this.isSaving = false;
    this.isLoading = false;
    // 🔥 Always reset API progress on error
    this.inactivityService.setApiInProgress(false);
  }

  getAcceptFileTypes(): string {
    switch (this.selectedOption) {
      case 'Import XML File':
        return '.xml';
      case 'Import Excel File':
        return '.xls,.xlsx,.csv';
      default:
        return '';
    }
  }

  format = () => {
    return `Uploaded: ${this.uploadedCount}/${this.totalFiles} | Success: ${this.successCount} | Failed: ${this.failCount} | Already Imported: ${this.alreadyImportedCount}`;
  };

  removeFile(index: number): void {
    this.selectedXmlFile.splice(index, 1);
  }

  onImport(): void {
    this.fileInputRef.nativeElement.click(); // just trigger file dialog
  }

  close() {
    this.closeForm.emit();
  }

  onXmlPopupHiding(e: any) {
    if (this.isExcelLoading) {
      e.cancel = true;
      notify(
        {
          message: 'Please wait until the file upload process is complete.',
          position: { at: 'top right', my: 'top right' },
        },
        'warning',
      );
    }
  }

  onXmlImportClose() {
    this.isResponsePopupOpened = false;
    this.importResults = [];
    this.closeForm.emit();
  }

  CloseExcelForm() {
    this.clearHighlightedHeaders();
    this.isExcelpopupOpened = false;
    this.hasError = false;
    this.closeForm.emit();
  }

  clearHighlightedHeaders() {
    this.highlightedHeaderIds.forEach((headerId) => {
      const headerCell = document.getElementById(headerId);
      if (headerCell) {
        headerCell.style.backgroundColor = ''; // Reset to default
        headerCell.style.color = ''; // Reset to default
      }
    });
    this.highlightedHeaderIds = []; // Clear the list
  }

  onCellPrepared(e: any) {
    if (e.rowType !== 'data') {
      return;
    }
    const column = this.combinedColumnMeta.find(
      (col: any) => col.dataField === e.column.dataField,
    );
    if (!column) {
      return;
    }
    const value = e.data?.[column.dataField];
    // reset styles
    e.cellElement.style.color = '';
    e.cellElement.style.border = '';
    e.cellElement.removeAttribute('title');
    // Mandatory validation
    if (
      column.IsMandatory &&
      (value === null || value === undefined || value === '')
    ) {
      e.cellElement.style.border = '2px solid #FFC1C3';
      e.cellElement.style.color = 'red';
      this.hasError = true;
      this.highlightColumnHeader(e.column?.headerId);
      this.createTooltip(e.cellElement, 'Error: This field is required');
      return;
    }
    // Numeric validation
    if (
      column.IsNumeric &&
      value !== null &&
      value !== undefined &&
      value !== '' &&
      isNaN(Number(value))
    ) {
      e.cellElement.style.border = '2px solid #FFC1C3';
      e.cellElement.style.color = 'red';
      this.hasError = true;
      this.highlightColumnHeader(e.column?.headerId);
      this.createTooltip(e.cellElement, 'Error: Value must be numeric');
      return;
    }
    // Facility validation
    if (column.dataField === 'FacilityID' && value) {
      const facilityExists = this.selectedFacilityIDs?.includes(value);
      if (!facilityExists) {
        e.cellElement.style.border = '2px solid #FFC1C3';
        e.cellElement.style.color = 'red';
        this.hasError = true;
        this.highlightColumnHeader(e.column?.headerId);
        this.createTooltip(e.cellElement, 'Error: Invalid Facility');
      }
    }
    // CPT Code validation
    // if (column.dataField === 'CPTCode' && value) {
    //   const exists = this.cptCodeList.some(
    //     (d) =>
    //       d.DESCRIPTION?.toLowerCase().trim() ===
    //       value.toLowerCase().trim()
    //   );
    //
    //   if (!exists) {
    //     e.cellElement.style.border = '2px solid #FFC1C3';
    //     e.cellElement.style.color = 'red';
    //     this.hasError = true;
    //     this.createTooltip(
    //       e.cellElement,
    //       'Error: CPT Code Not Found'
    //     );
    //   }
    // }
    // Ordering Clinician validation
    // if (column.dataField === 'OrderingClinician' && value) {
    //   const exists = this.clinicianLicenseList.some(
    //     (d) =>
    //       d.DESCRIPTION?.toLowerCase().trim() ===
    //       value.toLowerCase().trim()
    //   );
    //
    //   if (!exists) {
    //     e.cellElement.style.border = '2px solid #FFC1C3';
    //     e.cellElement.style.color = 'red';
    //     this.hasError = true;
    //     this.createTooltip(
    //       e.cellElement,
    //       'Error: Clinician Not Found'
    //     );
    //   }
    // }
    // Clinician validation
    // if (column.dataField === 'Clinician' && value) {
    //   const exists = this.clinicianLicenseList.some(
    //     (d) =>
    //       d.DESCRIPTION?.toLowerCase().trim() ===
    //       value.toLowerCase().trim()
    //   );
    //
    //   if (!exists) {
    //     e.cellElement.style.border = '2px solid #FFC1C3';
    //     e.cellElement.style.color = 'red';
    //     this.hasError = true;
    //     this.createTooltip(
    //       e.cellElement,
    //       'Error: Clinician Not Found'
    //     );
    //   }
    // }
  }

  highlightColumnHeader(headerId: string) {
    const headerCell = document.getElementById(headerId);
    if (headerCell) {
      headerCell.style.backgroundColor = '#FFC1C3';
      headerCell.style.color = '#FF0000';
      if (!this.highlightedHeaderIds.includes(headerId)) {
        this.highlightedHeaderIds.push(headerId);
      }
    }
  }

  // Helper method to create and show tooltips
  private createTooltip(cellElement: HTMLElement, message: string) {
    const tooltip = document.createElement('div');
    tooltip.innerText = message;
    tooltip.classList.add('error-tooltip');
    tooltip.style.display = 'none'; // Hide by default
    cellElement.appendChild(tooltip);
    // Show the tooltip on hover
    cellElement.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block'; // Show tooltip
    });
    cellElement.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none'; // Hide tooltip
    });
  }

  //export
  onExporting(event: any) {
    const fileName = 'Imported_xml_status';
    this.reportservice.exportDataGrid(event, fileName);
  }
}
@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    DxTextAreaModule,
    FormPhotoUploaderModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxFormModule,
    DxRadioGroupModule,
    DxFileUploaderModule,
    DxButtonModule,
    DxPopupModule,
    DxDataGridModule,
    DxProgressBarModule,
    DxTagBoxModule,
    DxTabPanelModule,
    DxTabsModule,
    DxLoadPanelModule,
    DxCheckBoxModule,
  ],
  declarations: [ClinicalDataImportFormComponent],
  exports: [ClinicalDataImportFormComponent],
})
export class ClinicalDataImportFormModule {}
