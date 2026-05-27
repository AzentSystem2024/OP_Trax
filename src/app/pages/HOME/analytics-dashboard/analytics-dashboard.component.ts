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
  loadingVisible = false;

  constructor(
    private dataService: DataService,
    private service: ReportService,
  ) {}
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
