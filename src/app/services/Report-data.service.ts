import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { exportDataGrid as exportDataGridToPdf } from 'devextreme/pdf_exporter';
import { exportDataGrid as exportDataGridToXLSX } from 'devextreme/excel_exporter';
import { jsPDF } from 'jspdf';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver-es';


import { Router } from '@angular/router';
import { ConfigService } from './config.service';



@Injectable()
export class ReportService {
  private months: { name: string; value: any }[] = [
    { name: 'All', value: '' },
    { name: 'January', value: 0 },
    { name: 'February', value: 1 },
    { name: 'March', value: 2 },
    { name: 'April', value: 3 },
    { name: 'May', value: 4 },
    { name: 'June', value: 5 },
    { name: 'July', value: 6 },
    { name: 'August', value: 7 },
    { name: 'September', value: 8 },
    { name: 'October', value: 9 },
    { name: 'November', value: 10 },
    { name: 'December', value: 11 },
  ];

  constructor(private http: HttpClient, private router: Router,private config: ConfigService) {}

  private get BASE_URL(): string {
    return this.config.apiBaseUrl;
  }

  //============Share months to component ================
  getMonths(): { name: string; value: number }[] {
    return this.months;
  }

  //===============Fetch all search parametrs dropdown values======
  get_SearchParametrs_Data() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BASE_URL}reports/claimdetailswithactivity/parametervalues`;
    const reqBody = { userid: userid };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Cost Reconciliation========
  fetch_Cost_Reconciliation_Report_Data(formData: any) {
    const url = `${this.BASE_URL}costReconciliation/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Cost Reconciliation========
  fetch_Single_Claim_Details_Data(formData: any) {
    const url = `${this.BASE_URL}singleclaimdetails/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Cost Reconciliation========
  fetch_clinician_wise_revenue_Report_Data(formData: any) {
    const url = `${this.BASE_URL}clinicianwiserevenue/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Cost_Discrepancy========
  fetch_Cost_Discrepancy_Report_Data(formData: any) {
    const url = `${this.BASE_URL}costReconciliation/getCostDiscrepancyReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-Details========
  fetch_Claim_Details_Data(formData: any) {
    const url = `${this.BASE_URL}claimdetails/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

   //========fetch datasource of Claim-Details========
   fetch_Clinical_Costing_Summary_Data(formData: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/clinicalCostingSummary`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of clinicalCostingSummaryDetails========
   fetch_Clinical_Costing_Summary_Data_Details(formData: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/clinicalCostingSummaryDetails`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-wise-costing========
  fetch_Claim_wise_Costing_Data(formData: any) {
    const url = `${this.BASE_URL}claimwisecosting/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  

  //======== fetch datasource of Claim-Details-With-Activity ========
  fetch_Claim_Details_With_Activity_Data(formData: any) {
    const url = `${this.BASE_URL}ClaimDetailsWithActivity/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //======== fetch datasource of department wise revenue ========
  fetch_Department_Wise_Revenue_Data(formData: any) {
    const url = `${this.BASE_URL}departmentwise/getRevenueReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //======== fetch datasource of department wise expense ========
  fetch_Department_Wise_Expense_Data(formData: any) {
    const url = `${this.BASE_URL}departmentwise/getExpenseReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }


  //========fetch datasource of cpt-ledger-wise-summary========
  fetch_CPT_Ledger_wise_summary_Data(formData: any) {
    const url = `${this.BASE_URL}cptLedgerWiseSummary/getReportData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //==============Export function==================
  exportDataGrid(e: any, fileName: string): void {
    if (e.format === 'pdf') {
      e.cancel = true;
      const doc = new jsPDF();
      exportDataGridToPdf({
        jsPDFDocument: doc,
        component: e.component,
        customizeCell: ({ gridCell }) => {
          // Skip group/footer summary rows
          if (
            gridCell.rowType === 'groupFooter' ||
            gridCell.rowType === 'totalFooter'
          ) {
            return false;
          }
        },
      }).then(() => {
        doc.save(`${fileName}.pdf`);
      });
    } else {
      e.cancel = true;
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(fileName);
      exportDataGridToXLSX({
        component: e.component,
        worksheet,
        autoFilterEnabled: true,
        customizeCell: ({ gridCell, excelCell }) => {
          // Skip summary rows in Excel
          if (
            gridCell.rowType === 'groupFooter' ||
            gridCell.rowType === 'totalFooter'
          )
            return;
        },
      }).then(() => {
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `${fileName}.xlsx`
          );
        });
      });
    }
  }

  //===============Format the data needful================
  formatDate(dateString: any) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}-${month}-${year}`;
  }
}
