import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  NgModule,
  OnInit,
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
  @ViewChild('validationGroup', { static: true })
  validationGroup!: DxValidationGroupComponent;
  selectedOption: string = 'Import Excel File';
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

  tabs = [
    { text: 'Claim Data', key: 'claim' },
    { text: 'Diagnosis Data', key: 'diagnosis' },
    { text: 'Activity Data', key: 'activity' },
  ];

  selectedTabIndex = 0;

  importClaimColumnMeta = [
    {
      dataField: 'FacilityID',
      caption: 'Facility ID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'InvoiceNumber',
      caption: 'Invoice Number',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ReceiverID',
      caption: 'Receiver ID',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PayerID',
      caption: 'Payer ID',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'TransactionDate',
      caption: 'Transaction Date',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'EncounterStartDate',
      caption: 'Encounter Start Date',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'EncounterEndDate',
      caption: 'Encounter End Date',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'EncounterType',
      caption: 'Encounter Type',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'StartType',
      caption: 'Start Type',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'EndType',
      caption: 'End Type',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'PatientID',
      caption: 'Patient ID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'PatientName',
      caption: 'Patient Name',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Speciality',
      caption: 'Speciality',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'SubSpeciality',
      caption: 'Sub Speciality',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'GrossAmount',
      caption: 'GrossAmount',
      IsMandatory: false,
      IsNumeric: true,
      visible: false,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'PatientShare',
      caption: 'PatientShare',
      IsMandatory: false,
      IsNumeric: true,
      visible: false,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'NetAmount',
      caption: 'NetAmount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
  ];

  importDiagnosisColumnMeta = [
    {
      dataField: 'FacilityID',
      caption: 'FacilityID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'InvoiceNumber',
      caption: 'Invoice Number',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'DiagnosisType',
      caption: 'Diagnosis Type',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'DiagnosisCode',
      caption: 'Diagnosis Code',
      IsMandatory: true,
      IsNumeric: false,
    },
  ];

  importActivityColumnMeta = [
    {
      dataField: 'FacilityID',
      caption: 'FacilityID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'InvoiceNumber',
      caption: 'Invoice Number',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ActivityNumber',
      caption: 'Activity Number',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ActivityDate',
      caption: 'Activity Date',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ActivityType',
      caption: 'Activity Type',
      visible: false,
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ActivityCode',
      caption: 'Activity Code',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'Duration',
      caption: 'Duration',
      IsMandatory: false,
      IsNumeric: true,
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
      dataField: 'Clinician',
      caption: 'Clinician',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Amount',
      caption: 'Amount',
      IsMandatory: false,
      IsNumeric: true,
      alignment: 'right',
      format: { type: 'fixedPoint', precision: 2 },
    },
  ];

  importObservationColumnMeta = [
    {
      dataField: 'FacilityID',
      caption: 'FacilityID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'InvoiceNumber',
      caption: 'Invoice Number',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ActivityNumber',
      caption: 'Activity ID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ObservationType',
      caption: 'Observation Type',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ObservationCode',
      caption: 'Observation Code',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ObservationValue',
      caption: 'Observation Value',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'ValueType',
      caption: 'Value Type',
      IsMandatory: false,
      IsNumeric: false,
    },
  ];

  columnMetaMap: { [key: string]: any[] } = {
    claim: this.importClaimColumnMeta,
    diagnosis: this.importDiagnosisColumnMeta,
    activity: this.importActivityColumnMeta,
    observation: this.importObservationColumnMeta,
  };

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

        // ✅ AUTO SELECT if only one facility
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

  formatProgress = (value: number) => {
    return `${value}% Completed`;
  };

  // ================ Called when a file is selected
  async onFileSelected(event: any, fileInput: HTMLInputElement): Promise<void> {
    this.hasError = false;
    this.importResults = [];
    this.isExcelLoading = true; // Show loader at the start

    const files = event.target.files || [];
    this.totalFiles = files.length;
    this.uploadedCount = 0;
    this.successCount = 0;
    this.alreadyImportedCount = 0;
    this.failCount = 0;

    this.selectedXmlFile = [];

    // Helper to process one XML file sequentially
    const processXmlFile = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const workbook = XLSX.read(new Uint8Array(e.target.result), {
            type: 'array',
            cellDates: true, // Important
          });

          const [sheet1, sheet2, sheet3, sheet4] = workbook.SheetNames;

          const claimRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet1], {
            raw: true,
            defval: '',
          });

          const diagnosisRows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet2],
            {
              raw: true,
              defval: '',
            },
          );

          const activityRows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet3],
            {
              raw: true,
              defval: '',
            },
          );

          const observationRows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet4],
            {
              raw: true,
              defval: '',
            },
          );

          // Format dates
          const claimFormatted = this.formatDateFields(claimRows, [
            'TransactionDate',
            'EncounterStartDate',
            'EncounterEndDate',
          ]);

          const diagnosisFormatted = this.formatDateFields(diagnosisRows, []);

          const activityFormatted = this.formatDateFields(activityRows, [
            'ActivityDate',
          ]);

          const observationFormatted = this.formatDateFields(
            observationRows,
            [],
          );

          // Validation
          this.claimDataSource = this.validateAndSort(
            claimFormatted,
            this.importClaimColumnMeta,
          );

          this.diagnosisDataSource = this.validateAndSort(
            diagnosisFormatted,
            this.importDiagnosisColumnMeta,
          );

          this.activityDataSource = this.validateAndSort(
            activityFormatted,
            this.importActivityColumnMeta,
          );

          this.observationDataSource = this.validateAndSort(
            observationFormatted,
            this.importObservationColumnMeta,
          );

          this.isExcelpopupOpened = true;

          console.log('Sheet 1:', this.claimDataSource);
          console.log('Sheet 2:', this.diagnosisDataSource);
          console.log('Sheet 3:', this.activityDataSource);
          console.log('Sheet 4:', this.observationDataSource);

          this.isExcelLoading = false;
        };
        reader.readAsDataURL(file);
      });
    };

    // Process files sequentially
    for (const file of files) {
      const fileName = file.name.toLowerCase();

      // XML import (sequential)
      if (fileName.endsWith('.xml')) {
        await processXmlFile(file); // waits for each XML upload
      }

      // Excel import
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        await this.loadInitialData();

        const reader = new FileReader();
        this.importedFileName = fileName;

        reader.onload = (e: any) => {
          const workbook = XLSX.read(new Uint8Array(e.target.result), {
            type: 'array',
          });
          const [sheet1, sheet2, sheet3, sheet4] = workbook.SheetNames;

          const claimRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet1], {
            raw: false,
          });
          const diagnosisRows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet2],
            { raw: false },
          );
          const activityRows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet3],
            { raw: false },
          );
          const observationRows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet4],
            { raw: false },
          );

          // Format dates
          const claimFormatted = this.formatDateFields(claimRows, [
            'TransactionDate',
            'EncounterStartDate',
            'EncounterEndDate',
          ]);
          const diagnosisFormatted = this.formatDateFields(diagnosisRows, []);
          const activityFormatted = this.formatDateFields(activityRows, [
            'ActivityDate',
          ]);
          const observationFormatted = this.formatDateFields(
            observationRows,
            [],
          );

          // Run validation
          this.claimDataSource = this.validateAndSort(
            claimFormatted,
            this.importClaimColumnMeta,
          );
          this.diagnosisDataSource = this.validateAndSort(
            diagnosisFormatted,
            this.importDiagnosisColumnMeta,
          );
          this.activityDataSource = this.validateAndSort(
            activityFormatted,
            this.importActivityColumnMeta,
          );
          this.observationDataSource = this.validateAndSort(
            observationFormatted,
            this.importObservationColumnMeta,
          );

          this.isExcelpopupOpened = true;

          console.log('Sheet 1:', this.claimDataSource);
          console.log('Sheet 2:', this.diagnosisDataSource);
          console.log('Sheet 3:', this.activityDataSource);
          console.log('Sheet 4:', this.observationDataSource);

          this.isExcelLoading = false; // Hide loader after Excel processing
        };

        reader.readAsArrayBuffer(file);
      }

      // Invalid file type
      else {
        notify(
          {
            message: `Invalid file type: ${file.name}`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
        this.isExcelLoading = false;
      }
    }

    // Final cleanup
    this.isExcelLoading = false;
    fileInput.value = ''; // allow reselecting same file
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
    const hasClaim = this.claimDataSource?.length > 0;
    const hasDiagnosis = this.diagnosisDataSource?.length > 0;
    const hasActivity = this.activityDataSource?.length > 0;
    const hasObservation = this.observationDataSource?.length > 0;

    if (!hasClaim && !hasDiagnosis && !hasActivity && !hasObservation) {
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

    // 🔥 Mark API as in progress (prevents inactivity logout)
    this.inactivityService.setApiInProgress(true);

    const chunkSize = 15000;
    const claimData = [...this.claimDataSource];
    const diagnosisData = [...this.diagnosisDataSource];
    const activityData = [...this.activityDataSource];
    const observationData = [...this.observationDataSource];

    const maxChunks = Math.max(
      Math.ceil(claimData.length / chunkSize),
      Math.ceil(diagnosisData.length / chunkSize),
      Math.ceil(activityData.length / chunkSize),
      Math.ceil(observationData.length / chunkSize),
    );

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
    };

    const sendChunk = (index: number) => {
      if (index >= maxChunks) {
        this.sendFinalRequest(batchNo);
        return;
      }

      const payload = {
        ...baseData,
        CLAIM_DATA: claimData.slice(index * chunkSize, (index + 1) * chunkSize),
        DIAGNOSIS_DATA: diagnosisData.slice(
          index * chunkSize,
          (index + 1) * chunkSize,
        ),
        ACTIVITY_DATA: activityData.slice(
          index * chunkSize,
          (index + 1) * chunkSize,
        ),
        OBSERVATION_DATA: observationData.slice(
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
                  position: { at: 'top right', my: 'top right' },
                },
                'error',
              );
              this.isSaving = false;
              this.isLoading = false;
              this.inactivityService.setApiInProgress(false); // 🔥 stop progress
            }
          },
          error: (err) => {
            this.handleError(err);
            this.isSaving = false;
            this.isLoading = false;
            this.inactivityService.setApiInProgress(false); // 🔥 stop progress
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
        return '.xls,.xlsx';
      default:
        return '';
    }
  }

  getDataSource(type: string): any[] {
    switch (type) {
      case 'claim':
        return this.claimDataSource;
      case 'diagnosis':
        return this.diagnosisDataSource;
      case 'activity':
        return this.activityDataSource;
      case 'observation':
        return this.observationDataSource;
      default:
        return [];
    }
  }

  getColumnMeta(tabKey: string) {
    switch (tabKey) {
      case 'claim':
        return this.importClaimColumnMeta;
      case 'diagnosis':
        return this.importDiagnosisColumnMeta;
      case 'activity':
        return this.importActivityColumnMeta;
      case 'observation':
        return this.importObservationColumnMeta;
      default:
        return [];
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

  CloseExcelForm() {
    this.clearHighlightedHeaders();
    this.isExcelpopupOpened = false;
    this.hasError = false;
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
    const key = this.tabs[this.selectedTabIndex]?.key;
    console.log(key, 'key');
    const columnMeta = this.columnMetaMap[key];
    console.log(columnMeta, 'columnmeta');
    if (!columnMeta) return;

    const column = columnMeta.find(
      (col) => col.dataField === e.column.dataField,
    );
    console.log(column, 'column');
    if (!column) return;

    const value = e.data[column.dataField];
    e.cellElement.style.color = '';
    e.cellElement.style.border = '';
    e.cellElement.setAttribute('title', '');

    if (
      column.IsMandatory &&
      (value === null || value === undefined || value === '')
    ) {
      e.cellElement.style.border = '2px solid #FFC1C3';
      e.cellElement.style.color = 'red';
      this.hasError = true;
      this.highlightColumnHeader(e.column.headerId);
      this.createTooltip(e.cellElement, `Error: This field is required`);
    }

    if (column.IsNumeric && value && isNaN(value)) {
      e.cellElement.style.border = '2px solid #FFC1C3';
      e.cellElement.style.color = 'red';
      this.hasError = true;
      this.highlightColumnHeader(e.column.headerId);
      this.createTooltip(e.cellElement, `Error: Value must be numeric`);
    }

    if (column.dataField === 'FacilityID' && value) {
      const facilityExists = this.selectedFacilityIDs.includes(value);

      if (!facilityExists) {
        e.cellElement.style.border = '2px solid #FFC1C3';
        e.cellElement.style.color = 'red';
        this.hasError = true;
        this.highlightColumnHeader(e.column.headerId);
        this.createTooltip(e.cellElement, `Error: Invalid Facility`);
      }
    }

    // if (column.dataField === 'ActivityCode' && value) {
    //   const cptCodeExists = this.cptCodeList.some(
    //     (d) =>
    //       d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
    //   );

    //   if (!cptCodeExists) {
    //     e.cellElement.style.border = '2px solid #FFC1C3';
    //     e.cellElement.style.color = 'red';
    //     this.hasError = true;
    //     this.highlightColumnHeader(e.column.headerId);
    //     this.createTooltip(e.cellElement, `Error: CPT Code Not Found`);
    //   }
    // }
    // if (column.dataField === 'OrderingClinician' && value) {
    //   const orderingClinicianExists = this.clinicianLicenseList.some(
    //     (d) =>
    //       d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
    //   );

    //   if (!orderingClinicianExists) {
    //     e.cellElement.style.border = '2px solid #FFC1C3';
    //     e.cellElement.style.color = 'red';
    //     this.hasError = true;
    //     this.highlightColumnHeader(e.column.headerId);
    //     this.createTooltip(e.cellElement, `Error: Clinician Not Found`);
    //   }
    // }
    // if (column.dataField === 'Clinician' && value) {
    //   const clinicianExists = this.clinicianLicenseList.some(
    //     (d) =>
    //       d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
    //   );

    //   if (!clinicianExists) {
    //     e.cellElement.style.border = '2px solid #FFC1C3';
    //     e.cellElement.style.color = 'red';
    //     this.hasError = true;
    //     this.highlightColumnHeader(e.column.headerId);
    //     this.createTooltip(e.cellElement, `Error: Clinician Not Found`);
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
  ],
  declarations: [ClinicalDataImportFormComponent],
  exports: [ClinicalDataImportFormComponent],
})
export class ClinicalDataImportFormModule {}
