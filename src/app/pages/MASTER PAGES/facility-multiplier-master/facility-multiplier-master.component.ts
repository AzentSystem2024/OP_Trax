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
  editButtonOptions: any;
  facilitySelectOptions: any;

  cptPriceData: any = [];
  originalCptPriceData: any[] = [];

  editedRows: any = [];
  IsGlobalPrice: boolean = false;
  isEditingEnabled: boolean = false;

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

    this.editButtonOptions = {
      class: 'ms-2',
      text: '',
      icon: 'edit',
      type: 'default',
      stylingMode: 'default',
      hint: 'Toggle Edit Mode',
      disabled: !this.menuPrevilage?.CanAdd,
      onClick: this.toggleEditMode,
      elementAttr: { class: 'edit-button' },
    };
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.get_local_storage_data();
      this.loadLookups();
    });
  }

  toggleEditMode = () => {
    this.isEditingEnabled = !this.isEditingEnabled;
    this.editButtonOptions = {
      ...this.editButtonOptions,
      icon: this.isEditingEnabled ? 'close' : 'edit',
    };
  };

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
                      NewC_Multiplier:
                        item.NewC_Multiplier > 0 ? item.NewC_Multiplier : null,
                      NewP_Multiplier:
                        item.NewP_Multiplier > 0 ? item.NewP_Multiplier : null,
                      NewS_Multiplier:
                        item.NewS_Multiplier > 0 ? item.NewS_Multiplier : null,
                      NewD_Multiplier:
                        item.NewD_Multiplier > 0 ? item.NewD_Multiplier : null,
                      C_Multiplier: item.C_Multiplier,
                      P_Multiplier: item.P_Multiplier,
                      S_Multiplier: item.S_Multiplier,
                      D_Multiplier: item.D_Multiplier,
                      EffectFrom: item.EffectFrom,
                      EffectTo: item.EffectTo,
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

    const activePrice = e.data?.P_Multiplier ?? e.row?.data?.P_Multiplier;
    const activeEffectFrom = e.data?.EffectFrom ?? e.row?.data?.EffectFrom;

    if (!activePrice && !activeEffectFrom) {
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
    const originalRow = this.originalCptPriceData.find(
      (x) => x.SerialNumber === e.data.SerialNumber,
    );

    if (!originalRow) {
      return;
    }

    const origDate = originalRow.NewEffectFrom
      ? new Date(originalRow.NewEffectFrom).setHours(0, 0, 0, 0)
      : 0;
    const newDate = e.data.NewEffectFrom
      ? new Date(e.data.NewEffectFrom).setHours(0, 0, 0, 0)
      : 0;

    const isModified =
      originalRow.NewC_Multiplier !== e.data.NewC_Multiplier ||
      originalRow.NewP_Multiplier !== e.data.NewP_Multiplier ||
      originalRow.NewS_Multiplier !== e.data.NewS_Multiplier ||
      originalRow.NewD_Multiplier !== e.data.NewD_Multiplier ||
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
              row.style.backgroundColor = '';
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
        return false;
      }

      return (
        original.NewC_Multiplier !== row.NewC_Multiplier ||
        original.NewP_Multiplier !== row.NewP_Multiplier ||
        original.NewS_Multiplier !== row.NewS_Multiplier ||
        original.NewD_Multiplier !== row.NewD_Multiplier ||
        this.getDate(original.NewEffectFrom) !== this.getDate(row.NewEffectFrom)
      );
    });

    if (modifiedRows.length === 0) {
      notify('No changes found', 'warning', 2000);
      return;
    }

    const payload = {
      FacilityID: this.selectedFacilityID,
      RegionAdjuster: this.regionAdjuster,
      QuaternaryAdjuster: this.quaternaryAdjuster,
      data: modifiedRows.map((x: any) => ({
        ReceiverID: x.ReceiverID,
        C_Multiplier: x.NewC_Multiplier,
        P_Multiplier: x.NewP_Multiplier,
        S_Multiplier: x.NewS_Multiplier,
        D_Multiplier: x.NewD_Multiplier,
        EffectFrom: this.formatDate(x.NewEffectFrom),
      })),
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
        notify(
          'An error occurred while saving Multiplier Master',
          'error',
          2000,
        );
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
