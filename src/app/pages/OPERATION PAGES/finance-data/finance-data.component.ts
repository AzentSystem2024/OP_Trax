import {
  Component,
  ElementRef,
  EventEmitter,
  NgModule,
  OnDestroy,
  OnInit,
  Output,
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
  DxTagBoxModule,
  DxTextBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { ReportService } from 'src/app/services/Report-data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormPopupModule } from 'src/app/components';
import DataSource from 'devextreme/data/data_source';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services';
import { OperationReportService } from '../operation-report.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  ClinicalDataImportFormComponent,
  ClinicalDataImportFormModule,
} from '../../POP-UP_PAGES/clinical-data-import-form/clinical-data-import-form.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { firstValueFrom } from 'rxjs';
import { confirm } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-finance-data',
  templateUrl: './finance-data.component.html',
  styleUrls: ['./finance-data.component.scss'],
  providers: [ReportService, DataService, OperationReportService, DatePipe],
})
export class FinanceDataComponent implements OnInit {
  @ViewChild('validationGroup', { static: true })
  validationGroup!: DxValidationGroupComponent;
  @ViewChild('excelInput', { static: false })
  excelInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  isAddFormPopupOpened: any = false;
  isImportPopupOpened: boolean = false;
  importFinanceDataList: any;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;
  isFilterRowVisible: boolean = false;
  isViewFilterRowVisible: boolean = false;
  hasError: boolean = false;
  popupwidth: any = '80%';
  importedDataSource: any;
  isSaving: boolean = false;
  isLoading: boolean = false;

  currentPathName: any;
  initialized: boolean = false;
  departmentList: any;
  CPTDepartmentList: any;
  ledgerCodeList: any;
  costTypeList: any;
  clinicianLicenseList: any;
  highlightedHeaderIds: string[] = [];
  UserID: any;
  selectedData: any;
  ViewImportDataPopup: boolean = false;
  importedMetadata: any = [];

  FileName: any;

  importFinanceColumnMeta = [
    {
      dataField: 'FacilityID',
      caption: 'FacilityID',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'PeriodFrom',
      caption: 'Period From',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'PeriodTo',
      caption: 'Period To',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'LedgerCode',
      caption: 'Ledger Code',
      IsMandatory: true,
      IsNumeric: false,
    },
    {
      dataField: 'Department',
      caption: 'Department',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'SubDepartment',
      caption: 'Sub Department',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'ClinicianID',
      caption: 'Clinician ID',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'CostType',
      caption: 'CostType',
      IsMandatory: false,
      IsNumeric: false,
    },
    {
      dataField: 'Amount',
      caption: 'Amount',
      IsMandatory: true,
      IsNumeric: true,
    },
  ];

  addButtonOptions = {
    icon: 'import',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Import',
    onClick: () => {
      this.excelInputRef.nativeElement.click();
    },
    elementAttr: { class: 'add-button' },
  };

  facilityListDataSource: any;
  selectedFacility: any[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;
  today: Date = new Date();
  dataSource!: DataSource<any, any>;

  selectedmonth: any = '';
  selectedYear: any = null;
  minDate: Date;
  maxDate: Date;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];
  status: any;

  constructor(
    private service: ReportService,
    private dataService: DataService,
    private operationService: OperationReportService,
    private masterService: MasterReportService,
    private datePipe: DatePipe,
  ) {
    this.UserID = sessionStorage.getItem('UserID');
    this.minDate = new Date(2023, 0, 1);
    this.maxDate = new Date();
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
  }

