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
  isApplygrouper: boolean = true;
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
  isValidationTriggered: boolean = false;
  isSaving: boolean = false;
  highlightedHeaderIds: string[] = [];
  errorColumnDataFields: string[] = [];
  importedFileName: any;
  cptCodeList: any;
  clinicianLicenseList: any;

  combinedDataSource: any[] = [];
  filteredDataSource: any[] = [];
  showInvalidRowsOnly: boolean = false;

  onShowInvalidRowsOnlyChange(e: any) {
    this.showInvalidRowsOnly = !!e?.value;
    this.updateFilteredDataSource();
  }

  updateFilteredDataSource() {
    if (this.showInvalidRowsOnly) {
      this.filteredDataSource = (this.combinedDataSource || []).filter(
        (row) => row.__hasError,
      );
    } else {
      this.filteredDataSource = [...(this.combinedDataSource || [])];
    }
  }

  isValidDDMMYYYY(val: any): boolean {
    if (val === null || val === undefined || String(val).trim() === '') {
      return true;
    }
    if (val instanceof Date) {
      return !isNaN(val.getTime());
    }
    const str = String(val).trim();
    const match = str.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
    );
    if (!match) {
      return false;
    }
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      year < 1900 ||
      year > 2100
    ) {
      return false;
    }
    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      return false;
    }
    return true;
  }

  combinedColumnMeta: any[] = [];

  get progressValue() {
    return this.uploadedCount;
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
    this.loadColumnMetadata();
  }

  // ================== Load column metadata from API ==================
  async loadColumnMetadata(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.operationservice.GetClinicalDataImportColumns(),
      );
      const rawData = res?.DATA || res?.data || res?.datas || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        this.combinedColumnMeta = this.mapColumnMetadata(rawData);
      }
    } catch (error) {
      console.error('Error fetching clinical data import columns:', error);
    }
  }

  mapColumnMetadata(apiColumns: any[]): any[] {
    return apiColumns.map((col: any) => {
      const rules: any[] = [];
      if (col.IsMandatory) {
        rules.push({ type: 'required' });
      }
      const rawMax = col.MaxLength ?? col.maxLength ?? col.validationRules;
      const maxLen = Number(rawMax);
      if (!isNaN(maxLen) && maxLen > 0) {
        rules.push({ type: 'stringLength', max: maxLen });
      }

      let dataType = col.dataType || 'string';
      let format: any = undefined;

      if (col.dataType === 'decimal') {
        dataType = 'number';
        format = { type: 'fixedPoint', precision: 2 };
      } else if (col.dataType === 'date') {
        dataType = 'string';
        format = undefined;
      }

      return {
        dataField: col.dataField,
        caption: col.caption,
        dataType: dataType,
        format: format,
        validationRules: rules,
        MaxLength: !isNaN(maxLen) && maxLen > 0 ? maxLen : null,
        IsMandatory: !!col.IsMandatory,
        IsNumeric:
          !!col.IsNumeric ||
          col.dataType === 'number' ||
          col.dataType === 'decimal',
        originalDataType: col.dataType,
        rawValidationRules: rawMax,
      };
    });
  }

  // ================== Load all initial lists in parallel ==================
  async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadColumnMetadata(),
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

  formatProgress = (ratio: number, value: number) => {
    const pending = this.totalFiles - value;
    return `${Math.round(ratio * 100)}% (${value}/${this.totalFiles} Completed, ${pending} Pending)`;
  };

  // ================ Called when a file is selected
  async onFileSelected(event: any, fileInput: HTMLInputElement): Promise<void> {
    this.hasError = false;
    this.isValidationTriggered = false;
    this.showInvalidRowsOnly = false;
    this.importResults = [];
    this.isExcelLoading = true;
    this.inactivityService.setApiInProgress(true);

    // Yield to the event loop so the loading spinner can render before heavy processing
    await new Promise((resolve) => setTimeout(resolve, 50));

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

    const hasXml = Array.from(files).some((f: any) =>
      f.name.toLowerCase().endsWith('.xml'),
    );
    if (hasXml) {
      this.isResponsePopupOpened = true;
      this.showGridLoading('Importing XML...');
    }

    this.selectedXmlFile = [];

    // Helper to process one XML file sequentially
    const processXmlFile = (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read file.'));
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
              reject(err);
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
        try {
          await processXmlFile(file);
        } catch (err: any) {
          notify(
            {
              message:
                err?.message ||
                'Network error occurred during import. Process stopped.',
              position: { at: 'top right', my: 'top right' },
              displayTime: 5000,
            },
            'error',
          );
          this.isResponsePopupOpened = false;
          break;
        }
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
                  raw: false,
                });
              }
              // Excel
              else {
                workbook = XLSX.read(new Uint8Array(e.target.result), {
                  type: 'array',
                  cellDates: false,
                  raw: false,
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
                raw: false,
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
        // Trim headers (keys) and cell values
        const cleanedRows = rows.map((row: any) => {
          const cleanedRow: any = {};
          for (const key of Object.keys(row)) {
            const trimmedKey = typeof key === 'string' ? key.trim() : key;
            const val = row[key];
            cleanedRow[trimmedKey] = typeof val === 'string' ? val.trim() : val;
          }
          return cleanedRow;
        });

        // Header Validation
        const expectedColumns = this.combinedColumnMeta.map(
          (x: any) => (typeof x.dataField === 'string' ? x.dataField.trim() : x.dataField),
        );
        const actualColumns = Object.keys(cleanedRows[0] || {}).map(
          (col: any) => (typeof col === 'string' ? col.trim() : col),
        );
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
        const dateFields = (this.combinedColumnMeta || [])
          .filter(
            (col: any) =>
              col.dataType === 'date' || col.originalDataType === 'date',
          )
          .map((col: any) => col.dataField);
        const formattedRows = this.formatDateFields(
          cleanedRows,
          dateFields.length > 0
            ? dateFields
            : [
                'TransactionDate',
                'ActivityStartDate',
                'EncounterStartDate',
                'EncounterEndDate',
                'LastResubmissionDate',
                'FirstRemittanceDate',
                'LastRemittanceDate',
                'InitialDateSettlement',
              ],
        );
        // Validation
        this.combinedDataSource = this.validateAndSort(
          formattedRows,
          this.combinedColumnMeta,
        );
        this.updateFilteredDataSource();
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
        if (val === null || val === undefined || String(val).trim() === '') {
          return;
        }
        const str = String(val).trim();
        // String date: only format if it matches dd/MM/yyyy
        const match = str.match(
          /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
        );
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const dateObj = new Date(year, month - 1, day);
            if (
              dateObj.getFullYear() === year &&
              dateObj.getMonth() === month - 1 &&
              dateObj.getDate() === day
            ) {
              const formattedDay = String(day).padStart(2, '0');
              const formattedMonth = String(month).padStart(2, '0');
              const timePart = match[4]
                ? ` ${match[4]}:${match[5]}${match[6] ? ':' + match[6] : ''}`
                : '';
              newRow[field] = `${formattedDay}/${formattedMonth}/${year}${timePart}`;
              return;
            }
          }
        }
        // Keep raw value (e.g. 7/13/2026 or text) so it will be flagged as an error
        newRow[field] = str;
      });
      return newRow;
    });
  }

  // Validate rows of imported excel
  validateAndSort(data: any[], columnMeta: any[]): any[] {
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    this.errorColumnDataFields = [];
    for (const row of data) {
      let isValid = true;
      for (const col of columnMeta) {
        let val = row[col.dataField];
        let fieldHasError = false;

        // Mandatory validation
        if (
          col.IsMandatory &&
          (val === null || val === undefined || String(val).trim() === '')
        ) {
          fieldHasError = true;
        }

        // Numeric / Decimal / Integer validation
        const isDecimalCol =
          col.originalDataType === 'decimal' || col.dataType === 'decimal';
        const isIntegerCol =
          (col.dataType === 'number' ||
            col.originalDataType === 'number') &&
          !isDecimalCol;
        const isNumericCol =
          col.IsNumeric || isDecimalCol || isIntegerCol;

        if (
          !fieldHasError &&
          isNumericCol &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          const cleanedValue = String(val)
            .trim()
            .replace(/,/g, '')
            .replace(/[^0-9.-]/g, '');
          const numericValue = Number(cleanedValue);
          if (
            isNaN(numericValue) ||
            (isIntegerCol && !Number.isInteger(numericValue))
          ) {
            fieldHasError = true;
          } else {
            row[col.dataField] = numericValue;
          }
        }

        // Date format validation (only dd/mm/yyyy allowed)
        if (
          !fieldHasError &&
          (col.dataType === 'date' || col.originalDataType === 'date') &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          if (!this.isValidDDMMYYYY(val)) {
            fieldHasError = true;
          }
        }

        // Max Length validation
        const maxLimit =
          col.MaxLength ||
          col.validationRules?.find((r: any) => r.type === 'stringLength')?.max;
        if (
          !fieldHasError &&
          maxLimit &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          if (String(val).trim().length > maxLimit) {
            fieldHasError = true;
          }
        }

        // Facility validation
        if (!fieldHasError && col.dataField === 'FacilityID' && val) {
          const facilityExists = this.selectedFacilityIDs?.includes(
            String(val).trim(),
          );
          if (!facilityExists) {
            fieldHasError = true;
          }
        }

        if (fieldHasError) {
          isValid = false;
          this.hasError = true;
          if (!this.errorColumnDataFields.includes(col.dataField)) {
            this.errorColumnDataFields.push(col.dataField);
          }
        }
      }
      row.__hasError = !isValid;
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
    this.isValidationTriggered = true;
    this.clearHighlightedHeaders();
    this.hasError = false;

    // Check data validity across all records
    for (const row of this.combinedDataSource) {
      for (const col of this.combinedColumnMeta) {
        const val = row[col.dataField];
        // Mandatory validation
        if (
          col.IsMandatory &&
          (val === null || val === undefined || String(val).trim() === '')
        ) {
          this.hasError = true;
          break;
        }
        // Numeric / Decimal / Integer validation
        const isDecimalCol =
          col.originalDataType === 'decimal' || col.dataType === 'decimal';
        const isIntegerCol =
          (col.dataType === 'number' ||
            col.originalDataType === 'number') &&
          !isDecimalCol;
        const isNumericCol =
          col.IsNumeric || isDecimalCol || isIntegerCol;

        if (
          isNumericCol &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          const cleanedValue = String(val).trim().replace(/,/g, '');
          const numericValue = Number(cleanedValue);
          if (isNaN(numericValue)) {
            this.hasError = true;
            break;
          }
          if (isIntegerCol && !Number.isInteger(numericValue)) {
            this.hasError = true;
            break;
          }
        }
        // Date format validation (only dd/mm/yyyy allowed)
        if (
          (col.dataType === 'date' || col.originalDataType === 'date') &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          if (!this.isValidDDMMYYYY(val)) {
            this.hasError = true;
            break;
          }
        }

        // Max Length validation
        const maxLimit =
          col.MaxLength ||
          col.validationRules?.find((r: any) => r.type === 'stringLength')?.max;
        if (
          maxLimit &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          if (String(val).trim().length > maxLimit) {
            this.hasError = true;
            break;
          }
        }
        // Facility validation
        if (col.dataField === 'FacilityID' && val) {
          const facilityExists = this.selectedFacilityIDs?.includes(
            String(val).trim(),
          );
          if (!facilityExists) {
            this.hasError = true;
            break;
          }
        }
      }
      if (this.hasError) break;
    }

    // Repaint grid to trigger onCellPrepared and show error styling
    this.importGrid?.instance?.repaint();

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
    const expectedDataFields = (this.combinedColumnMeta || []).map(
      (col: any) => col.dataField,
    );
    const importData = (this.combinedDataSource || []).map((row: any) => {
      const trimmedRow: any = {};
      for (const field of expectedDataFields) {
        const val = row[field];
        trimmedRow[field] =
          typeof val === 'string'
            ? val.trim()
            : val === null || val === undefined
            ? ''
            : val;
      }
      return trimmedRow;
    });
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
            const flag = String(res?.FLAG ?? res?.flag ?? '');
            if (flag === '1') {
              sendChunk(index + 1);
            } else {
              notify(
                {
                  message: res?.MESSAGE || res?.message || 'Import failed.',
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
          const flag = String(res?.FLAG ?? res?.flag ?? '');
          if (flag === '1') {
            notify(
              {
                message:
                  res?.MESSAGE ||
                  res?.message ||
                  'Data imported successfully.',
                position: { at: 'top right', my: 'top right' },
                displayTime: 1000,
              },
              'success',
            );
            this.close();
          } else {
            notify(
              {
                message: res?.MESSAGE || res?.message || 'Import failed.',
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
    // Always reset API progress on error
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
    this.isValidationTriggered = false;
    this.showInvalidRowsOnly = false;
    this.filteredDataSource = [];
    this.closeForm.emit();
  }

  clearHighlightedHeaders() {
    this.errorColumnDataFields = [];
    this.highlightedHeaderIds = [];
    const gridElem =
      this.importGrid?.instance?.element() ||
      document.querySelector('dx-data-grid');
    if (gridElem) {
      const headerCells: NodeListOf<HTMLElement> =
        gridElem.querySelectorAll('.dx-header-row > td');
      headerCells.forEach((cell: HTMLElement) => {
        cell.style.backgroundColor = '';
        cell.style.color = '';
      });
    }
  }

  onCellPrepared(e: any) {
    // Header cell prepared
    if (e.rowType === 'header') {
      const field = e.column?.dataField;
      if (field && this.errorColumnDataFields.includes(field)) {
        e.cellElement.classList.add('error-header-cell');
        e.cellElement.style.setProperty(
          'background-color',
          '#FFC1C3',
          'important',
        );
        e.cellElement.style.setProperty('color', '#FF0000', 'important');
      } else {
        e.cellElement.classList.remove('error-header-cell');
        e.cellElement.style.backgroundColor = '';
        e.cellElement.style.color = '';
      }
      return;
    }

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

    let cellHasError = false;
    let errorMessage = '';

    // Mandatory validation
    if (
      column.IsMandatory &&
      (value === null || value === undefined || String(value).trim() === '')
    ) {
      cellHasError = true;
      errorMessage = `Error: ${column.caption || column.dataField} is required`;
    }

    // Numeric / Decimal / Integer validation
    const isDecimalCol =
      column.originalDataType === 'decimal' || column.dataType === 'decimal';
    const isIntegerCol =
      (column.dataType === 'number' ||
        column.originalDataType === 'number') &&
      !isDecimalCol;
    const isNumericCol =
      column.IsNumeric || isDecimalCol || isIntegerCol;

    if (
      !cellHasError &&
      isNumericCol &&
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      const cleanedValue = String(value).trim().replace(/,/g, '');
      const numericValue = Number(cleanedValue);
      if (isNaN(numericValue)) {
        cellHasError = true;
        errorMessage = 'Error: Value must be numeric';
      } else if (isIntegerCol && !Number.isInteger(numericValue)) {
        cellHasError = true;
        errorMessage = 'Error: Value must be an integer (whole number)';
      }
    }

    // Date format validation (only dd/mm/yyyy allowed)
    if (
      !cellHasError &&
      (column.dataType === 'date' || column.originalDataType === 'date') &&
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      if (!this.isValidDDMMYYYY(value)) {
        cellHasError = true;
        errorMessage =
          'Error: Invalid date format. Only dd/MM/yyyy is allowed';
      }
    }

    // Max Length validation
    const maxLimit =
      column.MaxLength ||
      column.validationRules?.find((r: any) => r.type === 'stringLength')?.max;
    if (
      !cellHasError &&
      maxLimit &&
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      if (String(value).trim().length > maxLimit) {
        cellHasError = true;
        errorMessage = `Error: Max length is ${maxLimit}`;
      }
    }

    // Facility validation
    if (!cellHasError && column.dataField === 'FacilityID' && value) {
      const facilityExists = this.selectedFacilityIDs?.includes(
        String(value).trim(),
      );
      if (!facilityExists) {
        cellHasError = true;
        errorMessage = 'Error: Invalid Facility ID';
      }
    }

    if (cellHasError) {
      e.cellElement.style.border = '2px solid #FFC1C3';
      e.cellElement.style.color = 'red';
      this.hasError = true;
      this.highlightColumnHeader(e.column?.dataField, e.columnIndex);
      this.createTooltip(e.cellElement, errorMessage);
    }
  }

  highlightColumnHeader(dataField?: string, columnIndex?: number) {
    if (!dataField) return;
    if (!this.errorColumnDataFields.includes(dataField)) {
      this.errorColumnDataFields.push(dataField);
    }
    const gridElem =
      this.importGrid?.instance?.element() ||
      document.querySelector('dx-data-grid');
    if (gridElem) {
      const headerCells: NodeListOf<HTMLElement> =
        gridElem.querySelectorAll('.dx-header-row > td');
      if (
        columnIndex !== undefined &&
        columnIndex >= 0 &&
        headerCells[columnIndex]
      ) {
        headerCells[columnIndex].classList.add('error-header-cell');
        headerCells[columnIndex].style.setProperty(
          'background-color',
          '#FFC1C3',
          'important',
        );
        headerCells[columnIndex].style.setProperty(
          'color',
          '#FF0000',
          'important',
        );
      } else {
        const colIdx =
          this.importGrid?.instance?.getVisibleColumnIndex(dataField);
        if (colIdx !== undefined && colIdx >= 0 && headerCells[colIdx]) {
          headerCells[colIdx].classList.add('error-header-cell');
          headerCells[colIdx].style.setProperty(
            'background-color',
            '#FFC1C3',
            'important',
          );
          headerCells[colIdx].style.setProperty(
            'color',
            '#FF0000',
            'important',
          );
        }
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
