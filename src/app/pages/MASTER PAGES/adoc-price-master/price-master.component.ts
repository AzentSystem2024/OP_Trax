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
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { DataSource } from 'devextreme/common/data';

@Component({
  selector: 'app-adoc-price-master',
  templateUrl: './price-master.component.html',
  styleUrl: './price-master.component.scss',
  providers: [ReportService, DataService],
})
export class AdocPriceMasterComponent implements AfterViewInit {
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

  saveButtonOptions: any;
  facilitySelectOptions: any;

  cptPriceData: any = [];
  originalCptPriceData: any[] = [];

  editedRows: any = [];
  IsGlobalPrice: boolean = false;

  PriceHistoryData: any = [];
  historyPopupVisible: boolean = false;
  isEditingEnabled: boolean = false;
  editButtonOptions: any;

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
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
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
      disabled: !this.menuPrevilage.CanAdd,
      onClick: this.toggleEditMode,
      elementAttr: { class: 'edit-button' },
    };

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.get_local_storage_data();
      this.fetch_ADOC_Price_List();
    });
  }

  toggleEditMode = () => {
    this.isEditingEnabled = !this.isEditingEnabled;
    this.editButtonOptions = {
      ...this.editButtonOptions,
      icon: this.isEditingEnabled ? 'close' : 'edit'
    };
    
    if (!this.isEditingEnabled) {
      // this.refresh();
    }
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
    this.showLoading('Loading Facility List...');
    this.dataService
      .get_UserWise_FacilityList_Data()
      .subscribe({
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
        }
      });
  }

  fetch_ADOC_Price_List() {
    this.cptPriceData = new DataSource({
      load: () =>
        new Promise((resolve, reject) => {
          this.showLoading('Fetching ADOC Price List...');
          this.masterService
            .get_ADOC_Price_List()
            .subscribe({
              next: (response: any) => {
                this.hideLoading();
                if (response.flag === '1') {
                  const data = (response.data || []).map(
                    (item: any, index: number) => ({
                      ...item,
                      SerialNumber: index + 1,
                      NewPrice: item.NewPrice > 0 ? item.NewPrice : null,
                      NewPaedAdjuster:
                        item.NewPaedAdjuster > 0 ? item.NewPaedAdjuster : null,
                      NewSeniorAdjuster:
                        item.NewSeniorAdjuster > 0
                          ? item.NewSeniorAdjuster
                          : null,
                    }),
                  );

                  this.cptPriceData = data;

                  this.originalCptPriceData = JSON.parse(JSON.stringify(data));

                  resolve(data);
                } else {
                  notify('Failed to load CPT Price List', 'error', 2000);
                  reject('Failed to load CPT Price List');
                }
              },
              error: (error) => {
                this.hideLoading();
                notify(
                  'An error occurred while fetching CPT Price List',
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
    const ID = e.row.data.ADOCClassID;
    this.showLoading('Loading History...');
    this.masterService.selectCptMaster(ID).subscribe((response: any) => {
      if (response.flag === '1') {
     
        // this.PriceHistoryData = response.data[0].CPTPrices || response.data[0].Prices || response.data[0].ADOCClassPrices || [];
        this.historyPopupVisible = true;
        this.hideLoading();
      } else {
        notify('Failed to load Price History', 'error', 2000);
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

    const activePrice = e.data?.Price ?? e.row?.data?.Price;
    const activeEffectFrom =
      e.data?.EffectFrom ?? e.row?.data?.EffectFrom;

    // Initial setup - no active record exists
    if (!activePrice && !activeEffectFrom) {
      return true;
    }

    // If ActiveEffectFrom is missing, allow save
    if (!activeEffectFrom) {
      return true;
    }

    const activeDate = new Date(activeEffectFrom);
    activeDate.setHours(0, 0, 0, 0);

    // New date must be greater than active date
    return newEffectFrom > activeDate;
  };

  onRowUpdated(e: any) {
    const originalRow = this.originalCptPriceData.find(
      (x) => x.SerialNumber === e.data.SerialNumber,
    );

    if (!originalRow) {
      return;
    }

    const origDate = originalRow.NewEffectFrom ? new Date(originalRow.NewEffectFrom).setHours(0, 0, 0, 0) : 0;
    const newDate = e.data.NewEffectFrom ? new Date(e.data.NewEffectFrom).setHours(0, 0, 0, 0) : 0;

    const isModified =
      originalRow.NewPrice !== e.data.NewPrice ||
      originalRow.NewPaedAdjuster !== e.data.NewPaedAdjuster ||
      originalRow.NewSeniorAdjuster !== e.data.NewSeniorAdjuster ||
      origDate !== newDate;

    e.data.IsModified = isModified;

    const rowIndex = e.component.getRowIndexByKey(e.key);
    if (rowIndex >= 0) {
      const rowElements = e.component.getRowElement(rowIndex);
      if (rowElements) {
        const elements = rowElements.length !== undefined && !rowElements.style ? Array.from(rowElements as any) : [rowElements];
        elements.forEach((row: any) => {
          if (row && row.style) {
            if (isModified) {
              // row.style.backgroundColor = '#77a692';
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
      // e.rowElement.style.backgroundColor = '#77a692';
      e.rowElement.style.fontWeight = '600';
    }
  }

  onFacilityChanged(event: any) {
    this.selectedFacilityID = event.value;
    this.fetch_ADOC_Price_List();
  }

  savePriceMaster() {
    const modifiedRows = this.cptPriceData.filter((row: any) => {
      const original = this.originalCptPriceData.find(
        (x) => x.SerialNumber === row.SerialNumber,
      );

      if (!original) {
        return false;
      }

      return (
        original.NewPrice !== row.NewPrice ||
        original.NewPaedAdjuster !== row.NewPaedAdjuster ||
        original.NewSeniorAdjuster !== row.NewSeniorAdjuster ||
        this.getDate(original.NewEffectFrom) !== this.getDate(row.NewEffectFrom)
      );
    });

    if (modifiedRows.length === 0) {
      notify('No changes found', 'warning', 2000);
      return;
    }

    const payload = modifiedRows.map((x: any) => ({
      FacilityID: this.selectedFacilityID ? this.selectedFacilityID : null,
      ADOCClassID: x.ADOCClassID,
      Price: x.NewPrice,
      PaedAdjuster: x.NewPaedAdjuster,
      SeniorAdjuster: x.NewSeniorAdjuster,
      EffectFrom: this.formatDate(x.NewEffectFrom),
      EffectTo: null,
    }));

    this.showLoading('Saving ADOC Class Price Master...');
    this.masterService
      .Insert_PriceMaster_Data(payload)
      .subscribe({
        next: (response: any) => {
          this.hideLoading();
          if (response.flag === '1') {
            notify('Price Master Saved Successfully', 'success', 2000);
            this.fetch_ADOC_Price_List();
          } else {
            notify('Failed to save Price Master', 'error', 2000);
          }
        },
        error: (error: any) => {
          this.hideLoading();
          notify('An error occurred while saving Price Master', 'error', 2000);
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
    this.cptPriceGrid.instance.refresh();
    this.fetch_ADOC_Price_List();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onExporting(event: any) {
    this.service.exportDataGrid(event, 'Price-Master');
  }

  //======================Logcal storage Data ======================
  get_local_storage_data() {
    const data = JSON.parse(localStorage.getItem('logData') || '');
    console.log('Retrieved log data from local storage:', data);
    this.IsGlobalPrice = data.cptPriceGlobal;
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
  declarations: [AdocPriceMasterComponent],
})
export class AdocPriceMasterModule {}
