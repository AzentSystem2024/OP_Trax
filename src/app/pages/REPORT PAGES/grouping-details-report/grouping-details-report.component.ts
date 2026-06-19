import { MasterReportService } from 'src/app/pages/MASTER PAGES/master-report.service';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxResizableModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxDateBoxModule,
  DxToolbarModule,
  DxAccordionModule,
  DxCheckBoxModule,
  DxSliderModule,
  DxTagBoxModule,
  DxTemplateModule,
  DxPopupModule,
  DxTreeViewModule,
  DxSortableModule,
  DxTabPanelModule,
  DxListModule,
  DxValidatorModule,
  DxValidationSummaryModule,
  DxTreeViewComponent,
  DxLookupComponent,
  DxDataGridComponent,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { ReportService } from 'src/app/services/Report-data.service';
import { ReportEngineService } from '../report-engine.service';
import DataSource from 'devextreme/data/data_source';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import notify from 'devextreme/ui/notify';
import { DataService } from 'src/app/services';
import CustomStore from 'devextreme/data/custom_store';
import { PopupStateService } from 'src/app/popupStateService.service';
import * as XLSX from 'xlsx';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-grouping-details-report',
  templateUrl: './grouping-details-report.component.html',
  styleUrl: './grouping-details-report.component.scss',
  providers: [ReportService, ReportEngineService, DatePipe, DataService],
})
export class GroupingDetailsReportComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('filterPopupdataGrid', { static: false })
  filterPopupdataGrid!: any;

  @ViewChild(DxTreeViewComponent, { static: false })
  treeView: DxTreeViewComponent;

  //=================DataSource for data Grid Table========
  dataGrid_DataSource: DataSource<any>;

  columnsConfig: any; //==============Column data storing variable

  //================Variables for Storing DataSource========
  Facility_DataSource: any;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  //================Variables for Storing selected Parameters========
  Facility_Value: any = [];
  From_Date_Value: any;
  To_Date_Value: any;
  selectedmonth: any;
  selectedYear: number | null;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [10, 20, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  show_Pagination = true;

  //=====================other variables==================
  isContentVisible: boolean = true;
  hint_for_Parametr_div: any = 'Hide Parameters';
  currentPathName: any;

  minDate: Date;
  maxDate: Date;
  ColumnNames: any;
  memorise_Dropdown_DataList: any;
  isFilterOpened = false; //filter row enable-desable variable
  GridSource: any;
  isEmptyDatagrid: boolean = true;
  summaryColumnsData: any;
  columndata: any;
  isAdvancefilterOpened: boolean = false;
  filterpopupWidth: any = '70%';
  advanceFilterGridColumns: any;
  MemoriseReportName: any;
  isSaveMemorisedOpened: boolean = false;
  personalReportData: any;
  isDrillDownPopupOpened: boolean = false;
  clickedRowData: any;
  loadingVisible: boolean = false;
  columnFixed: boolean = true;
  initialized: boolean;

  popupWidth: any = '90%';
  popupHeight: any = '90vh';
  popupPosition: any = { my: 'center', at: 'center' };
  isPopupMinimised: boolean = false;

  //============Custom close button for drilldown popup============
  toolbarItems: any;
  drilldownPopups: any[];
  isCloseButtonClicked: boolean = false;
  closedPopupsSet: Set<string> = new Set();

  constructor(
    private service: ReportService,
    private router: Router,
    private reportengine: ReportEngineService,
    private datePipe: DatePipe,
    private masterService: MasterReportService,
    private popupStateService: PopupStateService,
    private cdr: ChangeDetectorRef,
  ) {
    // this.loadingVisible = true;

    this.minDate = new Date(2000, 1, 1);
    this.maxDate = new Date();
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2020; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
    this.get_searchParameters_Dropdown_Values();
    // this.updateToolbarItems();
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      this.drilldownPopups.forEach((popup) => {
        this.updateToolbarItems(popup.id); // Pass the popupId when calling this method
      });
    }
    // Add the subscription to NavigationStart here
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.hidePopupsOnNavigation();
      }

      // Listen for NavigationEnd event to restore visibility
      if (event instanceof NavigationEnd) {
        this.restorePopupsOnNavigation();
      }
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.To_Date_Value = today;
    this.From_Date_Value = new Date(today.getFullYear(), today.getMonth(), 1);

    this.selectedYear = today.getFullYear();
    this.selectedmonth = today.getMonth();

    this.popupStateService.getPopupState('groupingDetailsDrillDownPopup');
  }

  //=============Resize the popup drill down============
  onResizeEnd(event: any) {
    this.popupWidth = event.width;
    this.popupHeight = event.height;
  }

  updateToolbarItems(popupId: string) {
    const popup = this.drilldownPopups.find((p) => p.id === popupId); // Get the full popup object by its ID

    if (popup) {
      this.toolbarItems = [
        {
          widget: 'dxButton',
          options: {
            text: '',
            icon: popup.isPopupMinimised ? 'expandform' : 'minus', // Toggle icon based on minimize state
            type: 'normal',
            stylingMode: 'contained',
            onClick: () => this.minimisePopup(popupId), // Pass the popupId to minimize the popup
          },
          toolbar: 'top',
          location: 'after',
        },
        {
          widget: 'dxButton',
          options: {
            text: '',
            icon: 'close', // Close icon for the button
            type: 'normal',
            stylingMode: 'contained',
            onClick: () => this.closePopup1(popupId), // Pass only the popupId to close it
          },
          toolbar: 'top',
          location: 'after',
        },
      ];
    }
  }

  //============= minimise popup ==========
  minimisePopup(popupId: string): void {
    const popup = this.drilldownPopups.find((p) => p.id === popupId);
    if (popup) {
      popup.isPopupMinimised = !popup.isPopupMinimised;

      // Adjust the size and position based on minimize state
      if (popup.isPopupMinimised) {
        popup.width = '20%';
        popup.height = '10%';
        // popup.icon = 'minus';
        popup.icon = 'expand-icon';
        // popup.position = { my: 'center', at: 'center', of: '.view-wrapper' }; // Example position
        popup.position = {
          my: 'bottom right', // Align the popup's top-right corner
          at: 'bottom right', // Align the popup's top-right corner to the right side
          offset: '20 10px', // Add a 20px gap from the top and right edges
          of: window, // Reference the entire window as the parent
        };
      } else {
        popup.width = '100%';
        popup.height = '90vh';
        popup.position = { my: 'center', at: 'center' }; // Example position
        popup.icon = 'minimize-icon';
      }

      // Re-render the popup
      this.cdr.detectChanges(); // Trigger change detection
      this.updateToolbarItems(popupId); // Update toolbar items after minimizing
    }
  }

  //========Remove closing popup from the popup array=====
  closePopup() {
    this.popupStateService.setPopupState('claimDetaisDrillDownPopup', false);
    this.isDrillDownPopupOpened = false;
  }
  //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  //=================Row click drill Down===================
  handleRowDrillDownClick = (e: any) => {
    const popupId = `drilldown-${new Date().getTime()}`; // Unique ID for each popup
    const rowData = e.row.data;
    if (!this.drilldownPopups) {
      this.drilldownPopups = [];
    }
    // Add the new popup configuration
    this.drilldownPopups.push({
      id: popupId,
      width: '90%',
      height: '90vh',
      position: { my: 'center', at: 'center' },
      rowData: rowData,
      isOpened: true,
      isPopupMinimised: false,
    });
    this.popupStateService.setPopupState(popupId, true);
  };

  hidePopupsOnNavigation() {
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      // Hide all drilldown popups instead of closing them
      this.drilldownPopups.forEach((popup) => {
        popup.isOpened = false; // Hide the popup but keep its state
      });
      this.cdr.detectChanges();
    }
  }

  restorePopupsOnNavigation(): void {
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      this.drilldownPopups.forEach((popup) => {
        // If the popup was manually closed, make sure it's not reopened
        if (this.closedPopupsSet.has(popup.id)) {
          popup.isOpened = false; // Keep it closed
        } else {
          popup.isOpened = true; // Restore visibility for popups that should be shown
        }
      });
      // Ensure UI reflects changes immediately
      this.cdr.detectChanges();
    }
  }

  closePopup1(popup: any): void {
    popup.isOpened = false; // Hide the popup
    // console.log('Popup manually closed:', popup);
    this.closedPopupsSet.add(popup.id);
    // Additional logic for closing the popup can go here
  }

  //============Get search parameters dropdown values=======
  get_searchParameters_Dropdown_Values() {
    this.loadingVisible = true;
    this.masterService.Get_Facility_List_Data().subscribe({
      next: (response: any) => {
        if (response.flag == '1') {
          this.Facility_DataSource = response.data;

          if (
            this.Facility_DataSource &&
            this.Facility_DataSource.length === 1
          ) {
            this.Facility_Value = [this.Facility_DataSource[0].FacilityLicense];
          }
        }
      },
      error: (error) => {
        console.error('Error fetching facility data:', error);
      },
      complete: () => {
        this.loadingVisible = false;
      },
    });
  }

  //=========Fetch DataSource For The Datagrid Table==========
  async get_Datagrid_DataSource() {
    const validationResult = validationEngine.validateGroup('resubValidation');

    if (!validationResult.isValid) {
      notify(
        {
          message: 'Please fill all required fields',
          position: { at: 'top right', my: 'top right' },
        },
        'warning',
        3000,
      );
      return;
    }
    const formData = {
      FacilityID: this.Facility_Value.join(','),
      DateFrom: this.reportengine.formatDate(this.From_Date_Value),
      DateTo: this.reportengine.formatDate(this.To_Date_Value),
    };
    this.isContentVisible = false;
    this.dataGrid.instance.beginCustomLoading('Loading...');
    try {
      const response: any = await this.service
        .fetch_Grouping_Details_Data(formData)
        .toPromise();
      if (response.flag === '1') {
        this.isEmptyDatagrid = false;

        this.columndata = response.data.ReportColumns;

        const userLocale = navigator.language || 'en-US';

        this.summaryColumnsData = this.generateSummaryColumns(
          response.data.ReportColumns,
        );

        this.columnsConfig = this.generateColumnsConfig(
          response.data.ReportColumns,
          userLocale,
        );
        this.ColumnNames = this.columnsConfig
          .filter((column) => column.visible)
          .map((column) => column.caption);

        // Format dates in ReportData
        const formattedReportData = response.data.ReportData;

        this.dataGrid_DataSource = new DataSource<any>({
          load: () => Promise.resolve(formattedReportData),
        });
        this.dataGrid.instance.endCustomLoading();
        this.isContentVisible = false;
      } else {
        this.dataGrid.instance.endCustomLoading();
        this.isContentVisible = false;
        notify(
          {
            message: `${response.message}`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
      }
    } catch (error) {
      this.dataGrid.instance.endCustomLoading();
      this.isContentVisible = true;
      notify(
        {
          message: `An error occurred while fetching the data. Please try again later.`,
          position: { at: 'top right', my: 'top right' },
          displayTime: 3000,
        },
        'error',
      );
    }
  }

  generateSummaryColumns(reportColumns) {
    const decimalColumns = reportColumns.filter(
      (col) => col.Type && col.Type.toLowerCase() === 'decimal' && col.Summary,
    );

    const intColumns = reportColumns.filter(
      (col) => col.Type && col.Type.toLowerCase() === 'int32' && col.Summary,
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

  createSummaryItem(col, isGroupItem = false, summaryType = 'sum', formatType) {
    return {
      column: col.Name,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? 'Total Qty: {0} ' : 'Total: {0}',
      valueFormat:
        formatType === 'decimal'
          ? {
              style: 'decimal',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          : null,
      alignByColumn: isGroupItem, // Align by column if it's a group item
      showInGroupFooter: isGroupItem, // Show in group footer for group items
    };
  }

  generateColumnsConfig(reportColumns, userLocale) {
    return reportColumns.map((column) => {
      let columnFormat;
      const colType = column.Type ? column.Type.toLowerCase() : '';

      if (colType === 'datetime') {
        columnFormat = {
          type: 'date',
          formatter: (date) =>
            new Intl.DateTimeFormat(userLocale, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            }).format(new Date(date)),
        };
      }
      if (colType === 'decimal') {
        columnFormat = {
          type: 'fixedPoint',
          precision: 2,
          formatter: (value) =>
            new Intl.NumberFormat(userLocale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value),
        };
      }
      if (colType === 'percentage') {
        columnFormat = {
          type: 'percent',
          precision: 2,
          formatter: (value) =>
            new Intl.NumberFormat(userLocale, {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value / 100),
        };
      }
      return {
        dataField: column.Name,
        caption: column.Title,
        visible: column.Visibility,
        type: column.Type,
        format: columnFormat,
      };
    });
  }

  //============Show Parametrs Div=======================
  show_Parameter_Div = () => {
    this.isContentVisible = !this.isContentVisible;
    this.hint_for_Parametr_div = this.isContentVisible
      ? 'Hide Parameters'
      : 'Show Parameters';
  };

  //============Show Filter Row==========================
  filterClick = () => {
    if (this.dataGrid_DataSource) {
      this.isFilterOpened = !this.isFilterOpened;
    }
  };

  //============Show Filter Row==========================
  SummaryClick = () => {
    const reportGridElement = document.querySelector('.reportGrid');
    if (reportGridElement) {
      reportGridElement.classList.toggle('reportGridFooter');
    }
  };

  //================ Year value change ===================
  onYearChanged(e: any): void {
    this.selectedYear = e.value;
    const currentYear = new Date().getFullYear();
    const today = new Date();

    if (this.selectedmonth === '' || this.selectedmonth === null || this.selectedmonth === undefined) {
      if (this.selectedYear === currentYear) {
        // Set from date to the start of the year and to date to today
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the current year
        this.To_Date_Value = today; // Today's date
      } else {
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1
        this.To_Date_Value = new Date(this.selectedYear, 11, 31); // December 31
      }
    } else {
      this.From_Date_Value = new Date(this.selectedYear, this.selectedmonth, 1);
      this.To_Date_Value = new Date(this.selectedYear, this.selectedmonth + 1, 0);
    }
  }

  //================Month value change ===================
  onMonthValueChanged(e: any) {
    this.selectedmonth = e.value ?? '';
    const currentYear = new Date().getFullYear();
    const today = new Date();

    if (this.selectedmonth === '') {
      if (this.selectedYear === currentYear) {
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the current year
        this.To_Date_Value = today; // Today's date
      } else {
        this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the selected year
        this.To_Date_Value = new Date(this.selectedYear, 11, 31); // December 31 of the selected year
      }
    } else {
      this.From_Date_Value = new Date(this.selectedYear, this.selectedmonth, 1);
      this.To_Date_Value = new Date(this.selectedYear, this.selectedmonth + 1, 0);
    }
  }

  //===========Convert the data to API input format============
  ConvertDataFormat(data: any[]): any {
    const columnNames = this.filterPopupdataGrid.instance
      .getVisibleColumns()
      .map((col: any) => col.dataField);

    const formattedData: any = {};

    columnNames.forEach((column) => {
      formattedData[column] = data
        .map((row) => row[column])
        .filter((v) => v !== undefined && v !== null && v !== '')
        .join(',');
    });

    return formattedData;
  }

  //=====================Search on Each Column===========
  applyFilter() {
    this.GridSource.filter();
  }

  //====================Find the column location from the datagrid================
  findColumnLocation = (e: any) => {
    const columnName = e.itemData;
    if (columnName != '' && columnName != null) {
      this.reportengine.makeColumnVisible(this.dataGrid, columnName);
    }
  };

  //=============DataGrid Refreshing=====================
  refresh = () => {
    // this.dataGrid.instance.refresh();
    this.get_Datagrid_DataSource();
  };

  // ================Exporting Function===================
  onExporting(event: any) {
    const fileName = 'Grouping-Details-Report';
    this.service.exportDataGrid(event, fileName);
  }
}

@NgModule({
  imports: [
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxResizableModule,
    DxDropDownBoxModule,
    FormPopupModule,
    CommonModule,
    DxFormModule,
    DxDateBoxModule,
    DxToolbarModule,
    DxAccordionModule,
    DxCheckBoxModule,
    DxSliderModule,
    DxTagBoxModule,
    DxTemplateModule,
    DxPopupModule,
    ReactiveFormsModule,
    DxTreeViewModule,
    DxSortableModule,
    DxTabPanelModule,
    DxListModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxLoadPanelModule,
  ],
  providers: [],
  exports: [],
  declarations: [GroupingDetailsReportComponent],
})
export class ClaimDetailsModule {}
