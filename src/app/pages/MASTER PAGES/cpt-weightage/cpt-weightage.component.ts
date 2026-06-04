import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  DxLoadPanelModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { DataSource } from 'devextreme/common/data';

@Component({
  selector: 'app-cpt-weightage',
  templateUrl: './cpt-weightage.component.html',
  styleUrl: './cpt-weightage.component.scss',
  providers: [ReportService, DataService],
})
export class CPTWeightageComponent {
  @ViewChild('cptWeightageGrid', { static: false })
  cptWeightageGrid!: DxDataGridComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];

  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  isAddPopupVisible = false;

  facilityList: any[] = [];

  menuPrevilage: any;

  selectedFacilityID: any;

  saveButtonOptions: any;
  facilitySelectOptions: any;

  cptWeightageData: any = [];
  originalCptWeightageData: any[] = [];

  isLoading: boolean = false;
  editedRows: any = [];
  IsWeightGlobal: boolean = false;

  historyPopupVisible: boolean = false;
  weighategHistoryData: any = [];

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

    const data = JSON.parse(localStorage.getItem('logData') || '');
    this.IsWeightGlobal = data.cptWeightGlobal;

    this.saveButtonOptions = {
      class: 'ms-2',
      text: 'Save',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.saveWeightageMaster(),
      elementAttr: { class: 'add-button' },
    };

    this.loadLookups();
    this.fetchCPTWeightageList();
    this.get_local_storage_data();
  }

  loadLookups() {
    this.dataService
      .get_UserWise_FacilityList_Data()
      .subscribe((response: any) => {
        this.facilityList = response.facilityDetails || [];

        if (this.facilityList.length === 1) {
          this.selectedFacilityID = this.facilityList[0].FacilityLicense;
        }
        this.facilitySelectOptions = {
          dataSource: this.facilityList,
          displayExpr: 'FacilityName',
          valueExpr: 'FacilityLicense',
          value: this.selectedFacilityID,
          width: 250,
          searchEnabled: true,
          onValueChanged: (e: any) => {
            this.selectedFacilityID = e.value;
            this.onFacilityChanged(e);
          },
        };
      });
  }

  fetchCPTWeightageList() {
    this.cptWeightageData = new DataSource({
      load: () =>
        new Promise((resolve, reject) => {
          this.masterService
            .get_CPT_Weightage_List(this.selectedFacilityID || '')
            .subscribe({
              next: (response: any) => {
                if (response.flag === '1') {
                  const data = (response.data || []).map(
                    (item: any, index: number) => ({
                      ...item,
                      SerialNumber: index + 1,
                      NewWeightage:
                        item.NewWeightage > 0 ? item.NewWeightage : null,
                    }),
                  );

                  this.cptWeightageData = data;
                  this.originalCptWeightageData = JSON.parse(
                    JSON.stringify(data),
                  );

                  resolve(data);
                } else {
                  notify('Failed to load CPT Weightage List', 'error', 2000);
                  reject('Failed to load CPT Weightage List');
                }
              },
              error: (error) => {
                notify(
                  'An error occurred while fetching CPT Weightage List',
                  'error',
                  2000,
                );
                reject(error);
              },
            });
        }),
    });
  }

  onHistoryClick(e: any) {
    const ID = e.row.data.CPTID;
    this.isLoading = true;
    this.masterService.selectCptMaster(ID).subscribe((response: any) => {
      if (response.flag === '1') {
        this.weighategHistoryData = response.data[0].CPTWeightages || [];
        this.historyPopupVisible = true;
        this.isLoading = false;
      } else {
        notify('Failed to load Weightage History', 'error', 2000);
        this.isLoading = false;
      }
    });
  }

  onEditorPreparing(e: any) {
    if (e.parentType === 'dataRow' && e.dataField === 'NewEffectFrom') {
      delete e.editorOptions.min;
    }
  }

  validateNewEffectFrom = (e: any) => {
    if (!e.value) {
      return true;
    }

    const newEffectFrom = new Date(e.value);
    newEffectFrom.setHours(0, 0, 0, 0);

    const activeWeightage =
      e.data?.ActiveWeightage ?? e.row?.data?.ActiveWeightage;

    const activeEffectFrom =
      e.data?.ActiveEffectFrom ?? e.row?.data?.ActiveEffectFrom;
    if (!activeWeightage && !activeEffectFrom) {
      return true;
    }
    if (!activeEffectFrom) {
      return true;
    }

    const activeDate = new Date(activeEffectFrom);
    activeDate.setHours(0, 0, 0, 0);
    return newEffectFrom > activeDate;
  };

  onRowUpdated(e: any) {
    const originalRow = this.originalCptWeightageData.find(
      (x) => x.SerialNumber === e.data.SerialNumber,
    );

    if (!originalRow) {
      return;
    }

    const isModified =
      originalRow.NewWeightage !== e.data.NewWeightage ||
      new Date(originalRow.NewEffectFrom).getTime() !==
        new Date(e.data.NewEffectFrom).getTime();

    e.data.IsModified = isModified;
  }

  onRowPrepared(e: any) {
    if (e.rowType === 'data' && e.data?.IsModified) {
      e.rowElement.style.backgroundColor = '#77a692';
      e.rowElement.style.fontWeight = '600';
    }
  }

  onFacilityChanged(event: any) {
    this.selectedFacilityID = event.value;
    this.fetchCPTWeightageList();
  }

  saveWeightageMaster() {
    const modifiedRows = this.cptWeightageData.filter((row: any) => {
      const original = this.originalCptWeightageData.find(
        (x) => x.SerialNumber === row.SerialNumber,
      );

      if (!original) {
        return false;
      }

      return (
        original.NewWeightage !== row.NewWeightage ||
        this.getDate(original.NewEffectFrom) !== this.getDate(row.NewEffectFrom)
      );
    });

    if (modifiedRows.length === 0) {
      notify('No changes found', 'warning', 2000);
      return;
    }

    const payload = modifiedRows.map((x: any) => ({
      FacilityID: this.selectedFacilityID ? this.selectedFacilityID : null,
      CPTID: x.CPTID,
      Weightage: x.NewWeightage,
      EffectFrom: this.formatDate(x.NewEffectFrom),
      EffectTo: null,
    }));

    this.masterService
      .Insert_CPTWeightage_Data(payload)
      .subscribe((response: any) => {
        if (response.flag === '1') {
          notify('Weightage Master Saved Successfully', 'success', 2000);
          this.fetchCPTWeightageList();
        } else {
          notify('Failed to save Weightage Master', 'error', 2000);
        }
      });
  }

  getDate(value: any): string {
    if (!value) {
      return '';
    }

    return new Date(value).toISOString().split('T')[0];
  }

  formatDate(dateString: any) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  refresh = () => {
    this.cptWeightageGrid.instance.refresh();
    this.fetchCPTWeightageList();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onExporting(event: any) {
    this.service.exportDataGrid(event, 'Weightage-Master');
  }

  //======================Logcal storage Data ======================
  get_local_storage_data() {
    const data = JSON.parse(localStorage.getItem('logData') || '');
    this.IsWeightGlobal = data.cptWeightGlobal;
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
    DxLoadPanelModule,
  ],
  providers: [],
  exports: [],
  declarations: [CPTWeightageComponent],
})
export class CPTWeightageListModule {}
