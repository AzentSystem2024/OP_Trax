import { Component, NgModule, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services';
import {
  DxButtonModule,
  DxChartModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxLoadPanelModule,
  DxPieChartModule,
  DxSelectBoxModule,
  DxToolbarModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { ReportService } from 'src/app/services/Report-data.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
@Component({
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
  providers: [DataService, ReportService],
})
export class AnalyticsDashboardComponent {
  @ViewChild('topCPTGrid') topCPTGrid!: DxDataGridComponent;
  @ViewChild('topClinicianGrid') topClinicianGrid!: DxDataGridComponent;
  numberFormat = { type: 'thousands' };

  fromDate: Date;
  toDate: Date;

  CPTVolumeBySeries: any;
  SpecialityImpact: any;
  TopCPTImpact: any;
  ClinicianSpecialityImpact: any;
  MonthlyTrend: any;

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
    this.loadingVisible = true;
    const inputData = {
      DateFrom: this.formatDate(this.fromDate),
      DateTo: this.formatDate(this.toDate),
    };
    this.dataService.fetch_chart_data_List(inputData).subscribe({
      next: (res: any) => {
        this.loadingVisible = false;
        if (res.flag === '1') {
          this.CPTVolumeBySeries = res.CPTVolumeBySeries;
          this.SpecialityImpact = res.SpecialityImpact;
          this.TopCPTImpact = res.TopCPTImpact;
          this.ClinicianSpecialityImpact = res.ClinicianSpecialityImpact;
          this.MonthlyTrend = res.MonthlyTrend;

          this.topCPTGrid.instance.repaint();
          this.topCPTGrid.instance.updateDimensions();
          this.topClinicianGrid.instance.repaint();
          this.topClinicianGrid.instance.updateDimensions();

          setTimeout(() => {
            this.topCPTGrid.instance.repaint();
            this.topCPTGrid.instance.updateDimensions();
            this.topClinicianGrid.instance.repaint();
            this.topClinicianGrid.instance.updateDimensions();
          }, 100);
        } else {
          this.showError(res.message);
        }
      },
      error: (err) => {
        this.loadingVisible = false;
        this.showError('Failed to load chart data.');
        console.error(err);
      },
    });
  }

  onGridContentReady(e: any) {
    e.component.updateDimensions();
  }

  customizePiePoint = (pointInfo: any) => {
    switch (pointInfo.argument) {
      case 'C - Specialist Consultations':
        return { color: 'rgb(79, 70, 229)' };

      case 'D - Diagnostic Services':
        return { color: 'rgb(14, 165, 233)' };

      case 'P - Interventional Procedures':
        return { color: 'rgb(139, 92, 246)' };

      case 'S - Support Services':
        return { color: 'rgb(16, 185, 129)' };

      case 'Not Classified':
        return { color: 'rgb(148, 163, 184)' };

      case 'Unmapped':
        return { color: 'rgb(245, 158, 11)' };

      default:
        return { color: 'rgb(203, 213, 225)' };
    }
  };

  customizePieTooltip = (arg: any) => {
    return {
      html: `
      <div style="padding:5px;">
        <b>${arg.argument}</b><br/>
        Count : ${arg.value} (${arg.percentText})<br/>
        
      </div>
    `,
    };
  };

  percentAxisLabel = (e: any) => {
    return `${e.value}%`;
  };

  customizeSpecialityLabel = (arg: any) => {
    const text = arg.valueText || '';
    const words = text.trim().split(/\s+/);

    if (words.length <= 1) {
      return text;
    }

    return words[0] + '\n' + words.slice(1).join(' ');
  };
  
  customizeSpecialityTooltip = (arg: any) => {
    const data = arg.point?.data;

    let html = `
    <div style="padding:6px;min-width:180px">
      <div><b>${arg.argument}</b></div>
      <hr style="margin:4px 0">
      <div>Specialty: <b>${data?.SpecialityName}</b></div>
      <div>Series: <b>${arg.seriesName}</b></div>
      <div>Value: <b>${Number(arg.value).toLocaleString()}</b></div>
  `;

    if (arg.seriesName === 'ADOC Revenue') {
      html += `
      <div>Impact : <b>${Number(data?.ImpactPercent || 0).toFixed(2)}%</b></div>
    `;
    }

    html += `</div>`;

    return { html };
  };

  customizeMonthlyTrendTooltip = (arg: any) => {
    const data = arg.point?.data || {};

    return {
      html: `
      <div style="padding:6px;min-width:200px">
        <div><b>${arg.argument}</b></div>
        <hr style="margin:4px 0">
        <div>CPT : <b>AED ${Number(data.CPTValue).toLocaleString()}</b></div>
        <div>ADOC : <b>AED ${Number(data.ADOCValue).toLocaleString()}</b></div>
        <div>Impact : <b>${Number(data.ImpactPercent).toFixed(2)}%</b></div>
      </div>
    `,
    };
  };

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

  //==================== Export to PDF ====================
  export() {
    this.loadingVisible = true;

    const elements: HTMLElement[] = [];

    document
      .querySelectorAll('.ExportDiv1, .ExportDiv2, .ExportDiv3, .ExportDiv4')
      .forEach((x) => {
        if (x) {
          elements.push(x as HTMLElement);
        }
      });

    this.exportGraphData('Financial Impact Analyzer', elements)
      .then(() => {
        this.loadingVisible = false;
      })
      .catch((error) => {
        this.loadingVisible = false;
        console.error('Export failed:', error);
      });
  }

  // ============== export pdf charts ================
  async exportGraphData(
    reportname: string,
    elements: HTMLElement[],
  ): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let yPos = 15;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportname, pageWidth / 2, 10, {
      align: 'center',
    });

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (yPos + imgHeight > pageHeight - 10) {
        pdf.addPage();

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(reportname, pageWidth / 2, 10, {
          align: 'center',
        });

        yPos = 15;
      }

      pdf.addImage(imgData, 'PNG', 5, yPos, imgWidth, imgHeight);

      yPos += imgHeight + 5;
    }

    // Add footer to every page
    const pageCount = pdf.getNumberOfPages();

    const exportTime = new Date().toLocaleString();

    for (let page = 1; page <= pageCount; page++) {
      pdf.setPage(page);

      pdf.setFontSize(7);

      pdf.text(`Exported on: ${exportTime}`, 5, pageHeight - 5);

      pdf.text(`Page ${page} of ${pageCount}`, pageWidth - 25, pageHeight - 5);
    }

    pdf.save(`${reportname}.pdf`);
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
    DxPieChartModule,
    DxDataGridModule,
    DxToolbarModule,
  ],
  providers: [],
  exports: [],
  declarations: [AnalyticsDashboardComponent],
})
export class AnalyticsDashboardModule {}
