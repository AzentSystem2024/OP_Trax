import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services';
import {
  DxButtonModule,
  DxChartModule,
  DxDateBoxModule,
  DxLoadPanelModule,
  DxSelectBoxModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { ReportService } from 'src/app/services/Report-data.service';

@Component({
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
  providers: [DataService, ReportService],
})
export class AnalyticsDashboardComponent {
  numberFormat = { type: 'thousands' };

  fromDate: Date;
  toDate: Date;

  facilityDataSource: any = [
    {
      Facility: 'MF1234',
      Actual: 100,
      Billable: 75,
    },
  ];

  departmentDataSource: any = [
    {
      Department: 'Neurology',
      Actual: 100,
      Billable: 88,
    },
    {
      Department: 'Internal Medicine',
      Actual: 100,
      Billable: 72,
    },
    {
      Department: 'Cardiology',
      Actual: 100,
      Billable: 65,
    },
    {
      Department: 'Gastroenterology',
      Actual: 100,
      Billable: 81,
    },
    {
      Department: 'Endocrinology',
      Actual: 100,
      Billable: 54,
    },
  ];

  ClinicianDataSource: any = [
    {
      Clinician: 'CL0003',
      Actual: 100,
      Billable: 90,
    },
    {
      Clinician: 'CL0005',
      Actual: 100,
      Billable: 89,
    },
    {
      Clinician: 'CL0009',
      Actual: 100,
      Billable: 85,
    },
    {
      Clinician: 'CL0010',
      Actual: 100,
      Billable: 83,
    },
    {
      Clinician: 'CL0002',
      Actual: 100,
      Billable: 77,
    },
    {
      Clinician: 'CL0004',
      Actual: 100,
      Billable: 74,
    },
    {
      Clinician: 'CL0015',
      Actual: 100,
      Billable: 70,
    },
    {
      Clinician: 'CL0012',
      Actual: 100,
      Billable: 68,
    },
    {
      Clinician: 'CL0006',
      Actual: 100,
      Billable: 62,
    },
    {
      Clinician: 'CL0007',
      Actual: 100,
      Billable: 58,
    },
  ];

  loadingVisible = false;

  selectedmonth: any = '';
  selectedYear: any = null;
  minDate: Date;
  maxDate: Date;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  constructor(
    private dataService: DataService,
    private service: ReportService,
  ) {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const lastProcessedYear = Number(logData?.LastProcessedYear || 0);

    const today = new Date();
    const currentYear1 = today.getFullYear();

    if (lastProcessedYear > 0) {
      // Use last processed year
      this.selectedYear = lastProcessedYear;
      this.fromDate = new Date(lastProcessedYear, 0, 1); // 01/01/YYYY
      this.toDate = new Date(lastProcessedYear, 11, 31); // 31/12/YYYY
    } else {
      // Fallback (existing behavior)
      const previousYear = currentYear1 - 1;
      this.fromDate = new Date(previousYear, 0, 1);
      this.toDate = today;
    }

    this.minDate = new Date(2023, 0, 1); // Set the minimum date
    this.maxDate = new Date(); // Set the maximum date
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
    this.loadChartData();
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

  // ============== load chart data =============
  loadChartData() {
    // this.loadingVisible = true;
    // const inputData = {
    //   DateFrom: this.formatDate(this.fromDate),
    //   DateTo: this.formatDate(this.toDate),
    // };
    // this.dataService.fetch_chart_data_List(inputData).subscribe({
    //   next: (res: any) => {
    //     this.loadingVisible = false;
    //     if (res.flag === '1') {
    //       this.ClinicianDataSource = res.clinician;
    //       this.facilityDataSource = res.facility;
    //       this.departmentDataSource = res.department;
    //     } else {
    //       this.showError(res.message);
    //     }
    //   },
    //   error: (err) => {
    //     this.loadingVisible = false;
    //     this.showError('Failed to load chart data.');
    //     console.error(err);
    //   },
    // });
  }

  // ============== helper notify ============
  private showError(message: string) {
    notify(
      { message, position: { at: 'top right', my: 'top right' } },
      'error',
    );
  }

  // ====== format date as yyyy-MM-dd =====
  formatDate(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxChartModule,
    DxDateBoxModule,
    DxButtonModule,
    DxLoadPanelModule,
    DxSelectBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [AnalyticsDashboardComponent],
})
export class AnalyticsDashboardModule {}
