import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxFormModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxCheckBoxModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';

@Component({
  selector: 'app-cpt-weightage',
  templateUrl: './cpt-weightage.component.html',
  styleUrl: './cpt-weightage.component.scss',
  providers: [ReportService, DataService],
})
export class CPTWeightageComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];

  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  isAddPopupVisible = false;

  facilityList: any[] = [];
  cptCodeList: any[] = [];

  menuPrevilage: any;

  newWeightageMaster: any = {
    FacilityID: null,
    CPTCode: null,
    Weightage: 0,
    EffectFrom: null,
    RevisedOn: null,
    IsInactive: false,
  };

  dataSource = new DataSource({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_CPTWeightage_List().subscribe({
          next: (res: any) => resolve(res.datas),
          error: (err: any) => reject(err),
        });
      }),
  });

  addButtonOptions: any;

  constructor(
    private masterService: MasterReportService,
    private service: ReportService,
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });

    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.showNewPopup(),
      elementAttr: { class: 'add-button' },
    };

    this.loadLookups();
  }

  loadLookups() {
    this.dataService
      .get_UserWise_FacilityList_Data()
      .subscribe((response: any) => {
        this.facilityList = response.facilityDetails || [];

        if (this.facilityList.length === 1) {
          this.newWeightageMaster.FacilityID = [
            this.facilityList[0].FacilityLicense,
          ];
        }
      });

    this.masterService.Get_GropDown('CPT').subscribe((response: any) => {
      if (response) {
        this.cptCodeList = response;
      }
    });
  }

  showNewPopup() {
    this.isAddPopupVisible = true;
  }

  saveWeightageMaster() {
    this.masterService
      .Insert_CPTWeightage_Data(
        this.newWeightageMaster.FacilityID,
        this.newWeightageMaster.CPTCode,
        this.newWeightageMaster.Weightage,
        this.newWeightageMaster.EffectFrom,
        this.newWeightageMaster.RevisedOn,
        false,
      )
      .subscribe(() => {
        notify('Weightage Master Added Successfully', 'success', 1000);

        this.isAddPopupVisible = false;

        this.dataGrid.instance.refresh();
      });
  }

  onRowUpdating(event: any) {
    const data = {
      ...event.oldData,
      ...event.newData,
    };

    this.masterService
      .update_CPTWeightage_Data(
        data.ID,
        data.FacilityID,
        data.CPTID,
        data.Weightage,
        data.EffectFrom,
        data.EffectTo,
        data.IsInactive,
      )
      .subscribe(() => {
        notify('Updated Successfully', 'success', 1000);

        event.component.cancelEditData();

        this.dataGrid.instance.refresh();
      });

    event.cancel = true;
  }

  onRowRemoving(event: any) {
    event.cancel = true;

    this.masterService
      .Remove_CPTWeightage_Row_Data(event.key.ID)
      .subscribe(() => {
        notify('Deleted Successfully', 'success', 1000);

        this.dataGrid.instance.refresh();
      });
  }

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onExporting(event: any) {
    this.service.exportDataGrid(event, 'Weightage-Master');
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxPopupModule,
    DxFormModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxDateBoxModule,
    DxCheckBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [CPTWeightageComponent],
})
export class CPTWeightageListModule {}
