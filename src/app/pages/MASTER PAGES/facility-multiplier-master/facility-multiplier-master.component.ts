import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild, AfterViewInit } from '@angular/core';
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
  DxTextBoxModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { DataSource } from 'devextreme/common/data';

@Component({
  selector: 'app-facility-multiplier-master',
  templateUrl: './facility-multiplier-master.component.html',
  styleUrls: ['./facility-multiplier-master.component.scss'],
  providers: [ReportService, DataService],
})
export class FacilityMultiplierMasterComponent implements AfterViewInit {
  @ViewChild('cptPriceGrid', { static: false })
  cptPriceGrid!: DxDataGridComponent;

  @ViewChild('historyGrid', { static: false })
  historyGrid!: DxDataGridComponent;

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

  // Added adjuster fields
  regionAdjuster: any = null;
  quaternaryAdjuster: any = null;

  saveButtonOptions: any;
  facilitySelectOptions: any;

  cptPriceData: any = [];
  originalCptPriceData: any[] = [];

  editedRows: any = [];
  IsGlobalPrice: boolean = false;

  PriceHistoryData: any = [];
  historyPopupVisible: boolean = false;

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

    this.saveButtonOptions = {
      class: 'ms-2',
      text: 'Save',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Save Multiplier Master',
      disabled: !this.menuPrevilage?.CanAdd,
      onClick: () => this.savePriceMaster(),
      elementAttr: { class: 'add-button' },
    };
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.get_local_storage_data();
      this.loadLookups();
    });
  }

  showLoading(message: string) {
    if (this.cptPriceGrid && this.cptPriceGrid.instance) {
      this.cptPriceGrid.instance.option('loadPanel.text', message);
      this.cptPriceGrid.instance.beginCustomLoading(message);
    }
  }

  hideLoading() {
    if (this.cptPriceGrid && this.cptPriceGrid.instance) {
      this.cptPriceGrid.instance.endCustomLoading();
    }
  }

  onHistoryPopupShown() {
    setTimeout(() => {
      this.historyGrid?.instance?.updateDimensions();
    }, 100);
  }

  loadLookups() {
    this.showLoading('Data Loading...');
    this.dataService.get_UserWise_FacilityList_Data().subscribe({
      next: (response: any) => {
        this.facilityList = response.facilityDetails || [];

        if (this.facilityList.length === 1) {
          this.selectedFacilityID = this.facilityList[0].FacilityLicense;
        }

        this.fetch_ADOC_Price_List();

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
        this.hideLoading();
      },
      error: (error: any) => {
        this.hideLoading();
        notify('Failed to load facility list', 'error', 2000);
      },
    });
  }

  fetch_ADOC_Price_List() {
    this.cptPriceData = new DataSource({
      load: () =>
        new Promise((resolve, reject) => {
          this.showLoading('Data Loading...');
          this.masterService
            .get_Facility_Multiplier_List(this.selectedFacilityID || '')
            .subscribe({
              next: (response: any) => {
                this.hideLoading();
                if (response.flag === 'true' || response.flag === '1') {
                  // Bind Top-Level fields
                  this.regionAdjuster = response.RegionAdjuster ?? null;
                  this.quaternaryAdjuster = response.QuaternaryAdjuster ?? null;

                  const data = (response.data || []).map(
                    (item: any, index: number) => ({
                      ...item,
                      SerialNumber: index + 1,
                      C_Multiplier: item.C_Multiplier,
                      P_Multiplier: item.P_Multiplier,
                      S_Multiplier: item.S_Multiplier,
                      D_Multiplier: item.D_Multiplier,
                      EffectFrom: item.EffectFrom,
                      EffectTo: item.EffectTo
                    }),
                  );

                  this.cptPriceData = data;

                  this.originalCptPriceData = JSON.parse(JSON.stringify(data));

                  resolve(data);
                } else {
                  notify('Failed to load Facility Multipliers', 'error', 2000);
                  reject('Failed to load Facility Multipliers');
                }
              },
              error: (error) => {
                this.hideLoading();
                notify(
                  'An error occurred while fetching Facility Multipliers',
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
    const ID = e.row.data.ReceiverID;
    this.showLoading('Data Loading...');
    this.masterService.selectCptMaster(ID).subscribe((response: any) => {
      if (response.flag === '1') {
        this.historyPopupVisible = true;
        this.hideLoading();
      } else {
        notify('Failed to load History', 'error', 2000);
        this.hideLoading();
      }
    });
  }

  onEditorPreparing(e: any) {
    if (e.parentType === 'dataRow' && e.dataField === 'EffectFrom') {
      delete e.editorOptions.min;
    }
  }

  validateNewEffectFrom = (e: any) => {
    if (!e.value) {
      return true;
    }

    const newEffectFrom = new Date(e.value);
    newEffectFrom.setHours(0, 0, 0, 0);

    const activeEffectFrom = e.row?.data?.EffectFrom;

    if (!activeEffectFrom) {
      return true;
    }

    const activeDate = new Date(activeEffectFrom);
    activeDate.setHours(0, 0, 0, 0);

    return newEffectFrom > activeDate;
  };

  onRowUpdated(e: any) {
    const originalRow = this.originalCptPriceData.find(
      (x) => x.SerialNumber === e.data.SerialNumber,
    );

    if (!originalRow) {
      return;
    }

    const origDate = originalRow.EffectFrom
      ? new Date(originalRow.EffectFrom).setHours(0, 0, 0, 0)
      : 0;
    const newDate = e.data.EffectFrom
      ? new Date(e.data.EffectFrom).setHours(0, 0, 0, 0)
      : 0;

    const isModified =
      originalRow.C_Multiplier !== e.data.C_Multiplier ||
      originalRow.P_Multiplier !== e.data.P_Multiplier ||
      originalRow.S_Multiplier !== e.data.S_Multiplier ||
      originalRow.D_Multiplier !== e.data.D_Multiplier ||
      origDate !== newDate;

    e.data.IsModified = isModified;

    const rowIndex = e.component.getRowIndexByKey(e.key);
    if (rowIndex >= 0) {
      const rowElements = e.component.getRowElement(rowIndex);
      if (rowElements) {
        const elements =
          rowElements.length !== undefined && !rowElements.style
            ? Array.from(rowElements as any)
            : [rowElements];
        elements.forEach((row: any) => {
          if (row && row.style) {
            if (isModified) {
              row.style.fontWeight = '600';
            } else {
              row.style.fontWeight = '';
            }
          }
        });
      }
    }
  }

  onRowPrepared(e: any) {
    if (e.rowType === 'data' && e.data?.IsModified) {
      e.rowElement.style.fontWeight = '600';
    }
  }

  onFacilityChanged(event: any) {
    this.selectedFacilityID = event.value;
    this.fetch_ADOC_Price_List();
  }

  savePriceMaster() {
    const gridDataSource = this.cptPriceGrid.instance.getDataSource();
    const gridItems = gridDataSource ? gridDataSource.items() : [];

    const modifiedRows = gridItems.filter((row: any) => {
      const original = this.originalCptPriceData.find(
        (x) => x.SerialNumber === row.SerialNumber,
      );

      if (!original) {
        return true;
      }

      return (
        original.C_Multiplier !== row.C_Multiplier ||
        original.P_Multiplier !== row.P_Multiplier ||
        original.S_Multiplier !== row.S_Multiplier ||
        original.D_Multiplier !== row.D_Multiplier ||
        this.getDate(original.EffectFrom) !== this.getDate(row.EffectFrom)
      );
    });

    if (modifiedRows.length === 0) {
      notify('No changes found', 'warning', 2000);
      // Wait, we might still want to save if regionAdjuster or quaternaryAdjuster changed. 
      // But let's proceed to save if any data is present to be safe, or just check those as well.
    }

    const payload = {
      FacilityID: this.selectedFacilityID ? this.selectedFacilityID : null,
      RegionAdjuster: this.regionAdjuster,
      QuaternaryAdjuster: this.quaternaryAdjuster,
      data: gridItems.map((x: any) => ({
        ReceiverID: x.ReceiverID,
        C_Multiplier: x.C_Multiplier,
        P_Multiplier: x.P_Multiplier,
        S_Multiplier: x.S_Multiplier,
        D_Multiplier: x.D_Multiplier,
        EffectFrom: this.formatDate(x.EffectFrom),
      }))
    };

    this.showLoading('Data Saving...');
    this.masterService.Insert_Facility_Multiplier_Data(payload).subscribe({
      next: (response: any) => {
        this.hideLoading();
        if (response.flag === '1' || response.flag === 'true') {
          notify('Multiplier Master Saved Successfully', 'success', 2000);
          this.fetch_ADOC_Price_List();
        } else {
          notify('Failed to save Multiplier Master', 'error', 2000);
        }
      },
      error: (error: any) => {
        this.hideLoading();
        notify('An error occurred while saving Multiplier Master', 'error', 2000);
      },
    });
  }

  getDate(value: any): string {
    if (!value) {
      return '';
    }

    return new Date(value).toISOString().split('T')[0];
  }

  formatDate(dateString: any) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  refresh = () => {
    this.cptPriceGrid.instance.refresh();
    this.fetch_ADOC_Price_List();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onExporting(event: any) {
    this.service.exportDataGrid(event, 'Facility-Multiplier-Master');
  }

  //======================Logcal storage Data ======================
  get_local_storage_data() {
    const data = JSON.parse(localStorage.getItem('logData') || '{}');
    this.IsGlobalPrice = data.cptPriceGlobal || false;
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
    DxTextBoxModule,
  ],
  declarations: [FacilityMultiplierMasterComponent],
})
export class FacilityMultiplierMasterModule {}
