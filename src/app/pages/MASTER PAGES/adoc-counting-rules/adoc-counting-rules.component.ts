import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
  DxCheckBoxModule,
  DxDataGridComponent,
  DxFormModule,
  DxFormComponent,
} from 'devextreme-angular';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { firstValueFrom } from 'rxjs';
import {
  DxValidatorModule,
  DxValidationSummaryModule,
} from 'devextreme-angular';
import validationEngine from 'devextreme/ui/validation_engine';


@Component({
  selector: 'app-adoc-counting-rules',
  templateUrl: './adoc-counting-rules.component.html',
  styleUrl: './adoc-counting-rules.component.scss',
  providers: [ReportService, DataService],
})
export class AdocCountingRulesComponent {
  @ViewChild(DxDataGridComponent, { static: false })
dataGrid!: DxDataGridComponent;

  dataSource:any[]=[]
//   dataSource: any[] = [
//   {
//     ADOC_RULE: 'Interventional Procedures',
//     IsInactive: false,
//     Status: 'Active'
//   },
//   {
//     ADOC_RULE: 'Specialist Consultations',
//     IsInactive: false,
//     Status: 'Active'
//   },
//   {
//     ADOC_RULE: 'Diagnostic Services',
//     IsInactive: true,
//     Status: 'Inactive'
//   },
//   {
//     ADOC_RULE: 'Support Services',
//     IsInactive: false,
//     Status: 'Active'
//   },
//   {
//     ADOC_RULE: 'Emergency Procedures',
//     IsInactive: true,
//     Status: 'Inactive'
//   }
// ];

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  isAddPopupVisible = false;

    toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

    refresh = () => {
    this.loadList();
  this.dataGrid.instance.refresh();
  };


   constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {
    // this.route.url.subscribe((segments) => {
    //   const fullUrl = segments.map((s) => s.path).join('/');
    //   console.log(fullUrl);
    //   this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    // });
  }

  ngOnInit() {
  this.loadList();
}

  loadList() {
  this.masterService.get_ADOC_CountingRule_List().subscribe({
    next: (res: any) => {
      this.dataSource = res.data;
    },
    error: () => {
      notify(
        {
          message: 'Failed to load data',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    },
  });
}

    //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'ADOC-counting-rules';
    this.service.exportDataGrid(event, fileName);
  }

}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxPopupModule,
    DxCheckBoxModule,
    DxFormModule,
    DxValidatorModule,
    DxValidationSummaryModule,
  ],
  declarations: [AdocCountingRulesComponent],
})
export class AdocCountingRulesModule {}
