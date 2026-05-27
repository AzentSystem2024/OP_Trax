import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  NgModule,
  ViewChild,
} from '@angular/core';
import * as XLSX from 'xlsx';
import notify from 'devextreme/ui/notify';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { ReportEngineService } from '../../REPORT PAGES/report-engine.service';
@Component({
  selector: 'app-advance-filter-popup',
  templateUrl: './advance-filter-popup.component.html',
  styleUrls: ['./advance-filter-popup.component.scss'],
})
export class AdvanceFilterPopupComponent {
  @Input() columnData: any | null;

  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('fileInput') fileInput!: ElementRef;

  gridDataSource: any[] = [];
  formattedData: any;
  ResultData: any[];
  GridTabledata: any[];
  isFileNameAvailable: boolean = false;
  importedFileName: string;
  constructor(private reportEngine: ReportEngineService) {}

  //===================Import Excel Data to datagrid==================
  import_ExcelData(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      // Extract the first row as column names from the Excel sheet and convert to lowercase
      const excelColumnNames: string[] = (data[0] as string[]).map(
        (col: string) => col.toLowerCase()
      );
      // Get DataGrid columns and convert them to lowercase
      const dataGridColumns = this.dataGrid.instance.getVisibleColumns();
      const dataGridColumnNames: string[] = dataGridColumns.map((col: any) =>
        col.dataField.toLowerCase()
      );
      // Check if the number of columns and their names match exactly
      const columnsMatched =
        excelColumnNames.length === dataGridColumnNames.length &&
        excelColumnNames.every((col) => dataGridColumnNames.includes(col));
      if (!columnsMatched) {
        notify(
          {
            message: `Column count or names do not match.`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
        return; // Exit if columns do not match
      }
      // Proceed to map the data if columns match
      const mappedData: any[] = [];
      // Loop through each row in the Excel data (skip the first row as it's the header)
      data.slice(1).forEach((row: any[]) => {
        const rowData: any = {};
        // Loop through each DataGrid column
        dataGridColumns.forEach((column) => {
          const dataField = column.dataField.toLowerCase();
          const excelColumnIndex = excelColumnNames.indexOf(dataField);
          // Assign values if available
          if (excelColumnIndex !== -1) {
            rowData[column.dataField] = row[excelColumnIndex];
          }
        });
        // Add the row data if all columns are present
        mappedData.push(rowData);
      });
      // Set the DataGrid data source
      this.gridDataSource = mappedData;
      const formattedObject = this.ConvertDataFormat(this.gridDataSource);
      this.reportEngine.setData(formattedObject);
    };
    reader.readAsBinaryString(target.files[0]);
  }
  //===========Convert the data to API input format============
  ConvertDataFormat(data: any[]): any {
    // Get the column names from the DataGrid instance
    const columnNames = this.dataGrid.instance
      .getVisibleColumns()
      .map((col) => col.dataField);
    const formattedData: any = {};
    columnNames.forEach((column) => {
      const columnValues = data.map((item) => item[column] || '').join(', ');
      formattedData[column] = columnValues;
    });
    return formattedData;
  }

  //===============Refresh datagrid============
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
}
@NgModule({
  imports: [CommonModule, DxDataGridModule, DxButtonModule],
  declarations: [AdvanceFilterPopupComponent],
  exports: [AdvanceFilterPopupComponent],
})
export class AdvanceFilterPopupModule {}
