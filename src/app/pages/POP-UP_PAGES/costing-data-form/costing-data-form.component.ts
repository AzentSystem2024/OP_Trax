import { CommonModule } from '@angular/common';
import { Component, Input, NgModule, OnInit, ViewChild } from '@angular/core';
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
  DxValidationGroupModule,
  DxDateRangeBoxModule,
  DxDateBoxModule,
  DxDataGridComponent,
  DxLoadPanelModule,
} from 'devextreme-angular';
import {
  FormTextboxModule,
  FormPhotoUploaderModule,
  FormPopupModule,
} from 'src/app/components';
import notify from 'devextreme/ui/notify';
import { OperationReportService } from '../../OPERATION PAGES/operation-report.service';
import { DataSource } from 'devextreme/common/data';
import { switchMap, tap } from 'rxjs/operators';
import { EMPTY, Subscription } from 'rxjs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import { NotificationService } from 'src/app/services/notification.service';
@Component({
  selector: 'app-costing-data-form',
  templateUrl: './costing-data-form.component.html',
  styleUrls: ['./costing-data-form.component.scss'],
})
export class CostingDataFormComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid!: DxDataGridComponent;

  @Input() selectedRowData: any = null;

  //pagination side
  readonly allowedPageSizes = [25, 50, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  facilityValue: any;
  fromDate: any;
  toDate: any;
  processID: any;

  GridDataSource!: DataSource<any>;
  GridData: any[] = [];

  columnsConfig: any;
  summaryColumnsData: any;

  bandColorsMap: any = {};
  columnToBandMap: Record<string, string> = {};

  loadingVisible: boolean = false;
  showXmlPopup: boolean = false;
  xmlGridData: any;
  xmlData: any;
  uploadOptions = [
    { text: 'Test Upload', value: true },
    { text: 'Production Upload', value: false },
  ];

  uploadMode = true;
  XmlFileName: any;
  selectedXmlRow: any;
  focusedRowKey: any = null;
  showXmlDetailsPopup: boolean = false;

  selectedRowKeys: any[] = [];
  selectedRowsData: any[] = [];

  totalCount = 0;
  completedCount = 0;
  failedCount = 0;
  isUploading = false;

  isCancelled: boolean = false;
  currentRequest?: Subscription;

  isSingleClaimDetailsVisible: boolean = false;
  clickedCellRowData: any;
  clickedCellDetails: {
    column: any;
    band: any;
    caption: any;
    value: any;
    isOverhead: any;
    costBucket: any;
    costType: any;
    rowData: any;
  } = {
    column: null,
    band: null,
    caption: null,
    value: null,
    isOverhead: null,
    costBucket: null,
    costType: null,
    rowData: null,
  };
  costingPopupData: any;
  isCostingPopupVisible: boolean = false;
  facilityName: any;
  clickedrowData: any;

  isxmlEditMode: boolean = false;
  originalXmlBeforeEdit: any;

  IsReprocess: boolean = false;
  regenerateLoadingVisible: boolean = false;

  constructor(
    private operationService: OperationReportService,
    private notificationService: NotificationService,
  ) {}

  get gridHeight() {
    return this.xmlGridData && this.xmlGridData.length <= 10 ? '85vh' : '85vh';
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.selectedRowData) {
        this.facilityValue = this.selectedRowData.FacilityID;
        this.facilityName = this.selectedRowData.FacilityName;
        this.fromDate = this.selectedRowData.PeriodFrom;
        this.toDate = this.selectedRowData.PeriodTo;
        this.processID = this.selectedRowData.ID;
        this.IsReprocess = this.selectedRowData.IsReprocess;

        const now = new Date();

        this.fetch_costView_Report();
      } else {
        notify(
          {
            message: `An error occurred while fetching the data. Please try again later.`,
            position: { at: 'top right', my: 'top right' },
            displayTime: 3000,
          },
          'error',
        );
        this.loadingVisible = false;
      }
    }, 50);
  }

  // ============ fetch datasource for the grid ===========
  fetch_costView_Report(): void {
    this.dataGrid.instance.beginCustomLoading('Data Loading.....');

    if (!this.processID) {
      this.loadingVisible = false;
      return;
    }

    this.operationService.get_costView_Report_Data(this.processID).subscribe(
      (response: any) => {
        this.loadingVisible = false;

        if (response.flag === '1') {
          const userLocale = navigator.language || 'en-US';

          this.summaryColumnsData = this.generateSummaryColumns(
            response.reportColumns,
          );
          this.columnsConfig = this.generateColumnsConfig(
            response.reportColumns,
            userLocale,
          );

          this.GridData = response.data;
          this.GridDataSource = new DataSource<any>({
            load: () => Promise.resolve(this.GridData),
          });

          if (this.dataGrid?.instance) {
            this.dataGrid.instance.refresh();
            this.dataGrid.instance.endCustomLoading();
          }
        } else {
          notify(
            {
              message: response.message,
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      },
      () => {
        this.loadingVisible = false;
        this.dataGrid.instance.endCustomLoading();
        notify(
          {
            message:
              'An error occurred while fetching the data. Please try again later.',
            position: { at: 'top right', my: 'top right' },
            displayTime: 3000,
          },
          'error',
        );
      },
    );
  }

  //======= generate column data =======
  generateColumnsConfig(reportColumns: any[], userLocale: string) {
    const bandedColumns: any = {};
    const normalColumns: any = [];
    const bandColors: any = {};
    const columnToBand: Record<string, string> = {};
    const colorPalette = [
      '#FFB6A6', // Light Coral
      '#A7E9AF', // Soft Green
      '#A6C9FF', // Soft Blue
      '#F4A6D7', // Light Pink
      '#FFE8A1', // Pastel Yellow
      '#C2E0F4', // Soft Cyan
      '#E8C2F4', // Light Lavender
    ];

    reportColumns.forEach((column, index) => {
      let columnFormat;

      if (column.Type === 'DateTime') {
        columnFormat = {
          type: 'date',
          formatter: (date: Date) =>
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
          formatter: (value: number) =>
            new Intl.NumberFormat(userLocale, {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value / 100),
        };
      }

      const columnObj = {
        dataField: column.Name,
        caption: column.Title,
        visible: column.Visibility,
        type: column.Type,
        format: columnFormat,
      };

      if (column.Band) {
        if (!bandColors[column.Band]) {
          bandColors[column.Band] =
            colorPalette[Object.keys(bandColors).length] ||
            colorPalette[colorPalette.length - 1];
        }

        if (!bandedColumns[column.Band]) {
          bandedColumns[column.Band] = {
            Band: column.Band,
            columns: [],
            color: bandColors[column.Band], // Store band color
          };
        }

        bandedColumns[column.Band].columns.push(columnObj);
        columnToBand[column.Name] = column.Band; // Map child column to band
      } else {
        normalColumns.push(columnObj);
      }
    });

    this.bandColorsMap = bandColors; // Store band colors
    this.columnToBandMap = columnToBand; // Store child column mapping

    return [...normalColumns, ...Object.values(bandedColumns)];
  }

  //====== finding summary columns and summary format ======
  generateSummaryColumns(reportColumns: any[]) {
    const decimalColumns = reportColumns.filter(
      (col) => col.Type === 'Decimal' && col.Summary,
    );

    const intColumns = reportColumns.filter(
      (col) => col.Type === 'Int32' && col.Summary,
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

  // =========== Custom summary item with same smart decimal logic ==========
  createSummaryItem(
    col: any,
    isGroupItem = false,
    summaryType = 'sum',
    formatType: string,
  ) {
    return {
      column: col.Name,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? 'Count: {0}' : '{0}',
      valueFormat:
        formatType === 'decimal'
          ? {
              formatter: (value: number) => {
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
              formatter: (value: any) =>
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

  //===== making header colur differently =====
  onCellPrepared(e: any) {
    if (e.rowType === 'header' && e.column) {
      const columnName = e.column.dataField;
      const bandName = e.column.caption;
      let bandColor = this.bandColorsMap[bandName];

      if (!bandColor && this.columnToBandMap[columnName]) {
        bandColor = this.bandColorsMap[this.columnToBandMap[columnName]];
      }
      if (bandColor) {
        let borderColor = getComputedStyle(
          document.documentElement,
        ).getPropertyValue('--border-color');

        let textColor = getComputedStyle(
          document.documentElement,
        ).getPropertyValue('--text-color');

        e.cellElement.style.backgroundColor = bandColor;
        e.cellElement.style.color = textColor;
        e.cellElement.style.border = `1px solid ${borderColor}`;
      }
    }
  }

  // ======= cpt code and ordering clinician edit function ============
  Costing_Details_onCellClick(e: any) {
    if (!e.column || e.rowType !== 'data' || e.event?.detail !== 2) return;
    if (e.rowType === 'group') return;

    const dataField = e.column.dataField;
    const rowData = e.data;

    const showError = (message: string) => {
      notify(message, 'error', 3000);
    };

    // ===== Band + caption detection =====
    const bandCaption = this.columnToBandMap[dataField] || null;
    const cellCaption = e.column.caption;

    let isOverhead: number | null = null; // Changed to number
    let costBucket: any = null;
    let costType: any = null;

    if (bandCaption === 'Direct Cost Bucket') {
      isOverhead = 0; // Direct cost = 0
      costBucket = cellCaption;
    } else if (bandCaption === 'Overhead Cost Bucket') {
      isOverhead = 1;
      costBucket = cellCaption;
    } else if (bandCaption === 'Cost Type') {
      isOverhead = null;
      costBucket = null;
      costType = cellCaption;
    }

    // ===== Store full clicked cell details =====
    this.clickedCellDetails = {
      column: dataField,
      band: bandCaption,
      caption: cellCaption,
      value: rowData[dataField],
      isOverhead: isOverhead,
      costBucket: costBucket,
      costType: costType,
      rowData: rowData,
    };

    // ===== Action based on what was clicked =====
    if (dataField === 'ClaimNumber') {
      this.clickedCellRowData = rowData;
      this.isSingleClaimDetailsVisible = true;
      return;
    }

    // ===== Prepare payload dynamically based on band =====
    const payload = {
      ClaimUID: rowData?.ClaimUID || 0,
      CostType: costType,
      CostBucket: costBucket,
      IsOverhead: isOverhead,
    };

    // ===== Call API if clicked cell belongs to a band =====
    if (bandCaption) {
      console.log('Payload for API:', payload);

      this.operationService
        .get_clinical_costing_data_popup_data(payload)
        .subscribe({
          next: (res: any) => {
            if (res?.flag === '1') {
              this.costingPopupData = res.data;
              this.isCostingPopupVisible = true;
            } else {
              showError('No data found for this cell');
            }
          },
          error: (err) => {
            console.error('API error:', err);
            showError('Failed to fetch costing data');
          },
        });
    }
  }

  // ======= Xml popup Data fetching =======
  generateXmlContent() {
    const inputData = {
      ProcessID: this.processID,
      IsTrial: this.uploadMode,
    };

    this.loadingVisible = true;

    this.operationService
      .generate_XML_Data(inputData)
      .pipe(
        switchMap((response: any) => {
          if (response.flag === '1') {
            return this.loadGeneratedXmlData(); // ⬅️ separate function call
          } else {
            this.loadingVisible = false;
            notify(
              { message: response.message, position: 'top right' },
              'error',
            );
            return EMPTY;
          }
        }),
        tap(() => (this.loadingVisible = false)),
      )
      .subscribe({
        next: (res: any) => {
          if (res.flag) {
            this.xmlGridData = res.data;
            this.showXmlPopup = true;
          } else {
            notify({ message: res.message, position: 'top right' }, 'error');
          }
        },
        error: () => {
          this.loadingVisible = false;
          notify(
            { message: 'Failed to load XML data.', position: 'top right' },
            'error',
          );
        },
      });
  }

  // ===== separate function for fetching XML data =====
  loadGeneratedXmlData() {
    return this.operationService.fetch_generated_XML_Data(this.processID);
  }

  // ==== Handle details icon click to open XML details popup ====
  onDetailsClick = (e: any) => {
    this.clickedrowData = e.row?.data;
    console.log('clikced row data::>>', this.clickedrowData);
    const payload = { XMLFileID: this.clickedrowData.XMLFileID };
    this.operationService
      .get_clicked_Row_Xml_data(payload)
      .subscribe((res: any) => {
        if (res.flag === '1') {
          this.openXmlDetails(res);
        }
      });
  };

  openXmlDetails(row: any) {
    this.selectedXmlRow = row;
    if (this.selectedXmlRow) {
      this.xmlData = this.selectedXmlRow.XMLData;

      const dispositionValue = this.uploadMode ? 'TEST' : 'PRODUCTION';
      this.xmlData = this.xmlData.replace(
        /<DispositionFlag>.*<\/DispositionFlag>/,
        `<DispositionFlag>${dispositionValue}</DispositionFlag>`,
      );
    }

    this.XmlFileName = this.clickedrowData.XMLFileName;
    this.focusedRowKey = this.clickedrowData.XMLFileName;
    this.showXmlDetailsPopup = true;
  }
  // ======= regenerate xml data ========
  onRegenerateExcel() {
    this.regenerateLoadingVisible = true;
    const userid = sessionStorage.getItem('UserID');
    const payload = {
      UserID: userid,
      XMLFileID: this.clickedrowData.XMLFileID,
      ProcessID: this.processID,
    };
    this.operationService.regenerate_Row_Xml_data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          const payload2 = { XMLFileID: this.clickedrowData.XMLFileID };

          this.operationService.get_clicked_Row_Xml_data(payload2).subscribe({
            next: (res2: any) => {
              if (res2.flag === '1') {
                this.openXmlDetails(res2);
              }
              this.regenerateLoadingVisible = false;
            },
            error: () => {
              this.regenerateLoadingVisible = false;
            },
          });
        } else {
          this.regenerateLoadingVisible = false;
        }
      },
      error: () => {
        this.regenerateLoadingVisible = false;
      },
    });
  }
  // ======== edit xml data =========
  onEditXml() {
    this.originalXmlBeforeEdit = this.xmlData;
    this.isxmlEditMode = true;
  }

  // ======== cancel edit xml data =========
  onCancelEditXml() {
    // Revert changes
    this.xmlData = this.originalXmlBeforeEdit;
    this.isxmlEditMode = false;
  }

  // =========== update edited xml data ============
  onUpdateXmlData() {
    const userid = sessionStorage.getItem('UserID');

    const payload = {
      UserID: userid,
      XMLFileID: this.clickedrowData.XMLFileID,
      XMLData: this.xmlData,
    };

    this.operationService.update_clicked_Row_Xml_data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          notify(
            {
              message: 'XML updated successfully!',
              type: 'success',
              displayTime: 2000,
            },
            { position: 'top right' },
          );
          const payload = { XMLFileID: this.clickedrowData.XMLFileID };
          this.operationService
            .get_clicked_Row_Xml_data(payload)
            .subscribe((res: any) => {
              if (res.flag === '1') {
                this.openXmlDetails(res);
              }
            });
          this.isxmlEditMode = false;
        } else {
          notify(
            {
              message: res.message || 'Update failed. Please try again.',
              type: 'warning',
              displayTime: 2500,
            },
            { position: 'top right' },
          );
        }
      },
      error: (err) => {
        console.error('Error updating XML:', err);
        notify(
          {
            message: 'An error occurred while updating. Please try later.',
            type: 'error',
            displayTime: 3000,
          },
          { position: 'top right' },
        );
      },
    });
  }

  onPopupHidden() {
    this.isxmlEditMode = false;
    this.clickedrowData = null;
    this.showXmlDetailsPopup = false;
    this.xmlData = '';
  }

  // ===== popup closed =====
  onPopupClosed() {
    this.XmlFileName = '';
    this.xmlData = '';
    this.uploadMode = true;
    this.xmlGridData = [];
  }

  // ==== download xml file to system ====
  downloadXmlFile() {
    if (!this.xmlData || !this.XmlFileName) {
      notify({
        message: 'No XML data to download.',
        type: 'warning',
        displayTime: 2000,
        position: 'top right',
      });
      return;
    }

    const blob = new Blob([this.xmlData], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = this.XmlFileName;
    link.click();
    window.URL.revokeObjectURL(link.href); // cleanup
  }

  //======= dropdown value selection changed =======
  onSelectionChanged(e: any) {
    const validRows = e.selectedRowsData.filter((row: any) =>
      this.isRowSelectable(row),
    );
    this.selectedRowsData = validRows;
    this.selectedRowKeys = validRows.map((row: any) => row.XMLFileName);
    if (this.selectedRowKeys.length !== e.selectedRowKeys.length) {
      e.component.selectRows(this.selectedRowKeys, false);
    }
  }

  //======= Row validation logic =======
  isRowSelectable(row: any): boolean {
    const isTestSuccess =
      row.TestUpload &&
      row.TestUpload.toString().toLowerCase().includes('success');
    const isProdSuccess =
      row.ProductionUpload &&
      row.ProductionUpload.toString().toLowerCase().includes('success');

    if (this.uploadMode === true) {
      return !isTestSuccess;
    } else {
      return isTestSuccess && !isProdSuccess;
    }
  }

  // =========== xml datagrid clearing on changing value of upload type =======
  onUploadModeChanged() {
    this.clearSelection();
  }

  // ===== Upload handler =====
  uploadXmlFile() {
    if (!this.selectedRowsData.length) {
      alert('Please select at least one row before uploading!');
      return;
    }

    const userId = sessionStorage.getItem('UserID');
    this.totalCount = this.selectedRowsData.length;
    this.completedCount = 0;
    this.failedCount = 0;
    this.isUploading = true;
    this.isCancelled = false;
    this.currentRequest = undefined;

    this.uploadNextFile(0, userId);
  }

  // ===== Upload logic with cancel check =====
  uploadNextFile(index: number, userId: string | null) {
    if (index >= this.selectedRowsData.length) {
      this.refreshXmlGrid();
      return;
    }

    const row = this.selectedRowsData[index];
    const dispositionValue = this.uploadMode ? 'TEST' : 'PRODUCTION';
    // const updatedXML = row.XMLData.replace(
    //   /<DispositionFlag>.*<\/DispositionFlag>/,
    //   `<DispositionFlag>${dispositionValue}</DispositionFlag>`
    // );

    const payload = {
      FacilityID: this.facilityValue,
      // FileContent: updatedXML,
      FileName: row.XMLFileName,
      UserID: userId,
      ProcessID: row.ProcessID,
      XMLFileID: row.XMLFileID,
      UploadType: this.uploadMode ? 'test' : 'production',
    };

    console.log(
      `Uploading ${index + 1}/${this.totalCount}: ${row.XMLFileName}`,
    );

    this.currentRequest = this.operationService
      .upload_XML_Data(payload)
      .subscribe({
        next: (res: any) => {
          if (res.flag === '1') {
            this.completedCount++;
          } else {
            this.failedCount++;
            if (this.failedCount === this.totalCount) {
              this.refreshXmlGrid();
              return;
            }

            // Single record special case
            if (this.totalCount === 1) {
              this.finishUpload(res.message || 'Upload failed.', 'error');
              this.refreshXmlGrid();
              return;
            }
          }
          this.handleNext(index, userId);
        },
        error: () => {
          this.failedCount++;
          // Check if all failed
          if (this.failedCount === this.totalCount) {
            this.finishUpload(
              'All uploads failed due to network/server error.',
              'error',
            );
            this.refreshXmlGrid();
            return;
          }

          if (this.totalCount === 1) {
            this.finishUpload('Network or server error.', 'error');
            this.refreshXmlGrid();
            return;
          }

          this.notificationService.showNotification(
            'Network or server error.',
            'error',
          );
          this.handleNext(index, userId);
        },
      });
  }

  // ===== Decide next step =====
  handleNext(index: number, userId: string | null) {
    if (this.isCancelled) {
      this.finishUpload('Upload cancelled by user.', 'warning');
      this.refreshXmlGrid();
      return;
    }
    this.uploadNextFile(index + 1, userId);
  }

  // ===== Cancel button handler =====
  cancelUpload() {
    this.isCancelled = true;
    this.notificationService.showNotification(
      'Upload will stop after current file finishes.',
      'warning',
    );
  }

  // ===== Cleanup / Finish Upload =====
  finishUpload(message: string, type: 'success' | 'error' | 'warning') {
    this.isUploading = false; // ⬅ always stop loading
    this.currentRequest = undefined;

    // Only show a toast if a message exists
    if (message) {
      this.notificationService.showNotification(message, type);
    }
  }

  // ===== XML Refresh =====
  refreshXmlGrid() {
    this.isUploading = false;
    this.loadGeneratedXmlData().subscribe({
      next: (res: any) => {
        if (res.flag) {
          this.xmlGridData = res.data;
          this.clearSelection();
          this.showXmlPopup = true;
        } else {
          this.notificationService.showNotification(res.message, 'error');
        }
      },
      error: () => {
        this.notificationService.showNotification(
          'Failed to refresh XML data.',
          'error',
        );
      },
    });
  }

  // ========== clear selection of the datagrid =======
  clearSelection() {
    this.selectedRowKeys = [];
    this.selectedRowsData = [];
    this.focusedRowKey = null;
  }

  // ========== test upload failed cell click =======
  onCellClick(e: any) {
    // Only for data rows and specific columns
    if (
      e.rowType === 'data' &&
      (e.column?.dataField === 'TestUpload' ||
        e.column?.dataField === 'ProductionUpload')
    ) {
      const cellValue = (e.value || '').toString().toLowerCase();

      if (cellValue.includes('failed')) {
        const rowData = e.data;
        this.loadingVisible = true;

        this.operationService
          .download_XML_error_Data(rowData.XMLFileID)
          .subscribe({
            next: (res: any) => {
              if (res.flag === '1' && res.ErrorReport) {
                const byteCharacters = atob(res.ErrorReport);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/zip' });

                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);

                // Dynamic filename: Test vs Production
                const prefix =
                  e.column?.dataField === 'TestUpload'
                    ? 'TestErrorReport'
                    : 'ProdErrorReport';

                link.download = `${prefix}_${
                  rowData.XMLFileName || rowData.XMLFileID
                }.zip`;
                link.click();

                notify(
                  { message: 'Error report downloaded', position: 'top right' },
                  'success',
                );
              } else {
                notify(
                  {
                    message: res.message || 'No error report available',
                    position: 'top right',
                  },
                  'warning',
                );
              }
            },
            error: () => {
              notify(
                {
                  message: 'Failed to download error report',
                  position: 'top right',
                },
                'error',
              );
            },
            complete: () => {
              this.loadingVisible = false;
            },
          });
      }
    }
  }

  // ============= export clinical costing details grid ===========
  onExporting(e: any) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Export DataGrid with exact columns and summary
    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: (options) => {
        const { gridCell, excelCell } = options;

        // Style headers
        if (gridCell?.rowType === 'header') {
          excelCell.font = { bold: true };
          excelCell.alignment = { horizontal: 'center' };
        }

        // Style summary rows
        if (
          gridCell?.rowType === 'totalFooter' ||
          gridCell?.rowType === 'groupFooter'
        ) {
          excelCell.font = { bold: true, color: { argb: 'FF0000' } };
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          'clinical costing detail data.xlsx',
        );
      });
    });

    e.cancel = true; // prevent default export
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
    DxDateRangeBoxModule,
    DxValidationGroupModule,
    DxDateBoxModule,
    DxLoadPanelModule,
    // SingleClaimDetailsModule,
    FormPopupModule,
  ],
  declarations: [CostingDataFormComponent],
  exports: [CostingDataFormComponent],
})
export class CostingDataFormModule {}
