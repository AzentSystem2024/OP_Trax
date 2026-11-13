import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
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
import * as XLSX from 'xlsx';
import { OperationReportService } from '../../OPERATION PAGES/operation-report.service';
import { ReportService } from 'src/app/services/Report-data.service';
import { firstValueFrom } from 'rxjs';
import { InactivityService } from 'src/app/services/inactivity.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-clinical-data-import-form',
  templateUrl: './clinical-data-import-form.component.html',
  styleUrls: ['./clinical-data-import-form.component.scss'],
})
export class ClinicalDataImportFormComponent {
  @Output() closeForm = new EventEmitter();
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @Input() menuPrevilage: any;
  @ViewChild('importGrid', { static: false }) importGrid!: DxDataGridComponent;
  validationGroup!: DxValidationGroupComponent;
  
  selectedOption: string = 'Import Excel File';
  isApplygrouper: boolean = true;
  selectedXmlFile: any | null = null;
  importResults: any[] = [];
  isResponsePopupOpened: boolean = false;
  isExcelpopupOpened: boolean = false;
  loadingMessage: string = 'Saving...';
  grouperTotal: number = 0;
  grouperCompleted: number = 0;
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
  encounterTypeList: any[] = [];
  encounterTypeIDList: any[] = [];

  combinedDataSource: any[] = [];
  filteredDataSource: any[] = [];
  showInvalidRowsOnly: boolean = false;

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
    private notificationService: NotificationService,
  ) {
    this.userID = sessionStorage.getItem('UserID');
    this.getUserFacilityData();
    this.loadColumnMetadata();
    this.loadEncounterTypeList();
    this.loadEncounterTypeIDList();
  }

  isInvalidEncounterType(val: any): boolean {
    if (val === null || val === undefined) return true;
    const str = String(val).trim();
    if (str === '' || str === '0') return true;

    const rawWithoutCommas = str.replace(/,/g, '');
    const numVal = Number(rawWithoutCommas);
    const isInt = !isNaN(numVal) && Number.isInteger(numVal) && numVal > 0;

    // 1. If value is an integer, validate against ID in encounterTypeIDList or encounterTypeList
    if (isInt) {
      if (this.encounterTypeIDList && this.encounterTypeIDList.length > 0) {
        const matchID = this.encounterTypeIDList.some((item: any) => {
          if (!item) return false;
          const id = item.ID !== undefined ? item.ID : item.id;
          return id !== undefined && id !== null && Number(id) === numVal;
        });
        if (matchID) return false;
      }

      if (this.encounterTypeList && this.encounterTypeList.length > 0) {
        const matchID = this.encounterTypeList.some((item: any) => {
          if (!item) return false;
          const id = item.ID !== undefined ? item.ID : item.id;
          return id !== undefined && id !== null && Number(id) === numVal;
        });
        if (matchID) return false;
      }

      // If dropdowns are loaded and integer was not found in either ID list
      if (
        (this.encounterTypeIDList && this.encounterTypeIDList.length > 0) ||
        (this.encounterTypeList && this.encounterTypeList.length > 0)
      ) {
        return true;
      }
    }

    // 2. If string description, validate against DESCRIPTION in encounterTypeList or encounterTypeIDList
    const lowerStr = str.toLowerCase();

    if (this.encounterTypeList && this.encounterTypeList.length > 0) {
      const matchDesc = this.encounterTypeList.some((item: any) => {
        if (!item) return false;
        const desc =
          item.DESCRIPTION ||
          item.Description ||
          item.description ||
          item.Name ||
          item.name;
        return (
          desc !== undefined &&
          desc !== null &&
          String(desc).trim().toLowerCase() === lowerStr
        );
      });
      if (matchDesc) return false;
    }

    if (this.encounterTypeIDList && this.encounterTypeIDList.length > 0) {
      const matchDesc = this.encounterTypeIDList.some((item: any) => {
        if (!item) return false;
        const desc =
          item.DESCRIPTION ||
          item.Description ||
          item.description ||
          item.Name ||
          item.name;
        return (
          desc !== undefined &&
          desc !== null &&
          String(desc).trim().toLowerCase() === lowerStr
        );
      });
      if (matchDesc) return false;
    }

    // If dropdowns are loaded and neither matched
    if (
      (this.encounterTypeIDList && this.encounterTypeIDList.length > 0) ||
      (this.encounterTypeList && this.encounterTypeList.length > 0)
    ) {
      return true;
    }

    // Fallback if dropdown list not loaded yet: accept non-empty string or positive integer
    if (isInt) return false;
    return false;
  }

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

    // Custom regex for standard formats
    const match = str.match(
      /^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM|am|pm))?))?$/,
    );
    if (match) {
      let year: number, month: number, day: number;
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      const p3 = parseInt(match[3], 10);

      if (p1 > 100) {
        year = p1;
        month = p2;
        day = p3;
      } else {
        year = p3;
        if (year < 100) {
          year += year >= 50 ? 1900 : 2000; // Support 2-digit years
        }
        day = p1;
        month = p2;
        if (month > 12 && day <= 12) {
          month = p1;
          day = p2;
        }
      }

      if (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        year >= 1900 &&
        year <= 2100
      ) {
        const dateObj = new Date(year, month - 1, day);
        if (
          dateObj.getFullYear() === year &&
          dateObj.getMonth() === month - 1 &&
          dateObj.getDate() === day
        ) {
          return true;
        }
      }
    }

    // Fallback: Use standard JS Date parsing
    const fbDate = new Date(str);
    if (!isNaN(fbDate.getTime())) {
      return true;
    }

    return false;
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
      const isEncounterType = col.dataField?.toLowerCase() === 'encountertype' || col.dataField?.toLowerCase() === 'encountertypeid';
      const isMandatory = !!col.IsMandatory || isEncounterType;
      const rules: any[] = [];
      if (isMandatory) {
        rules.push({ type: 'required' });
      }
      const rawMax = col.MaxLength ?? col.maxLength ?? col.validationRules;
      const maxLen = Number(rawMax);
      if (!isNaN(maxLen) && maxLen > 0) {
        rules.push({ type: 'stringLength', max: maxLen });
      }

      return {
        dataField: col.dataField,
        caption: col.caption,
        dataType: 'string',
        format: undefined,
        validationRules: rules,
        MaxLength: !isNaN(maxLen) && maxLen > 0 ? maxLen : null,
        IsMandatory: isMandatory,
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
        this.loadEncounterTypeList(),
        this.loadEncounterTypeIDList(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  // ================== Encounter Type List ==================
  async loadEncounterTypeList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.service.Get_GropDown('ENCOUNTER_TYPE'),
      );
      this.encounterTypeList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
    } catch (error) {
      console.error('Error fetching encounter type list:', error);
    }
  }

  // ================== Encounter Type ID List ==================
  async loadEncounterTypeIDList(): Promise<void> {
    try {
      let res: any = await firstValueFrom(
        this.service.Get_GropDown('EncounterTypeID'),
      ).catch(() => null);
      if (!res || (Array.isArray(res) && res.length === 0)) {
        res = await firstValueFrom(
          this.service.Get_GropDown('ENCOUNTER_TYPE_ID'),
        ).catch(() => null);
      }
      this.encounterTypeIDList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
    } catch (error) {
      console.error('Error fetching EncounterTypeID dropdown:', error);
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

  resetValidationState() {
    this.hasError = false;
    this.isValidationTriggered = false;
    this.showInvalidRowsOnly = false;
    this.errorColumnDataFields = [];
    this.highlightedHeaderIds = [];
    this.combinedDataSource = [];
    this.filteredDataSource = [];
    this.grouperTotal = 0;
    this.grouperCompleted = 0;
    this.loadingMessage = 'Saving...';
    this.clearHighlightedHeaders();
  }

  // ================ Called when a file is selected
  async onFileSelected(event: any, fileInput: HTMLInputElement): Promise<void> {
    this.resetValidationState();
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
          this.notificationService.showNotification(
            err?.message ||
              'Network error occurred during import. Process stopped.',
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
        this.notificationService.showNotification(
          `Invalid file type: ${file.name}. Supported types: XML, XLS, XLSX, CSV`,
          'error',
        );
        continue;
      }

      // File Size Validation (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        this.notificationService.showNotification(
          `File size exceeds 50MB limit: ${file.name}`,
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
          this.notificationService.showNotification(
            'Selected file contains no data.',
            'warning',
          );
          continue;
        }

        // Header Validation from first row
        const firstRow = rows[0] || {};
        const actualColumns = Object.keys(firstRow).map((col: any) =>
          typeof col === 'string' ? col.trim() : col,
        );
        const expectedColumns = (this.combinedColumnMeta || []).map((x: any) =>
          typeof x.dataField === 'string' ? x.dataField.trim() : x.dataField,
        );
        const missingColumns = expectedColumns.filter(
          (col: any) => !actualColumns.includes(col),
        );
        if (missingColumns.length > 0) {
          this.notificationService.showNotification(
            'Missing Columns: ' + missingColumns.join(', '),
            'error',
          );
          continue;
        }

        // Date Formatting Fields
        const dateFields = (this.combinedColumnMeta || [])
          .filter(
            (col: any) =>
              col.dataType === 'date' || col.originalDataType === 'date',
          )
          .map((col: any) => col.dataField);
        const activeDateFields =
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
              ];

        // Process data in chunks to load large datasets smoothly
        const CHUNK_SIZE = 25000;
        const totalRows = rows.length;
        const validRows: any[] = [];
        const invalidRows: any[] = [];
        this.errorColumnDataFields = [];

        for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
          const slice = rows.slice(i, i + CHUNK_SIZE);

          // Clean headers and cell values
          const cleanedSlice = slice.map((row: any) => {
            const cleanedRow: any = {};
            for (const key of Object.keys(row)) {
              const trimmedKey = typeof key === 'string' ? key.trim() : key;
              const val = row[key];
              cleanedRow[trimmedKey] =
                typeof val === 'string' ? val.trim() : val;
            }
            return cleanedRow;
          });

          // Format dates
          const formattedSlice = this.formatDateFields(
            cleanedSlice,
            activeDateFields,
          );

          // Validate and sort this chunk
          const validatedChunk = this.validateAndSort(
            formattedSlice,
            this.combinedColumnMeta,
          );

          for (const row of validatedChunk) {
            if (row.__hasError) {
              invalidRows.push(row);
            } else {
              validRows.push(row);
            }
          }

          // Yield to event loop so browser doesn't freeze
          if (totalRows > CHUNK_SIZE) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        // Invalid rows first, valid rows after
        this.combinedDataSource = [...invalidRows, ...validRows];
        this.updateFilteredDataSource();
        if (!this.combinedDataSource || this.combinedDataSource.length === 0) {
          this.notificationService.showNotification(
            'No valid records found.',
            'warning',
          );
          continue;
        }
        console.log('Imported Data:', this.combinedDataSource);
        this.notificationService.showNotification(
          `${this.combinedDataSource.length.toLocaleString()} records loaded successfully.`,
          'success',
        );
        this.isExcelpopupOpened = true;
      } catch (error: any) {
        console.error('Import Error:', error);
        this.notificationService.showNotification(
          error?.message || 'Failed to import file.',
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

  //========== Format date as dd/MM/yyyy or dd-MM-yyyy
  formatDateFields(data: any[], dateFields: string[]): any[] {
    return data.map((row) => {
      const newRow = { ...row };
      dateFields.forEach((field) => {
        const val = newRow[field];
        if (val === null || val === undefined || String(val).trim() === '') {
          return;
        }
        const str = String(val).trim();
        // String date: check if it matches a date format with optional time
        const match = str.match(
          /^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM|am|pm))?))?$/,
        );

        if (match) {
          let year: number, month: number, day: number;
          const p1 = parseInt(match[1], 10);
          const p2 = parseInt(match[2], 10);
          const p3 = parseInt(match[3], 10);

          if (p1 > 100) {
            year = p1;
            month = p2;
            day = p3;
          } else {
            year = p3;
            if (year < 100) {
              year += year >= 50 ? 1900 : 2000; // Support 2-digit years
            }
            day = p1;
            month = p2;
            if (month > 12 && day <= 12) {
              month = p1;
              day = p2;
            }
          }

          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const dateObj = new Date(year, month - 1, day);
            if (
              dateObj.getFullYear() === year &&
              dateObj.getMonth() === month - 1 &&
              dateObj.getDate() === day
            ) {
              const formattedDay = String(day).padStart(2, '0');
              const formattedMonth = String(month).padStart(2, '0');
              const timePart = match[4] ? ` ${match[4]}` : '';
              const separator = str.includes('-') ? '-' : '/';

              newRow[field] =
                `${formattedDay}${separator}${formattedMonth}${separator}${year}${timePart}`;
              return;
            }
          }
        }

        // Fallback: JS Date formatting
        const fbDate = new Date(str);
        if (!isNaN(fbDate.getTime())) {
          const year = fbDate.getFullYear();
          const month = fbDate.getMonth() + 1;
          const day = fbDate.getDate();

          const formattedDay = String(day).padStart(2, '0');
          const formattedMonth = String(month).padStart(2, '0');

          let timePart = '';
          if (str.includes(':')) {
            const matchTime = str.match(
              /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM|am|pm))?)/,
            );
            if (matchTime) {
              timePart = ` ${matchTime[1]}`;
            } else {
              const hours = String(fbDate.getHours()).padStart(2, '0');
              const mins = String(fbDate.getMinutes()).padStart(2, '0');
              const secs = String(fbDate.getSeconds()).padStart(2, '0');
              timePart = ` ${hours}:${mins}:${secs}`;
            }
          }

          const separator = str.includes('-') ? '-' : '/';
          newRow[field] =
            `${formattedDay}${separator}${formattedMonth}${separator}${year}${timePart}`;
          return;
        }

        // Keep raw value (e.g. text) so it will be flagged as an error
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

        // EncounterType validation (Checks against dropdown ID or DESCRIPTION)
        const isEncounterCol =
          col.dataField?.toLowerCase() === 'encountertype' ||
          col.dataField?.toLowerCase() === 'encountertypeid';
        if (!fieldHasError && isEncounterCol) {
          if (this.isInvalidEncounterType(val)) {
            fieldHasError = true;
          }
        }

        // Numeric / Decimal / Integer validation
        const isDecimalCol =
          col.originalDataType === 'decimal' || col.dataType === 'decimal';
        const isIntegerCol =
          (col.dataType === 'number' || col.originalDataType === 'number') &&
          !isDecimalCol;
        const isNumericCol =
          !isEncounterCol && (col.IsNumeric || isDecimalCol || isIntegerCol);

        if (
          !fieldHasError &&
          isNumericCol &&
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ''
        ) {
          const cleanedValue = String(val).trim().replace(/,/g, '');
          const numericValue = Number(cleanedValue);
          if (
            isNaN(numericValue) ||
            (isIntegerCol && !Number.isInteger(numericValue))
          ) {
            fieldHasError = true;
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
      this.notificationService.showNotification(
        'Please import your file',
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

        // EncounterType validation (Checks against dropdown ID or DESCRIPTION)
        const isEncounterCol =
          col.dataField?.toLowerCase() === 'encountertype' ||
          col.dataField?.toLowerCase() === 'encountertypeid';
        if (isEncounterCol) {
          if (this.isInvalidEncounterType(val)) {
            this.hasError = true;
            break;
          }
        }

        // Numeric / Decimal / Integer validation
        const isDecimalCol =
          col.originalDataType === 'decimal' || col.dataType === 'decimal';
        const isIntegerCol =
          (col.dataType === 'number' || col.originalDataType === 'number') &&
          !isDecimalCol;
        const isNumericCol =
          !isEncounterCol && (col.IsNumeric || isDecimalCol || isIntegerCol);

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
      this.notificationService.showNotification(
        'Please fix the validation errors before saving.',
        'error',
      );
      return;
    }
    this.isSaving = true;
    this.isLoading = true;
    this.loadingMessage = 'Saving...';
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
              this.notificationService.showNotification(
                res?.MESSAGE || res?.message || 'Import failed.',
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

  async processGrouperClaims(claimUids: number[]): Promise<void> {
    this.grouperTotal = claimUids.length;
    this.grouperCompleted = 0;
    this.isLoading = true;
    this.isSaving = true;
    this.loadingMessage = `Applying Grouper\n0/${this.grouperTotal}`;
    this.inactivityService.setApiInProgress(true);

    for (const uid of claimUids) {
      const payload = { ClaimUID: uid };
      try {
        await firstValueFrom(
          this.operationservice.getClinicalDataInPopup(payload),
        );
      } catch (err) {
        console.error(`Error applying grouper for ClaimUID ${uid}:`, err);
      }
      this.grouperCompleted++;
      this.loadingMessage = `Applying Grouper\n${this.grouperCompleted}/${this.grouperTotal}`;
    }

    this.inactivityService.setApiInProgress(false);
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
        next: async (res: any) => {
          const flag = String(res?.FLAG ?? res?.flag ?? '');
          if (flag === '1') {
            const rawClaimUids =
              res?.ClaimUID ??
              res?.claimUID ??
              res?.ClaimUIDs ??
              res?.claimUIDs ??
              res?.data ??
              [];
            const claimUids: number[] = Array.isArray(rawClaimUids)
              ? rawClaimUids
                  .map((x: any) => Number(x))
                  .filter((x: number) => !isNaN(x) && x > 0)
              : [];

            if (this.isApplygrouper && claimUids.length > 0) {
              await this.processGrouperClaims(claimUids);
              this.notificationService.showNotification(
                'Data imported and grouper applied successfully.',
                'success',
              );
            } else {
              this.notificationService.showNotification(
                res?.MESSAGE || res?.message || 'Data imported successfully.',
                'success',
              );
            }
            this.isLoading = false;
            this.isSaving = false;
            this.isExcelpopupOpened = false;
            this.resetValidationState();
            this.close();
          } else {
            this.notificationService.showNotification(
              res?.MESSAGE || res?.message || 'Import failed.',
              'error',
            );
            this.isLoading = false;
            this.isSaving = false;
          }
          this.inactivityService.setApiInProgress(false);
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
          this.isSaving = false;
          this.inactivityService.setApiInProgress(false);
        },
      });
  }

  // ============ common function for notification handler ========
  handleError(error: any) {
    if (error.status === 0) {
      this.notificationService.showNotification(
        'Network error: Please check your internet connection.',
        'error',
      );
    } else if (error.status === 500) {
      this.notificationService.showNotification(
        'Server error: Unable to process request. Try later.',
        'error',
      );
    } else {
      this.notificationService.showNotification(
        'Failed to import data. Please try again.',
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
    this.resetValidationState();
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    this.fileInputRef.nativeElement.click(); // just trigger file dialog
  }

  close() {
    this.resetValidationState();
    this.closeForm.emit();
  }

  onXmlPopupHiding(e: any) {
    if (this.isExcelLoading) {
      e.cancel = true;
      this.notificationService.showNotification(
        'Please wait until the file upload process is complete.',
        'warning',
      );
    }
  }

  onXmlImportClose() {
    this.resetValidationState();
    this.isResponsePopupOpened = false;
    this.importResults = [];
    this.closeForm.emit();
  }

  CloseExcelForm() {
    this.resetValidationState();
    this.isExcelpopupOpened = false;
    this.closeForm.emit();
  }

  onExcelPopupHiding(e: any) {
    if (this.isLoading || this.isSaving) {
      e.cancel = true;
      this.notificationService.showNotification(
        'Please wait until the process is complete.',
        'warning',
      );
    }
  }

  clearHighlightedHeaders() {
    this.errorColumnDataFields = [];
    this.highlightedHeaderIds = [];
    const gridElem =
      this.importGrid?.instance?.element() ||
      document.querySelector('dx-data-grid');
    if (gridElem) {
      const headerCells: NodeListOf<HTMLElement> = gridElem.querySelectorAll(
        '.dx-header-row > td',
      );
      headerCells.forEach((cell: HTMLElement) => {
        cell.classList.remove('error-header-cell');
        cell.style.backgroundColor = '';
        cell.style.color = '';
      });
      const tooltips = gridElem.querySelectorAll('.error-tooltip');
      tooltips.forEach((t: Element) => t.remove());
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
    const existingTooltips = e.cellElement.querySelectorAll('.error-tooltip');
    existingTooltips.forEach((t: HTMLElement) => t.remove());

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

    // EncounterType validation (Checks against dropdown ID or DESCRIPTION)
    const isEncounterCol =
      column.dataField?.toLowerCase() === 'encountertype' ||
      column.dataField?.toLowerCase() === 'encountertypeid';
    if (!cellHasError && isEncounterCol) {
      if (this.isInvalidEncounterType(value)) {
        cellHasError = true;
        errorMessage = 'Error: Invalid Encounter Type';
      }
    }

    // Numeric / Decimal / Integer validation
    const isDecimalCol =
      column.originalDataType === 'decimal' || column.dataType === 'decimal';
    const isIntegerCol =
      (column.dataType === 'number' || column.originalDataType === 'number') &&
      !isDecimalCol;
    const isNumericCol =
      !isEncounterCol && (column.IsNumeric || isDecimalCol || isIntegerCol);

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
        errorMessage = 'Error: Invalid date format. Only dd/MM/yyyy is allowed';
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
      const headerCells: NodeListOf<HTMLElement> = gridElem.querySelectorAll(
        '.dx-header-row > td',
      );
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
