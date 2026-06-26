import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxLoadPanelModule,
  DxPopupModule,
} from 'devextreme-angular';
import { DxoSummaryModule } from 'devextreme-angular/ui/nested';
import { OperationReportService } from 'src/app/pages/OPERATION PAGES/operation-report.service';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-adoc-detail-popup',
  templateUrl: './adoc-detail-popup.component.html',
  styleUrls: ['./adoc-detail-popup.component.scss'],
})
export class AdocDetailPopupComponent implements OnChanges {
  @ViewChild('popupGrid', { static: false }) popupGrid!: DxDataGridComponent;

  @Input() visible: boolean = false;
  @Input() rowData: any;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() dataLoaded = new EventEmitter<any>();
  @Output() cellClick = new EventEmitter<any>();

  popupGridData: any[] = [];
  isPopupProcessing: boolean = false;
  isReRunProcessing: boolean = false;
  isLoading: boolean = false;
  billableTotal: number = 0;
  showDetails: boolean = false
  selectedRow: any
  dataGrid_DataSource: any[] = []
  exportFormats = [
    { text: 'Excel', format: 'xlsx' },
    { text: 'CSV', format: 'csv' },
  ];

  constructor(private operationService: OperationReportService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.getClinicalDataPopupData();
    }
  }

  getClinicalDataPopupData() {
    if (!this.rowData?.ClaimUID) return;

    setTimeout(() => {
      this.popupGrid?.instance.beginCustomLoading('Loading...');
    }, 0);

    const payload = { ClaimUID: this.rowData.ClaimUID };

    this.operationService.getClinicalDataInPopup(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.popupGridData = res.data || [];
          this.calculateBillableTotal();

          this.dataLoaded.emit(this.rowData);

          setTimeout(() => {
            this.popupGrid?.instance.endCustomLoading();
          }, 0);
        } else {
          this.popupGridData = [];
          this.popupGrid?.instance.endCustomLoading();
          notify('No data found', 'warning', 3000);
        }
      },
      error: (err: any) => {
        this.popupGrid?.instance.endCustomLoading();
        console.error(err);
        notify('Error loading popup data', 'error', 3000);
      },
    });
  }

  calculateBillableTotal(): void {
    this.isLoading = true;
    this.billableTotal = (this.popupGridData || [])
      .filter((item: any) => item.Billable === true)
      .reduce(
        (total: number, item: any) => total + Number(item.BillPrice || 0),
        0,
      );
    this.isLoading = false;
  }

  billableSummaryText = () => {
    if (this.isLoading) return 'Calculating...';
    return `Net Billable : AED ${this.billableTotal.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  ReRunGrouper() {
    this.isReRunProcessing = true;
    const payload = {
      ClaimUID: this.rowData?.ClaimUID || 0,
      IsReprocess: true,
    };
    this.operationService.get_ReProcess_ClinicalDataInPopup(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.getClinicalDataPopupData();
          notify('Grouper re-run successfully', 'success', 3000);
        }
        this.isReRunProcessing = false;
      },
      error: (err: any) => {
        console.error(err);
        notify('Error re-running grouper', 'error', 3000);
        this.isReRunProcessing = false;
      },
    });
  }

  onPopupHidden() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.popupGridData = [];
  }

  async onExportClick(e: any) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('ADOC Report');

    await exportDataGrid({
      component: this.popupGrid.instance,
      worksheet: worksheet,
      customizeCell: ({ gridCell, excelCell }) => {
        if (
          gridCell?.rowType === 'data' &&
          gridCell.column?.caption === 'Billable'
        ) {
          excelCell.value = gridCell.data?.Billable === true ? 'Yes' : 'No';
        }
      },
    });

    if (e.itemData.format === 'xlsx') {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        'ADOC_Report.xlsx',
      );
    }

    if (e.itemData.format === 'csv') {
      const csvBuffer = await workbook.csv.writeBuffer();
      saveAs(
        new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' }),
        'ADOC_Report.csv',
      );
    }
  }

  onCellPrepared(e: any) {
    if (e.rowType === 'header') {
      e.cellElement.style.backgroundColor = 'var(--cell-header-bg)';
      e.cellElement.style.color = 'var(--cell-header-color)';
    }
    // if (e.rowType === 'data') {
    //   e.cellElement.style.zIndex = 10;
    // }
  }

  onCellClick(e: any) {
    this.cellClick.emit(e);
  }

  onCellClickPrice(e: any) {

    console.log("onCellClickPrice call this function ", e)
    if (e.column.dataField === 'BillPrice') {
      console.log("onCellClickPrice price---- ")

      if (e.data.Billable === true) {
        this.showDetails = true;
        const payload = {
          ClaimActivityUID: e.data.ActivityUID
        }

        this.operationService.get_price(payload).subscribe((res: any) => {
          console.log(res)
        })
        // this.selectedRow = e.data;

        this.dataGrid_DataSource = [
          { field: "Base Price", value: this.selectedRow.ClaimUID },
          { field: "Activity UID", value: this.selectedRow.ActivityUID },
          { field: "Activity Number", value: this.selectedRow.ActivityNumber },
          { field: "Activity Date", value: this.selectedRow.ActivityDate },
          { field: "ADOC Group ID", value: this.selectedRow.ADOCGroupID },
          { field: "ADOC Class ID", value: this.selectedRow.ADOCClassID },
          { field: "Summary", value: this.selectedRow.ADOCClassID },

        ]
      }
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxPopupModule,
    DxDataGridModule,
    DxButtonModule,
    DxDropDownButtonModule,
    DxLoadPanelModule,
    DxoSummaryModule,
  ],
  declarations: [AdocDetailPopupComponent],
  exports: [AdocDetailPopupComponent],
})
export class AdocDetailPopupModule { }
