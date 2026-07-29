import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import notify from 'devextreme/ui/notify';
import DataSource from 'devextreme/data/data_source';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxLoadPanelModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxPopupModule,
  DxTextAreaModule,
} from 'devextreme-angular';
import { ReportService } from 'src/app/services/Report-data.service';
import { DataService } from 'src/app/services';
import { OperationReportService } from '../operation-report.service';
import { NotificationService } from 'src/app/services/notification.service';
import { InactivityService } from 'src/app/services/inactivity.service';

@Component({
  selector: 'app-xml-upload',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
    DxLoadPanelModule,
    DxFormModule,
    DxPopupModule,
    DxTextAreaModule,
  ],
  providers: [ReportService, DataService, OperationReportService, DatePipe],
  templateUrl: './xml-upload.component.html',
  styleUrl: './xml-upload.component.scss',
})
export class XmlUploadComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild('newBatchGrid', { static: false })
  newBatchGrid!: DxDataGridComponent;

  private filterSubscription?: Subscription;
  private newFilterSubscription?: Subscription;
  private cancelLoad?: (reason: string) => void;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [10, 20, 50, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  isFilterRowVisible: boolean = false;

  newButtonOptions = {
    icon: 'add',
    text: 'New',
    type: 'default',
    stylingMode: 'contained',
    hint: 'New Batch',
    onClick: () => this.openNewBatchCreationScreen(),
    elementAttr: { class: 'add-button' },
  };

  uploadButtonOptions = {
    icon: 'upload',
    text: 'Upload',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Upload Selected Batches',
    onClick: () => this.upload_selected_Data(),
    elementAttr: { class: 'add-button' },
    disabled: true,
  };

  facilityListDataSource: any;
  selectedFacility: any[] = [];

  fromDate: any | null = null;
  toDate: any | null = null;
  today: Date = new Date();

  dataSource!: DataSource<any, any>;
  isContentVisible: boolean = true;

  selectedmonth: any = '';
  selectedYear: any = null;
  minDate: Date;
  maxDate: Date;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  isLookupLoading: boolean = false;
  isMultiProcessing: boolean = false;
  processProgressMessage: string = '0/0 completed';

  // State variables for New Batch Popup
  isNewBatchPopupVisible: boolean = false;
  isNewContentVisible: boolean = true;
  newBatchDataSource: any[] = [];
  isNewLookupLoading: boolean = false;

  newSelectedFacility: any[] = [];
  newFromDate: any | null = null;
  newToDate: any | null = null;
  newSelectedMonth: any = '';
  newSelectedYear: any = null;

  isXmlPopupVisible: boolean = false;
  xmlContent: string = '';
  selectedBatchNo: string = '';
islookUpMultiProcessing: boolean;

  constructor(
    private service: ReportService,
    private dataService: DataService,
    private operationService: OperationReportService,
    private datePipe: DatePipe,
    private notificationService: NotificationService,
    private inactivityService: InactivityService,
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
      this.fromDate = new Date(this.selectedYear, 0, 1);
      this.toDate = today;
    } else {
      this.fromDate = new Date(this.selectedYear, 0, 1);
      this.toDate = new Date(this.selectedYear, 11, 31);
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

  //================ New Popup Year value change ===================
  onNewYearChanged(e: any): void {
    if (!e.event) return;

    this.newSelectedYear = e.value;
    this.newSelectedMonth = '';
    const currentYear = new Date().getFullYear();
    const today = new Date();
    if (this.newSelectedYear === currentYear) {
      this.newFromDate = new Date(this.newSelectedYear, 0, 1);
      this.newToDate = today;
    } else {
      this.newFromDate = new Date(this.newSelectedYear, 0, 1);
      this.newToDate = new Date(this.newSelectedYear, 11, 31);
    }
  }

  //================ New Popup Month value change ===================
  onNewMonthValueChanged(e: any) {
    if (!e.event) return;

    this.newSelectedMonth = e.value ?? '';
    const today = new Date();
    const currentYear = today.getFullYear();

    if (this.newSelectedMonth === '') {
      if (this.newSelectedYear === currentYear) {
        this.newFromDate = new Date(currentYear, 0, 1);
        this.newToDate = today;
      } else {
        this.newFromDate = new Date(this.newSelectedYear, 0, 1);
        this.newToDate = new Date(this.newSelectedYear, 11, 31);
      }
    } else {
      this.newFromDate = new Date(
        this.newSelectedYear,
        this.newSelectedMonth,
        1,
      );
      this.newToDate = new Date(
        this.newSelectedYear,
        this.newSelectedMonth + 1,
        0,
      );
    }
  }

  async loadFacilityData(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.dataService.Get_User_Facility_List_Data(),
      );
      this.facilityListDataSource = res?.data ?? [];

      if (this.facilityListDataSource?.length == 1) {
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

  onApplyFilter() {
    if (this.isLookupLoading) {
      return;
    }

    // this.isLookupLoading = true;

    const formatDate = (date: Date | null) =>
      date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;

    const payload = {
      FacilityID: Array.isArray(this.selectedFacility)
        ? this.selectedFacility.join(',')
        : '',
      DateFrom: formatDate(this.fromDate),
      DateTo: formatDate(this.toDate),
      UserID: parseInt(sessionStorage.getItem('UserID') || '0', 10),
    };

    // console.log('payload ==>>', payload);

    this.dataSource = new DataSource<any>({
      load: () => {
        return new Promise((resolve, reject) => {
          this.cancelLoad = reject;
          this.filterSubscription = this.operationService
            .get_XML_Batch_List_Data(payload)
            .subscribe({
              next: (res: any) => {
                this.isLookupLoading = false;
                this.filterSubscription = undefined;
                this.cancelLoad = undefined;
                const data = res?.flag === '1' ? (res.data ?? []) : [];
                this.isContentVisible = data.length === 0;
                resolve(data);
              },
              error: (err: any) => {
                // this.isLookupLoading = false;
                this.filterSubscription = undefined;
                this.cancelLoad = undefined;
                console.error('Error loading data:', err.message || err);
                reject(err.message || 'Error loading data');
              },
            });
        });
      },
    });
  }

  cancelApiCall() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
      this.filterSubscription = undefined;
    }
    if (this.cancelLoad) {
      this.cancelLoad('Process cancelled by user');
      this.cancelLoad = undefined;
    }
    this.isLookupLoading = false;
    notify('Data loading cancelled', 'warning', 3000);
  }

  onSelectionChanged(e: any) {
    const unselectableKeys = e.currentSelectedRowKeys.filter((key: any) => {
      // Find the actual row data based on the key
      const row = e.component
        .getDataSource()
        .items()
        .find((item: any) => item === key || item.ID === key);
      return row && row.Status?.toLowerCase() === 'uploaded';
    });

    if (unselectableKeys.length > 0) {
      e.component.deselectRows(unselectableKeys);
      this.notificationService.showNotification(
        'Cannot select already uploaded batches.',
        'warning',
      );
    }

    const selectedRows = e.component.getSelectedRowsData();
    // Re-check after potential deselection
    const selected = selectedRows.length > 0;

    const items: any = this.dataGrid.instance.option('toolbar.items');
    const uploadBtn = items.find((item: any) => item.name === 'uploadButton');
    if (uploadBtn) {
      uploadBtn.options.disabled = !selected;
      this.dataGrid.instance.option('toolbar.items', items);
    }
  }

  async upload_selected_Data() {
    const selectedRows = this.dataGrid.instance.getSelectedRowsData();

    if (!selectedRows.length) {
      this.notificationService.showNotification(
        'Please select at least one row to process.',
        'warning',
      );
      return;
    }

    const uniqueIDs = [
      ...new Map(selectedRows.map((row) => [row.ID, row])).values(),
    ];

    const total = uniqueIDs.length;
    let completed = 0;

    this.isMultiProcessing = true;
    this.processProgressMessage = `0/${total} completed`;

    this.inactivityService.setApiInProgress(true);

    for (const row of uniqueIDs) {
      const payload = { ID: row.ID || 0 };

      try {
        const res: any = await firstValueFrom(
          this.operationService.upload_XML_Batch_Data(payload),
        );
      } catch (err) {
        console.error(`Error processing ID ${row.ID}:`, err);
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
    this.onApplyFilter();
  }

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  toggleNewContent() {
    this.isNewContentVisible = !this.isNewContentVisible;
  }

  openNewBatchCreationScreen() {
    this.isNewBatchPopupVisible = true;
    const today = new Date();
    this.newSelectedYear = today.getFullYear();
    this.newSelectedMonth = today.getMonth();
    this.newToDate = today;
    this.newFromDate = new Date(today.getFullYear(), today.getMonth(), 1);

    if (this.selectedFacility.length > 0) {
      this.newSelectedFacility = [...this.selectedFacility];
    } else {
      const defaultFacility = this.facilityListDataSource?.find(
        (f: any) => f.ID === 16,
      );
      if (defaultFacility) {
        this.newSelectedFacility = [defaultFacility.FacilityLicense];
      }
    }

    this.newBatchDataSource = [];
  }

  onNewApplyFilter() {
    if (this.isNewLookupLoading) return;
    this.isNewLookupLoading = true;

    const formatDate = (date: Date | null) =>
      date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;

    const payload = {
      FacilityID: Array.isArray(this.newSelectedFacility)
        ? this.newSelectedFacility.join(',')
        : '',
      DateFrom: formatDate(this.newFromDate),
      DateTo: formatDate(this.newToDate),
    };

    this.newFilterSubscription = this.operationService
      .get_pending_upload_data(payload)
      .subscribe({
        next: (res: any) => {
          this.isNewLookupLoading = false;
          this.newFilterSubscription = undefined;
          this.newBatchDataSource = res?.flag === '1' ? (res.data ?? []) : [];
          if (this.newBatchDataSource.length === 0) {
            this.notificationService.showNotification(
              'No data found for the selected filters',
              'warning',
            );
          }
        },
        error: (err: any) => {
          this.isNewLookupLoading = false;
          this.newFilterSubscription = undefined;
          this.notificationService.showNotification(
            'Error loading data',
            'error',
          );
        },
      });
  }

  cancelNewApiCall() {
    if (this.newFilterSubscription) {
      this.newFilterSubscription.unsubscribe();
      this.newFilterSubscription = undefined;
    }
    this.isNewLookupLoading = false;
    notify('Data loading cancelled', 'warning', 3000);
  }

  onCreateBatchClick() {
    if (!this.newBatchGrid) {
      this.notificationService.showNotification('Grid not loaded', 'error');
      return;
    }

    const selectedRows = this.newBatchGrid.instance.getSelectedRowsData();
    if (selectedRows.length === 0) {
      this.notificationService.showNotification(
        'Please select at least one row to create a batch.',
        'warning',
      );
      return;
    }

    const claimUIDs = selectedRows.map((row: any) => row.ClaimUID);
    const payload = {
      ClaimUIDs: claimUIDs,
      UserID: parseInt(sessionStorage.getItem('UserID') || '0', 10),
    };

    this.isMultiProcessing = true;
    this.inactivityService.setApiInProgress(true);

    this.operationService.create_XML_Batch(payload).subscribe({
      next: (res: any) => {
        this.isMultiProcessing = false;
        this.inactivityService.setApiInProgress(false);

        if (res?.flag === '1' || res?.flag === 1) {
          this.notificationService.showNotification(
            'Batch created successfully.',
            'success',
          );
          this.isNewBatchPopupVisible = false;
          this.onApplyFilter(); // Refresh main grid
        } else {
          this.notificationService.showNotification(
            res?.message || 'Failed to create batch.',
            'error',
          );
        }
      },
      error: (err: any) => {
        this.isMultiProcessing = false;
        this.inactivityService.setApiInProgress(false);
        this.notificationService.showNotification(
          'Error creating batch.',
          'error',
        );
      },
    });
  }

  onDetailClick = (e: any) => {
    const payload = { ID: e.row.data.ID };
    this.selectedBatchNo = e.row.data.BatchNo || 'Batch';

    this.inactivityService.setApiInProgress(true);
    this.operationService.get_batch_xml(payload).subscribe({
      next: (res: any) => {
        this.inactivityService.setApiInProgress(false);
        if (res?.flag === '1' || res?.flag === 1) {
          let xmlStr = res.XMLData || '';

          // Format TransactionDate in the XML header to dd-MM-yyyy format with time
          xmlStr = xmlStr.replace(
            /<TransactionDate>(.*?)<\/TransactionDate>/,
            (match: string, dateStr: string) => {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const formattedDate = this.datePipe.transform(
                  date,
                  'dd-MM-yyyy HH:mm:ss',
                );
                return `<TransactionDate>${formattedDate}</TransactionDate>`;
              }
              return match;
            },
          );

          // Format XML for better readability
          this.xmlContent = this.formatXml(xmlStr);
          this.isXmlPopupVisible = true;
        } else {
          this.notificationService.showNotification(
            res?.message || 'Error loading XML details',
            'error',
          );
        }
      },
      error: (err: any) => {
        this.inactivityService.setApiInProgress(false);
        this.notificationService.showNotification(
          'Error loading XML details',
          'error',
        );
      },
    });
  };

  downloadXml() {
    if (!this.xmlContent) return;
    const blob = new Blob([this.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const fileName = this.selectedBatchNo.toLowerCase().endsWith('.xml')
      ? this.selectedBatchNo
      : `${this.selectedBatchNo}.xml`;

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Simple XML formatting function
  formatXml(xml: string): string {
    let formatted = '';
    let pad = 0;
    xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');
    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      formatted += '  '.repeat(pad) + node + '\n';
      pad += indent;
    });
    return formatted.trim();
  }

  onExporting(event: any) {
    const fileName = 'xml_upload_data';
    this.service.exportDataGrid(event, fileName);
  }

  displayFacility = (item: any) => {
    if (!item) return '';
    return `${item.FacilityLicense} - ${item.FacilityName}`;
  };

  onCellPrepared(e: any) {
    if (e.rowType === 'header') {
      e.cellElement.style.backgroundColor = 'var(--cell-header-bg)';
      e.cellElement.style.color = 'var(--cell-header-color)';
    }
    if (e.rowType === 'data') {
      e.cellElement.style.zIndex = 10;
    }
  }
}