  usNumberFormat = (value: number) => {
    if (value == null) return '';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  async ngOnInit() {
    try {
      await this.loadInitialData();
      // this.initializeDefaults();
      this.onApplyFilter();
      this.isFilterRowVisible = false;
      this.isViewFilterRowVisible = false;
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

  // ================== Load all initial lists in parallel ==================
  async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadFacilityData(),
        this.loadClinicianList(),
        // this.loadDepartmentList(),
        // this.loadCPTDepartmentList(),
        // this.loadLedgerList(),
        // this.loadCostTypeList(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  // ================== Load Facility list ==================
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
  // ================== fetch Department list ==================
  async loadDepartmentList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.masterService.getDepartmentData(),
      );
      this.departmentList = res?.datas ?? [];
    } catch (error) {
      console.error('Error fetching department data:', error);
    }
  }
  // ================== fetch CPT department list ==================
  async loadCPTDepartmentList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.masterService.getSubDepartmentData(),
      );
      this.CPTDepartmentList = res?.datas ?? [];
    } catch (error) {
      console.error('Error fetching CPT department data:', error);
    }
  }
  // ================== fetch ledger list ==================
  async loadLedgerList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.masterService.Get_GropDown('LEDGER_CODE'),
      );
      this.ledgerCodeList = res ?? [];
    } catch (error) {
      console.error('Error fetching ledger list:', error);
    }
  }

  async loadClinicianList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.masterService.Get_GropDown('CLINICIAN_LICENSE'),
      );
      this.clinicianLicenseList = res ?? [];
    } catch (error) {
      console.error('Error fetching ledger list:', error);
    }
  }
  // ================== fetch coast type list ==================
  async loadCostTypeList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.masterService.Get_GropDown('COST_TYPE'),
      );
      this.costTypeList = res ?? [];
    } catch (error) {
      console.error('Error fetching cost type list:', error);
    }
  }

  // ================== Initialize default values ==================
  initializeDefaults(): void {
    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), 0, 1);

    const defaultFacility = this.facilityListDataSource.find(
      (f: any) => f.ID === 16,
    );
    if (defaultFacility) {
      this.selectedFacility = [defaultFacility.FacilityLicense];
    }
  }

  // cellTemplate for status
  cellTemplate = (container: any, options: any) => {
    const icon = document.createElement('i');
    icon.className = 'fas fa-flag';
    icon.style.color = options.value === 'Active' ? '#4ef748' : 'red';
    icon.style.fontSize = '18px';
    icon.style.display = 'inline-block';
    icon.style.width = '100%';
    icon.style.textAlign = 'center';
    icon.title = options.value;
    container.appendChild(icon);
  };

  // ================== Load grid data by filter values ==================
  onApplyFilter(): void {
    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.operationService.getFinanceDataImportLog().subscribe({
            next: (res: any) => resolve(res.data),
            error: ({ message }) => reject(message),
          });
        }),
    });
  }

  downloadFinanceImportTemplate = () => {
    // Extract headers from meta
    const headers = this.importFinanceColumnMeta.map((col) => col.dataField);

    // Optional: Add one empty row for formatting
    const emptyRow = this.importFinanceColumnMeta.reduce(
      (acc: any, col: any) => {
        acc[col.dataField] = '';
        return acc;
      },
      {},
    );

    const worksheetData = [emptyRow]; // initial empty row

    // Create worksheet and workbook
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: headers,
      skipHeader: false,
    });

    const workbook: XLSX.WorkBook = {
      Sheets: { Template: worksheet },
      SheetNames: ['Template'],
    };

    // Generate and trigger download
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, 'FinanceDataImportTemplate.xlsx');
  };

  viewDetails = (e: any) => {
    this.importedDataSource = [];
    this.selectedData = e.row.key;
    const ID = this.selectedData.ID;
    console.log(this.selectedData);
    this.importedDataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.operationService.getFinanceDataImportData(ID).subscribe({
            next: (res: any) => {
              // Store metadata in a separate variable
              this.importedMetadata = {
                FileName: res.data[0].FileName,
                UserName: res.data[0].ImportedUser,
                ImportTime: res.data[0].ImportedTime,
                // add other properties if needed
              };

              // Bind only 'data' to the grid
              resolve(res.data);
            },
            error: ({ message }) => reject(message),
          });
        }),
    });

    this.ViewImportDataPopup = true;
  };

  updateStatus = (e: any) => {
    const data = e.row.key;
    const ID = data.ID;
    const currentStatus = data.Status;
    this.status = currentStatus;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    const result = confirm(
      `Are you sure you want to update this Finance Data As <b>${newStatus}</b>?`,
      'Make Inactive',
    );

    result.then((dialogResult: boolean) => {
      if (dialogResult) {
        const payload = {
          ID: ID,
          IsInactive: newStatus === 'Inactive' ? true : false,
        };

        this.operationService.update_Finance_Data_Status(payload).subscribe({
          next: (res: any) => {
            if (res.flag === '1') {
              notify(
                {
                  message: `Status successfully updated As ${newStatus}.`,
                  position: { at: 'top right', my: 'top right' },
                },
                'success',
                2000,
              );

              // Update status in grid
              this.dataGrid.instance.refresh();
            } else {
              notify(
                {
                  message: res.message || 'Status update failed.',
                  position: { at: 'top right', my: 'top right' },
                },
                'error',
                2000,
              );
            }
          },
          error: () => {
            notify(
              {
                message: 'An error occurred while updating status.',
                position: { at: 'top right', my: 'top right' },
              },
              'error',
              2000,
            );
          },
        });
      }
    });
  };

  async onExcelSelected(event: any): Promise<void> {
    this.hasError = false;
    this.isLoading = true;

    try {
      await Promise.all([
        this.loadDepartmentList(),
        this.loadCPTDepartmentList(),
        this.loadLedgerList(),
        this.loadCostTypeList(),
        // this.loadClinicianList()
      ]);

      const validationResult = this.validationGroup.instance.validate();
      if (!validationResult.isValid) {
        event.target.value = '';
        return;
      }

      const file = event.target.files[0];
      this.FileName = file.name;

      if (file) {
        const reader = new FileReader();

        reader.onload = (e: any) => {
          const arrayBuffer = e.target.result;
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
            type: 'array',
          });

          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          const uploadedHeaders = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
          })[0];

          const rawData: any[] = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
          });

          const data: any[] = rawData.map((row: any) => {
            if (row['PeriodFrom']) {
              row['PeriodFrom'] = this.formatExcelDateToUIDate(
                row['PeriodFrom'],
              );
            }
            if (row['PeriodTo']) {
              row['PeriodTo'] = this.formatExcelDateToUIDate(row['PeriodTo']);
            }
            return row;
          });

          // Validate rows immediately
          const invalidRows: any[] = [];
          const validRows: any[] = [];

          data.forEach((row) => {
            let isValid = true;

            for (const column of this.importFinanceColumnMeta) {
              const value = row[column.dataField];

              if (column.IsMandatory && !value) {
                isValid = false;
                break;
              }

              if (
                column.IsNumeric &&
                value &&
                isNaN(value.toString().replace(/,/g, ''))
              ) {
                isValid = false;
                break;
              }

              if (column.dataField === 'FacilityID' && value) {
                const facilityExists = this.selectedFacility.includes(value);
                if (!facilityExists) {
                  isValid = false;
                  break;
                }
              }

              if (column.dataField === 'Department' && value) {
                const departmentExists = this.departmentList.some(
                  (d: any) =>
                    d.DEPARTMENT?.toLowerCase().trim() ===
                    value.toLowerCase().trim(),
                );
                if (!departmentExists) {
                  isValid = false;
                  break;
                }
              }

              if (column.dataField === 'LedgerCode' && value) {
                const ledgerExists = this.ledgerCodeList.some(
                  (d: any) =>
                    d.DESCRIPTION?.toLowerCase().trim() ===
                    value.toLowerCase().trim(),
                );
                if (!ledgerExists) {
                  isValid = false;
                  break;
                }
              }

              if (column.dataField === 'SubDepartment' && value) {
                const enteredDepartment = row['Department']
                  ?.trim()
                  .toLowerCase();
                const enteredSubDepartment = value.trim().toLowerCase();
                const matchedSubDept = this.CPTDepartmentList.find(
                  (item: any) =>
                    item.SUB_DEPARTMENT?.trim().toLowerCase() ===
                    enteredSubDepartment,
                );

                if (
                  !matchedSubDept ||
                  (enteredDepartment &&
                    matchedSubDept.DEPARTMENT?.trim().toLowerCase() !==
                      enteredDepartment)
                ) {
                  isValid = false;
                  break;
                }
              }

              if (column.dataField === 'CostType' && value) {
                const costTypeExists = this.costTypeList.some(
                  (d: any) =>
                    d.DESCRIPTION?.toLowerCase().trim() ===
                    value.toLowerCase().trim(),
                );
                if (!costTypeExists) {
                  isValid = false;
                  break;
                }
              }

              if (column.dataField === 'ClinicianID' && value) {
                const clinicianExists = this.clinicianLicenseList.some(
                  (d: any) =>
                    d.DESCRIPTION?.toLowerCase().trim() ===
                    value.toLowerCase().trim(),
                );
                if (!clinicianExists) {
                  isValid = false;
                  break;
                }
              }
            }

            if (isValid) {
              validRows.push(row);
            } else {
              invalidRows.push(row);
            }
          });

          // Place invalid rows at top
          this.importFinanceDataList = [...invalidRows, ...validRows];
          console.log(this.importFinanceDataList, 'jj');
          this.isImportPopupOpened = true;

          console.log('Parsed Excel Data:', data);
          console.log('Invalid Rows:', invalidRows);

          // 🔹 Hide loader after processing
          this.isLoading = false;
        };

        reader.readAsArrayBuffer(file);
      }

      this.excelInputRef.nativeElement.value = '';
    } catch (error) {
      console.error('Error in Excel processing:', error);
    } finally {
      // 🔹 Ensure loader hides even if error occurs
      this.isLoading = false;
    }
  }

  formatExcelDateToUIDate(value: string): string | null {
    if (!value) return null;

    const parts = value.split(/[\/\-]/);
    if (parts.length !== 3) return null;

    let [day, month, year] = parts.map((p) => p.trim());

    // Handle mm/dd/yyyy misinterpretation
    if (+month > 12 && +day <= 12) {
      [month, day] = [day, month];
    }

    if (year.length === 2) {
      year = +year < 50 ? `20${year}` : `19${year}`;
    }

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10) - 1;
    const yearNum = parseInt(year, 10);

    const date = new Date(Date.UTC(yearNum, monthNum, dayNum));
    if (isNaN(date.getTime())) return null;

    // Format as yyyy-MM-dd
    const formatted = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;

    return formatted;
  }

  displayFacility(item: any): string {
    return item ? `${item.FacilityLicense} - ${item.FacilityName}` : '';
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Finance_data_import_log';
    this.service.exportDataGrid(event, fileName);
  }

  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  disableStatus = (row: any) => {
    const Status = row?.data?.Status;
    console.log(Status, 'status');
    return Status === 'Inactive';
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  toggleFinaceFilterRow = () => {
    this.isViewFilterRowVisible = !this.isViewFilterRowVisible;
  };

  openPopup() {
    this.isAddFormPopupOpened = true;
  }

  CloseExcelForm() {
    this.clearHighlightedHeaders();
    this.isImportPopupOpened = false;
    this.hasError = false;
    this.importedDataSource = [];
  }

  CloseForm() {
    this.isAddFormPopupOpened = false;
    this.dataGrid.instance.refresh();
  }

  onContentReady(e: any) {}

  // Your existing repared method
  onCellPrepared(e: any) {
    const column = this.importFinanceColumnMeta.find(
      (col) => col.dataField === e.column.dataField,
    );

    if (column) {
      const value = e.data[column.dataField];

      // Reset styles for all cells first
      e.cellElement.style.color = '';
      e.cellElement.style.border = '';
      e.cellElement.setAttribute('title', '');

      // Check for mandatory field first
      if (column.IsMandatory && !value) {
        console.log('mandatory');
        e.cellElement.style.border = '2px solid #FFC1C3';
        e.cellElement.style.color = 'red';
        this.hasError = true;

        this.highlightColumnHeader(e.column.headerId);

        // Create a tooltip for mandatory fields
        this.createTooltip(e.cellElement, `Error: This field is required`);
      }

      if (
        column.IsNumeric &&
        value &&
        isNaN(value.toString().replace(/,/g, ''))
      ) {
        e.cellElement.style.border = '2px solid #FFC1C3';
        e.cellElement.style.color = 'red';
        this.highlightColumnHeader(e.column.headerId);
        this.createTooltip(e.cellElement, `Error: Value must be numeric`);
      }

      if (column.dataField === 'FacilityID' && value) {
        const facilityExists = this.selectedFacility.includes(value);

        if (!facilityExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Invalid Facility`);
        }
      }

      if (column.dataField === 'Department' && value) {
        console.log(this.departmentList, 'departmentList');
        console.log(value, 'valueeeeeee');
        const departmentExists = this.departmentList.some(
          (d: any) =>
            d.DEPARTMENT?.toLowerCase().trim() === value.toLowerCase().trim(),
        );
        console.log(departmentExists, 'departmentExists');

        if (!departmentExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Department Not Found`);
        }
      }

      if (column.dataField === 'LedgerCode' && value) {
        const ledgerExists = this.ledgerCodeList.some(
          (d: any) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim(),
        );

        if (!ledgerExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: LedgerCode Not Found`);
        }
      }

      if (column.dataField === 'SubDepartment' && value) {
        const enteredDepartment = e.data['Department']?.trim().toLowerCase();
        const enteredSubDepartment = value.trim().toLowerCase();

        // Check if sub-department exists at all
        const matchedSubDept = this.CPTDepartmentList.find(
          (item: any) =>
            item.SUB_DEPARTMENT?.trim().toLowerCase() === enteredSubDepartment,
        );

        if (!matchedSubDept) {
          // Sub-department not found
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: CPTDepartment Not Found`);
        } else {
          // Sub-department found, now check if it belongs to selected department
          const subDeptDepartment =
            matchedSubDept.DEPARTMENT?.trim().toLowerCase();

          if (enteredDepartment && subDeptDepartment !== enteredDepartment) {
            e.cellElement.style.border = '2px solid #FFC1C3';
            e.cellElement.style.color = 'red';
            this.hasError = true;
            this.highlightColumnHeader(e.column.headerId);
            this.createTooltip(
              e.cellElement,
              `Error: CPTDepartment does not belong to selected Department`,
            );
          }
        }
      }

      if (column.dataField === 'CostType' && value) {
        const costTypeExists = this.costTypeList.some(
          (d: any) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim(),
        );

        if (!costTypeExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: CostType Not Found`);
        }
      }

      if (column.dataField === 'ClinicianID' && value) {
        const clinicianExists = this.clinicianLicenseList.some(
          (d: any) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim(),
        );

        if (!clinicianExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Clinician Not Found`);
        }
      }
    }
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

  onImportPopupClosed() {
    this.clearHighlightedHeaders();
    this.isImportPopupOpened = false;
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

  onSaveClick() {
    if (this.importFinanceDataList.length > 0) {
      this.isLoading = true;

      if (this.hasError) {
        notify(
          {
            message: 'Please fix the validation errors before saving.',
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
        // this.resetFileInput();
        this.isLoading = false;
        this.isSaving = false;
        return;
      }

      this.isSaving = true;
      this.isLoading = true;

      // Generate a unique batch number only once
      const batchNo = (() => {
        const now = new Date();
        const datePart = now.toISOString().replace(/[-:.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
        return `1${datePart}`;
      })();

      // const masterid = this.newImportData.masters;
      let gridData = this.importFinanceDataList;

      const baseData: any = {
        UserID: this.UserID,
        FileName: this.FileName,
        BatchNo: batchNo,
        Action: 1,
      };

      // Function to send chunks of data
      const sendChunk = (chunkData: any[], index: number) => {
        let data = { ...baseData };

        data.data = chunkData;

        // Send chunk to the server
        this.operationService.Insert_Finance_Data_Import(data).subscribe(
          (res: any) => {
            if (res.flag === 1) {
              // console.log(`Chunk ${index} uploaded successfully`);
              if (gridData.length > 0) {
                sendNextChunk(); // Continue with the next chunk
              } else {
                // Call final request with Action: 2 after all chunks are sent
                this.sendFinalRequest(batchNo);
              }
            } else {
              notify(
                {
                  message: 'Import operation failed.',
                  position: { at: 'top right', my: 'top right' },
                  displayTime: 1000,
                },
                'error',
              );
              this.isLoading = false;
              this.isSaving = false;
            }
          },
          (error) => {
            this.handleError(error);
          },
        );
      };

      // Function to send the next chunk of data
      const sendNextChunk = () => {
        const chunkSize = 15000;
        const chunk = gridData.slice(0, chunkSize);
        gridData = gridData.slice(chunkSize);
        sendChunk(
          chunk,
          Math.ceil(gridData.length / chunkSize) -
            Math.ceil(gridData.length / chunkSize),
        );
      };

      // Start sending the first chunk
      sendNextChunk();
    } else {
      notify(
        {
          message: 'Please import your file',
          position: { at: 'top right', my: 'top right' },
          displayTime: 500,
        },
        'error',
      );
      this.isSaving = false;
      this.isLoading = false;
    }
  }

  // New function to handle final request with consistent batchNo
  sendFinalRequest(batchNo: string) {
    const finalData = {
      UserID: this.UserID,
      BatchNo: batchNo,
      FileName: this.FileName,
      Action: 2,
    };

    this.operationService.Insert_Finance_Data_Import(finalData).subscribe(
      (res: any) => {
        if (res.flag === 1) {
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
              message: 'Import operation failed.',
              position: { at: 'top right', my: 'top right' },
              displayTime: 1000,
            },
            'error',
          );
        }
        this.isLoading = false;
        this.isSaving = false;
      },
      (error) => {
        this.handleError(error);
      },
    );
  }

  // Error handler to manage error notifications and state
  handleError(error: any) {
    if (error.status === 0) {
      notify(
        {
          message:
            'Network error: Please check your internet connection and try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
    } else if (error.status === 500) {
      notify(
        {
          message:
            'Server error: Unable to process the request right now. Please try again later.',
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
    // this.isSaving = false;
    // this.isLoading = false;
  }

  close() {
    this.isImportPopupOpened = false;
    this.hasError = false;
    this.dataGrid.instance.refresh();
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
    DxLoadPanelModule,
    DxTagBoxModule,
    DxValidationGroupModule,
    DxValidatorModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [FinanceDataComponent],
})
export class FinanceDataModule {}
