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
import { BrowserModule } from '@angular/platform-browser';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxLoadPanelModule,
  DxProgressBarModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTemplateModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { ChangeDetectorRef } from '@angular/core';
import * as XLSX from 'xlsx';
import notify from 'devextreme/ui/notify';
import { Router } from '@angular/router';
import * as pako from 'pako';
import { debounce } from 'lodash';

@Component({
  selector: 'app-import-master-data-form',
  templateUrl: './import-master-data-form.component.html',
  styleUrls: ['./import-master-data-form.component.scss'],
})
export class ImportMasterDataFormComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;
  @Output() closeForm = new EventEmitter();
  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isSaving: boolean = false; // Add a flag to control the Save button
  gridLoading: boolean = false; // Flag for grid loading

  importOptions = [
    { text: 'Import only new records', value: true },
    { text: 'Overwrite existing records', value: false },
  ];

  selectedImportOption: boolean = true; // Default selection
  masterList = [];

  clinicianColumns = []; // Clinician columns
  denialColumns = []; // Denial columns
  insuranceColumns = []; // Insurance columns
  cptColumns = []; // CPT columns
  departmentColumns = [];
  chartOfAccountsColumns = [];
  gridColumns = []; // DataGrid columns
  gridData = []; // DataGrid DataSource
  columns: any[];
  isColumnsLoaded: boolean = false;
  hasError: boolean = false;
  UserID: any;
  isLoading: boolean = false;
  beforeLoading: boolean = false;
  departmentList: any;
  CPTDepartmentList: any;
  costDepartmentList: any;
  CostBucketList: any;
  MainGroupList: any;
  CostTypeList: any;

  importData: any = {
    masters: '',
  };

  newImportData = this.importData;
  constructor(
    private service: MasterReportService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.UserID = sessionStorage.getItem('UserID');
  }
  getNewImportData = () => ({ ...this.newImportData });

  ngOnInit(): void {
    this.selectedImportOption = true;
    this.getImportingMasterList();
    this.getDepartmentList();
    this.getCPTDepartmentList();
    this.getCostingDepartmentList();
    this.getCostBucketList();
    this.getMainGroupList();
    this.getCostTypeList();
  }

  getCostingDepartmentList() {
    this.service.Get_GropDown('COST_DEPARTMENT').subscribe((response: any) => {
      this.costDepartmentList = response;
    });
  }

  getDepartmentList() {
    this.service.getDepartmentData().subscribe((res: any) => {
      this.departmentList = res.datas;
    });
  }

  getCPTDepartmentList() {
    this.service.getSubDepartmentData().subscribe((res: any) => {
      this.CPTDepartmentList = res.datas;
    });
  }

  getCostBucketList() {
    this.service.Get_GropDown('COST_BUCKET').subscribe((res: any) => {
      this.CostBucketList = res;
      console.log(this.CostBucketList, '++++++++++++++++++++++');
    });
  }

  getMainGroupList() {
    this.service.Get_GropDown('MAIN_GROUP').subscribe((res: any) => {
      this.MainGroupList = res;
      console.log(this.MainGroupList, '++++++++++++++++++++++');
    });
  }

  getCostTypeList() {
    this.service.Get_GropDown('COST_TYPE').subscribe((res: any) => {
      this.CostTypeList = res;
    });
  }

  // Your existing onCellPrepared method
  onCellPrepared(e: any) {
    console.log(e);
    const column = this.columns.find(
      (col) => col.dataField === e.column.dataField
    );

    //get all column datafield
    const datafieldColumns = this.columns.map((col) => col.dataField);
    console.log(datafieldColumns);

    if (column) {
      const value = e.data[column.dataField];

      // Reset styles for all cells first
      e.cellElement.style.color = '';
      e.cellElement.style.border = '';
      e.cellElement.setAttribute('title', ''); // Clear the title attribute

      // Check for mandatory field first
      if (column.IsMandatory && !value) {
        console.log('mandatory');
        e.cellElement.style.border = '2px solid #FFC1C3'; // Style for mandatory error
        e.cellElement.style.color = 'red'; // Color for mandatory error
        this.hasError = true;

        // Highlight the corresponding column header
        this.highlightColumnHeader(e.column.headerId);

        // Create a tooltip for mandatory fields
        this.createTooltip(e.cellElement, `Error: This field is required`);
      }

      // Numeric Field Check
      if (
        column.IsNumeric &&
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        if (isNaN(Number(value))) {
          console.log('Non-numeric value in numeric field', value);
          e.cellElement.style.border = '2px solid #FFC1C3'; // Style for numeric error
          e.cellElement.style.color = 'red'; // Color for numeric error
          this.hasError = true;

          // Highlight the corresponding column header
          this.highlightColumnHeader(e.column.headerId);

          // Create a tooltip for numeric error
          this.createTooltip(e.cellElement, `Error: Value must be numeric`);
        }
      }

      // Check if the value exceeds the maximum length
      if (value && value.length > column.MaxLength) {
        console.log(value.length, 'length', column.MaxLength, 'maxlength');
        e.cellElement.style.border = '2px solid #FFC1C3'; // Style for max length error
        this.hasError = true;

        // Highlight the corresponding column header
        this.highlightColumnHeader(e.column.headerId);

        // Create a tooltip for max length
        this.createTooltip(
          e.cellElement,
          `Error:Value exceeds maximum length of ${column.MaxLength}`
        );
      }

      // Proceed only if both 'CPTCode' and 'Department' columns exist
      const hasCPTCode = datafieldColumns.includes('CPTCode');
      const hasDepartment = datafieldColumns.includes('Department');

      if (
        hasCPTCode &&
        hasDepartment &&
        column?.dataField === 'Department' &&
        value
      ) {
        const departmentExists = this.departmentList.some(
          (d) =>
            d.DEPARTMENT?.toLowerCase().trim() === value.toLowerCase().trim()
        );

        if (!departmentExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Department Not Found`);
        }
      }


      const hasClinicianLicense = datafieldColumns.includes('ClinicianLicense');
      const hasClinicianDepartment = datafieldColumns.includes('Department');

      if (
        hasClinicianLicense &&
        hasClinicianDepartment &&
        column?.dataField === 'Department' &&
        value
      ) {
        const departmentExists = this.departmentList.some(
          (d) =>
            d.DEPARTMENT?.toLowerCase().trim() === value.toLowerCase().trim()
        );

        if (!departmentExists) {
          e.cellElement.style.border = '2px solid #FFC1C3';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Department Not Found`);
        }
      }



      const costingDepartment = e.data['CostingDepartment'];

      console.log(costingDepartment, 'costingDepartment');

      if (
        column.dataField === 'Department' &&
        costingDepartment === 'CPT Department' &&
        !value
      ) {
        console.log('working!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        e.cellElement.style.border = '2px solid #FFC1C3';
        e.cellElement.style.color = 'red';
        this.hasError = true;
        this.highlightColumnHeader(e.column.headerId);
        this.createTooltip(
          e.cellElement,
          `Error: Department is required when CostingDepartment is 'CPT Department'`
        );
      }

      if (column.dataField === 'CostingDepartment' && value) {
        const CostDepartmentExists = this.costDepartmentList.some(
          (d) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
        );

        if (!CostDepartmentExists) {
          e.cellElement.style.border = '2px solid red';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(
            e.cellElement,
            `Error: Costing Department Not Found`
          );
        }
      }

      if (column.dataField === 'CostBucket' && value) {
        const CostBucketExists = this.CostBucketList.some(
          (d) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
        );

        if (!CostBucketExists) {
          e.cellElement.style.border = '2px solid red';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Cost Bucket Not Found`);
        }
      }

      if (column.dataField === 'MainGroup' && value) {
        const MainGroupExists = this.MainGroupList.some(
          (d) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
        );

        if (!MainGroupExists) {
          e.cellElement.style.border = '2px solid red';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Main Group Not Found`);
        }
      }

      if (column.dataField === 'CostType' && value) {
        const CostTypeExists = this.CostTypeList.some(
          (d) =>
            d.DESCRIPTION?.toLowerCase().trim() === value.toLowerCase().trim()
        );

        if (!CostTypeExists) {
          e.cellElement.style.border = '2px solid red';
          e.cellElement.style.color = 'red';
          this.hasError = true;
          this.highlightColumnHeader(e.column.headerId);
          this.createTooltip(e.cellElement, `Error: Cost Type Not Found`);
        }
      }
    }
  }

  highlightColumnHeader(headerId: string) {
    const headerCell = document.getElementById(headerId);
    console.log(headerCell, 'headercell');

    if (headerCell) {
      headerCell.style.backgroundColor = '#FFC1C3'; // Highlight color for mandatory headers
      headerCell.style.color = '#FF0000';
      // headerCell.style.color = "red"; // Change header text color if desired
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

  // Function to trigger file input when the "Import" button is clicked
  selectFile() {
    this.fileInput.nativeElement.click();
  }

  // Function to handle file selection and read the Excel file
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.beforeLoading = true;
      this.hasError = false;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;

        // Use XLSX to process the array buffer
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
          type: 'array',
        });

        // Assume the first sheet contains the data
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get the headers from the uploaded sheet (first row as headers)
        const uploadedHeaders = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        })[0];

        // Get the captions of the grid's columns
        const gridColumnsCaptions = this.gridColumns.map((col) => col.caption); // Ensure gridColumns is available
        const gridColumnsFields = this.gridColumns.map((col) => col.dataField); // DataFields

        // Check if the imported file's headers match the grid's column captions
        const isCorrectTemplate = gridColumnsCaptions.every(
          (caption, index) => uploadedHeaders[index] === caption
        );

        if (!this.newImportData.masters) {
          notify({
            message: 'Error: Please select a Master before importing the file.',
            type: 'error',
            displayTime: 1000,
            position: 'top right',
          });
          this.resetFileInput();
          this.beforeLoading = false;
          return;
        }

        if (!isCorrectTemplate) {
          // Show error notification if the imported template columns don't match the grid columns
          notify({
            message: 'Error: Column count or names do not match.',
            type: 'error',
            displayTime: 1000,
            position: 'top right',
          });
          this.beforeLoading = false;
          this.resetFileInput();
          return;
        }

        // Convert the sheet to JSON if the template is correct
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
          notify({
            message: 'Error: The file does not contain any data.',
            type: 'error',
            displayTime: 1000,
            position: 'top right',
          });
          this.beforeLoading = false;
          this.resetFileInput();
        } else {
          // Map the data to match the grid's dataField structure
          const mappedData = data.map((row) => {
            const mappedRow: any = {};
            gridColumnsFields.forEach((field, index) => {
              // Use the grid column captions to get the corresponding values from the row
              const captionIndex = gridColumnsCaptions.indexOf(
                uploadedHeaders[index]
              );
              mappedRow[field] = row[uploadedHeaders[captionIndex]]; // Assign the value to the correct dataField
            });
            return mappedRow;
          });

          this.dataGrid.instance.refresh();
          this.gridData = mappedData;
          this.beforeLoading = false;
          console.log('Grid data:', this.gridData);
          this.validateMandatoryFields();
          // Validate mandatory fields after data is loaded
          //  this.validateMandatoryFields();
        }
      };

      // Read the file as an ArrayBuffer
      reader.readAsArrayBuffer(file);
    } else {
      console.error('No file selected');
    }
  }

  validateMandatoryFields() {
    let isAnyFieldMissing = false; // Flag to check if any mandatory field is missing

    this.gridData.forEach((row) => {
      this.columns.forEach((col) => {
        if (col.validationRules?.some((rule) => rule.type === 'required')) {
          if (!row[col.dataField]) {
            console.error(`Missing data for mandatory field: ${col.dataField}`);
            isAnyFieldMissing = true; // Set flag to true if any mandatory field is missing
          }
        }
      });
    });
  }

  getImportingMasterList() {
    this.service.get_Importing_Master_List().subscribe((res: any) => {
      this.masterList = res.Master;
      this.clinicianColumns = res.Clinician;
      this.denialColumns = res.Denial;
      this.insuranceColumns = res.Insurance;
      this.cptColumns = res.Cpt;
      this.departmentColumns = res.Department;
      this.chartOfAccountsColumns = res.chartOfAccounts;
    });
  }

  downloadTemplate() {
    if (!this.columns || this.columns.length === 0) {
      console.error('No columns available to download');
      return;
    }

    // Get column headers (captions)
    const headers = this.columns.map((col) => col.caption);

    // Create a new worksheet and append headers as the first row
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Download the Excel file
    XLSX.writeFile(workbook, 'masters_template.xlsx');
  }

  // Function to handle Master Selection
  onMasterSelected(event: any) {
    this.resetFileInput();

    const selectedMasterId = event.value;

    if (selectedMasterId === null) {
      // Clear columns when clear button is clicked
      this.gridColumns = [];
      this.gridData = [];
      this.columns = [];
      this.isColumnsLoaded = false;
      this.cdr.detectChanges(); // Trigger change detection if necessary
      return;
    }

    // Load columns and data based on the selected master
    switch (selectedMasterId) {
      case 1: // Clinician Master
        this.gridColumns = this.clinicianColumns.map((col) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          IsNumeric: col.IsNumeric,
          MaxLength: col.MaxLength,
          IsMandatory: col.IsMandatory,
        }));
        break;
      case 2: // Denial Master
        this.gridColumns = this.denialColumns.map((col) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          IsNumeric: col.IsNumeric,
          MaxLength: col.MaxLength,
          IsMandatory: col.IsMandatory,
        }));
        break;
      case 3: // Insurance Master
        this.gridColumns = this.insuranceColumns.map((col) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          IsNumeric: col.IsNumeric,
          MaxLength: col.MaxLength,
          IsMandatory: col.IsMandatory,
        }));
        break;
      case 4: // CPT Master
        this.gridColumns = this.cptColumns.map((col) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          IsNumeric: col.IsNumeric,
          MaxLength: col.MaxLength,
          IsMandatory: col.IsMandatory,
        }));

        break;

      case 5: // CPT Master
        this.gridColumns = this.departmentColumns.map((col) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          IsNumeric: col.IsNumeric,
          MaxLength: col.MaxLength,
          IsMandatory: col.IsMandatory,
        }));

        break;

      case 6: // Chart of accounts
        this.gridColumns = this.chartOfAccountsColumns.map((col) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          IsNumeric: col.IsNumeric,
          MaxLength: col.MaxLength,
          IsMandatory: col.IsMandatory,
        }));

        break;
    }
    // Reassign the columns array with a new reference
    this.columns = [...this.gridColumns]; // Create a new array reference
    console.log(this.columns, 'columns');

    this.isColumnsLoaded = true;

    // Trigger change detection
    this.cdr.detectChanges();

    // Set relevant data source (if needed)
    this.gridData = []; // Adjust based on your data source
  }

  onSaveClick() {
    if (this.gridData.length > 0) {
      this.isLoading = true;

      if (this.hasError) {
        notify(
          {
            message: 'Please fix the validation errors before saving.',
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
        this.resetFileInput();
        this.isLoading = false;
        this.isSaving = false;
        return;
      }

      this.isSaving = true;

      // Generate a unique batch number only once
      const batchNo = (() => {
        const now = new Date();
        const datePart = now.toISOString().replace(/[-:.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
        return `1${datePart}`;
      })();

      const masterid = this.newImportData.masters;
      let gridData = this.gridData;

      const baseData: any = {
        MasterID: masterid,
        UserID: this.UserID,
        NewRecordOnly: this.selectedImportOption,
        BatchNo: batchNo,
        Action: 1,
      };

      // Function to send chunks of data
      const sendChunk = (chunkData: any[], index: number) => {
        let data = { ...baseData };

        switch (masterid) {
          case 1:
            data.import_clinician = chunkData;
            break;
          case 2:
            data.import_Denial = chunkData;
            break;
          case 3:
            data.import_Insurance = chunkData;
            break;
          case 4:
            data.import_cpt = chunkData;
            break;
          case 5:
            data.import_department = chunkData;
            break;
          case 6:
            data.import_chartOfAccounts = chunkData;
            break;
          default:
            notify(
              {
                message: 'Invalid master ID selected.',
                position: { at: 'top right', my: 'top right' },
              },
              'error'
            );
            this.isSaving = false;
            this.isLoading = false;
            return;
        }

        console.log(`Sending chunk ${index}:`, data);

        // Send chunk to the server
        this.service.Insert_Imported_Data(data).subscribe(
          (res: any) => {
            if (res.flag === 1) {
              console.log(`Chunk ${index} uploaded successfully`);
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
                'error'
              );
              this.isLoading = false;
              this.isSaving = false;
            }
          },
          (error) => {
            this.handleError(error);
          }
        );
      };

      // Function to send the next chunk of data
      const sendNextChunk = () => {
        const chunkSize = 15000;
        const chunk = gridData.slice(0, chunkSize);
        gridData = gridData.slice(chunkSize);
        sendChunk(
          chunk,
          Math.ceil(this.gridData.length / chunkSize) -
            Math.ceil(gridData.length / chunkSize)
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
        'error'
      );
      this.isSaving = false;
      this.isLoading = false;
    }
  }

  // New function to handle final request with consistent batchNo
  sendFinalRequest(batchNo: string) {
    const finalData = {
      MasterID: this.newImportData.masters,
      UserID: this.UserID,
      NewRecordOnly: this.selectedImportOption,
      BatchNo: batchNo,
      Action: 2,
    };

    this.service.Insert_Imported_Data(finalData).subscribe(
      (res: any) => {
        if (res.flag === 1) {
          notify(
            {
              message: 'Data imported successfully.',
              position: { at: 'top right', my: 'top right' },
              displayTime: 1000,
            },
            'success'
          );
          this.close();
        } else {
          notify(
            {
              message: 'Import operation failed.',
              position: { at: 'top right', my: 'top right' },
              displayTime: 1000,
            },
            'error'
          );
        }
        this.isLoading = false;
        this.isSaving = false;
      },
      (error) => {
        this.handleError(error);
      }
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
        'error'
      );
    } else if (error.status === 500) {
      notify(
        {
          message:
            'Server error: Unable to process the request right now. Please try again later.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    } else {
      notify(
        {
          message: 'Failed to import data. Please try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    }
    console.error('Error during data import:', error);
    this.isSaving = false;
    this.isLoading = false;
  }

  close() {
    this.clearData();
    this.closeForm.emit();
  }

  clearData() {
    this.hasError = false;
    this.isSaving = false;
    this.isLoading = false;
    this.newImportData.masters = '';
    this.gridData = [];
    this.gridColumns = [];
    this.selectedImportOption = true;
    this.isColumnsLoaded = false;
  }

  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ''; // This will reset the input
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxSelectBoxModule,
    DxTemplateModule,
    DxTextBoxModule,
    DxButtonModule,
    DxDataGridModule,
    DxValidatorModule,
    DxProgressBarModule,
    BrowserModule,
    DxTooltipModule,
    DxRadioGroupModule,
    DxLoadPanelModule,
  ],
  providers: [],
  declarations: [ImportMasterDataFormComponent],
  exports: [ImportMasterDataFormComponent],
})
export class ImportMasterDataFormModule {}
