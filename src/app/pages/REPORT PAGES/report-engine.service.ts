import { HttpClient } from '@angular/common/http';
import { Injectable, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import { ConfigService } from 'src/app/services/config.service';


@Injectable({
  providedIn: 'root',
})
export class ReportEngineService {
  private sharedData: any[] = [];

  constructor(private http: HttpClient, private router: Router,private config: ConfigService) {}

  private get BASE_URL(): string {
    return this.config.apiBaseUrl;
  }
  // ========================================================
  setData(data: any[]) {
    this.sharedData = data;
  }
  getData(): any {
    return this.sharedData;
  }
  //=========================Save memorise Report==================
  save_Memorise_report(
    reportName: any,
    memoriseColumnData: any,
    filterParameters: any
  ) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${this.BASE_URL}userreports/insert`;
    const reqBody = {
      USER_ID: userid,
      REPORT_ID: currentPathName,
      USER_REPORT_NAME: reportName,
      columns: memoriseColumnData,
    };
    return this.http.post(url, reqBody);
  }

  //================Column location finding==================
  makeColumnVisible(dataGrid: DxDataGridComponent, columnName: string) {
    const columns = dataGrid.instance.getVisibleColumns();
    const columnIndex = columns.findIndex(
      (column) => column.caption === columnName
    );
    if (columnIndex !== -1) {
      const columnWidth = 150;
      const gridElement = dataGrid.instance.element();
      const visibleWidth = gridElement.clientWidth + 400;
      const scrollLeft = columnIndex * columnWidth - visibleWidth / 2;
      // Scroll to the calculated position
      dataGrid.instance.getScrollable().scrollTo({ left: scrollLeft });
      // Highlight the column
      dataGrid.instance.columnOption(
        columnName,
        'cssClass',
        'highlighted-column'
      );
      setTimeout(() => {
        dataGrid.instance.columnOption(columnName, 'cssClass', null);
      }, 3000);
    }
  }

  //===============Format the data needful==================
  formatDate(dateString: any) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  update_Claim_Activity_Costing_Department(payload: any) {
    const reqBody = payload;
    const Url = `${this.BASE_URL}singleclaimdetails/updateCostDepartment`;
    return this.http.post(Url, reqBody);
  }

  update_Claim_Activity_Qty_Weight(payload: any) {
    const reqBody = payload;
    const Url = `${this.BASE_URL}singleclaimdetails/updateQtyWeightage`;
    return this.http.post(Url, reqBody);
  }
}
