import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { AnalyticsDashboardComponent } from './pages/analytics-dashboard/analytics-dashboard.component';

import {
  DxButtonModule,
  DxChartModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxLoadPanelModule,
  DxPieChartModule,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxToolbarModule
} from 'devextreme-angular';

@NgModule({
  declarations: [
    AnalyticsDashboardComponent
  ],

  imports: [
    CommonModule,
    HomeRoutingModule,

    // DevExtreme modules
    DxButtonModule,
    DxChartModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
    DxLoadPanelModule,
    DxPieChartModule,
    DxSelectBoxModule,
    DxTagBoxModule,
    DxToolbarModule
  ]
})
export class HomeModule {}
