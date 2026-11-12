import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { NotificationService } from 'src/app/services/notification.service';
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

  @ViewChild('popupGrid', { static: false })
  popupGrid!: DxDataGridComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];

  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  isAddPopupVisible = false;

  facilityList: any[] = [];

  versionList: any[] = [];
  selectedVersion: string = '';
  versionValueExpr: any | undefined = 'DESCRIPTION';

  isSelectAll: boolean = false;

  menuPrevilage: any;

  selectedFacilityID: any;

  facilitySelectOptions: any;

  cptPriceData: any = [];
  originalCptPriceData: any[] = [];

  editedRows: any = [];
  IsGlobalPrice: boolean = false;

  PriceHistoryData: any = [];
  historyPopupVisible: boolean = false;

  globalEffectFromDate: any | null = null;
  isFilterApplied: boolean = false;
  isPopupFilterRowVisible: boolean = false;

  constructor(
    private masterService: MasterReportService,
    private service: ReportService,
    private route: ActivatedRoute,
    private dataService: DataService,
    private notificationService: NotificationService,
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
  }

  onAddClick = () => {
    this.globalEffectFromDate = new Date();
    this.isSelectAll = false;
    if (this.popupGrid && this.popupGrid.instance) {
      this.popupGrid.instance.cancelEditData();

      // Also manually clear any modifications to the underlying array that might have been committed
      if (Array.isArray(this.cptPriceData)) {
        this.cptPriceData.forEach((row: any) => {
          row.IsSelected = false;
          const orig = this.originalCptPriceData?.find(
            (x) => x.SerialNumber === row.SerialNumber,
          );
          if (orig) {
            row.NewPrice = orig.NewPrice;
            row.NewPaedAdjuster = orig.NewPaedAdjuster;
            row.NewSeniorAdjuster = orig.NewSeniorAdjuster;
            row.NewFollowUpAdjuster = orig.NewFollowUpAdjuster;
            row.NewNewPatientAdjuster = orig.NewNewPatientAdjuster;
            row.NewTeleMedicineAdjuster = orig.NewTeleMedicineAdjuster;
          }
        });
      }
    }
    this.isAddPopupVisible = true;
    setTimeout(() => {
      this.popupGrid?.instance?.updateDimensions();
    }, 150);
  };

  displayVersionExpr = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return (
      item.DESCRIPTION ||
      item.Description ||
      item.Name ||
      item.Version ||
      item.version ||
      item.ID ||
      ''
    );
  };

  ngAfterViewInit() {
    setTimeout(() => {
      this.get_local_storage_data();
      this.get_ADOC_VERSION_Dropdown();
    });
  }

  get_ADOC_VERSION_Dropdown(): void {
    this.showLoading('Loading ADOC Versions...');
    this.masterService.Get_GropDown('ADOC_VERSION').subscribe({
      next: (response: any) => {
        this.versionList = Array.isArray(response)
          ? response
          : response?.data || [];
        if (this.versionList.length > 0) {
          const latestItem =
            [...this.versionList].sort((a: any, b: any) => {
              const idA = a?.ID !== undefined ? Number(a.ID) : 0;
              const idB = b?.ID !== undefined ? Number(b.ID) : 0;
              if (idA !== idB) return idB - idA;
              const descA = parseFloat(a?.DESCRIPTION || '0');
              const descB = parseFloat(b?.DESCRIPTION || '0');
              return descB - descA;
            })[0] || this.versionList[this.versionList.length - 1];

          if (latestItem && typeof latestItem === 'object') {
            this.versionValueExpr =
              latestItem.DESCRIPTION !== undefined
                ? 'DESCRIPTION'
                : latestItem.ID !== undefined
                  ? 'ID'
                  : undefined;
            const val =
              latestItem.DESCRIPTION !== undefined
                ? latestItem.DESCRIPTION
                : latestItem.ID !== undefined
                  ? latestItem.ID
                  : '';
            this.selectedVersion = String(val);
          } else {
            this.versionValueExpr = undefined;
            this.selectedVersion = String(latestItem ?? '');
          }
        }
        this.hideLoading();
        this.fetch_ADOC_Price_List();
      },
      error: (error: any) => {
        this.hideLoading();
        this.notificationService.showNotification(
          'Failed to load ADOC Version dropdown',
          'error',
        );
        this.fetch_ADOC_Price_List();
      },
    });
  }

  onVersionChanged(event: any) {
    if (event.event) {
      this.selectedVersion =
        event.value && typeof event.value === 'object'
          ? String(
              event.value.DESCRIPTION ||
                event.value.Description ||
                event.value.Name ||
                event.value.ID ||
                '',
            )
          : event.value != null
            ? String(event.value)
            : '';
      this.fetch_ADOC_Price_List();
    }
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
    this.showLoading('Loading Facility List...');
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
        this.notificationService.showNotification(
          'Failed to load facility list',
          'error',
        );
      },
    });
  }

  parseRealValue(val: any): number | null {
    if (val === null || val === undefined || val === '') {
      return null;
    }
    if (typeof val === 'object') {
      if (val.parsedValue !== undefined && val.parsedValue !== null) {
        const p = Number(val.parsedValue);
        return isNaN(p) ? null : p;
      }
      if (val.source !== undefined && val.source !== null) {
        const s = Number(val.source);
        return isNaN(s) ? null : s;
      }
    }
    const n = Number(val);
    return isNaN(n) ? null : n;
  }

  fetch_ADOC_Price_List() {
    this.cptPriceData = new DataSource({
      load: () =>
        new Promise((resolve, reject) => {
          this.showLoading('Fetching ADOC Price List...');
          const versionParam =
            this.selectedVersion && typeof this.selectedVersion === 'object'
              ? String(
                  (this.selectedVersion as any).DESCRIPTION ||
                    (this.selectedVersion as any).Description ||
                    (this.selectedVersion as any).Name ||
                    (this.selectedVersion as any).ID ||
                    '',
                )
              : this.selectedVersion != null
                ? String(this.selectedVersion)
                : '';
          this.masterService.get_ADOC_Price_List(versionParam).subscribe({
            next: (response: any) => {
              this.hideLoading();
              let rawData =
                response?.data !== undefined ? response.data : response;
              if (typeof rawData === 'string') {
                try {
                  rawData = JSON.parse(rawData);
                } catch (e) {}
              }
              let list: any[] = [];
              if (Array.isArray(rawData)) {
                list = rawData;
              } else if (rawData && typeof rawData === 'object') {
                list = Object.values(rawData);
              }

              if (
                response?.flag === '1' ||
                list.length > 0 ||
                (response && !response.error)
              ) {
                const data = list.map((item: any, index: number) => {
                  const price = this.parseRealValue(item.Price);
                  const paed = this.parseRealValue(item.PaedAdjuster);
                  const senior = this.parseRealValue(item.SeniorAdjuster);
                  const followUp = this.parseRealValue(item.FollowUpAdjuster);
                  const newPatient = this.parseRealValue(item.NewPatientAdjuster);
                  const teleMed = this.parseRealValue(item.TeleMedicineAdjuster);

                  const newPrice = this.parseRealValue(item.NewPrice);
                  const newPaed = this.parseRealValue(item.NewPaedAdjuster);
                  const newSenior = this.parseRealValue(item.NewSeniorAdjuster);
                  const newFollowUp = this.parseRealValue(item.NewFollowUpAdjuster);
                  const newNewPatient = this.parseRealValue(
                    item.NewNewPatientAdjuster ?? item.NewPatientAdjusterNew,
                  );
                  const newTeleMed = this.parseRealValue(
                    item.NewTeleMedicineAdjuster ?? item.TeleMedicineAdjusterNew,
                  );

                  const version =
                    item.ADOCVersion !== null && item.ADOCVersion !== undefined
                      ? item.ADOCVersion
                      : this.selectedVersion;

                  return {
                    ...item,
                    SerialNumber: index + 1,
                    ID: item.ID || item.PriceID || 0,
                    ADOCClassID: item.ADOCClassID,
                    ADOCClassName: item.ADOCClassName,
                    ADOCVersion: version,
                    Price: price,
                    PaedAdjuster: paed,
                    SeniorAdjuster: senior,
                    FollowUpAdjuster: followUp,
                    NewPatientAdjuster: newPatient,
                    TeleMedicineAdjuster: teleMed,
                    NewPrice:
                      newPrice !== null && newPrice > 0 ? newPrice : null,
                    NewPaedAdjuster:
                      newPaed !== null && newPaed > 0 ? newPaed : null,
                    NewSeniorAdjuster:
                      newSenior !== null && newSenior > 0 ? newSenior : null,
                    NewFollowUpAdjuster:
                      newFollowUp !== null && newFollowUp > 0
                        ? newFollowUp
                        : null,
                    NewNewPatientAdjuster:
                      newNewPatient !== null && newNewPatient > 0
                        ? newNewPatient
                        : null,
                    NewTeleMedicineAdjuster:
                      newTeleMed !== null && newTeleMed > 0 ? newTeleMed : null,
                  };
                });

                this.cptPriceData = data;
                this.originalCptPriceData = JSON.parse(JSON.stringify(data));
                resolve(data);
              } else {
                this.notificationService.showNotification(
                  'Failed to load ADOC Price List',
                  'error',
                );
                reject('Failed to load ADOC Price List');
              }
            },
            error: (error) => {
              this.hideLoading();
              this.notificationService.showNotification(
                'An error occurred while fetching ADOC Price List',
                'error',
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
    this.masterService.get_Price_History_List(ID).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.PriceHistoryData = response.data;
          console.log(this.PriceHistoryData);
          this.historyPopupVisible = true;
          this.hideLoading();
        } else {
          this.notificationService.showNotification(
            'Failed to load Price History',
            'error',
          );
          this.hideLoading();
        }
      },
      error: (error: any) => {
        this.hideLoading();
        this.notificationService.showNotification(
          'An error occurred while fetching Price History',
          'error',
        );
      },
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
    const activeEffectFrom = e.data?.EffectFrom ?? e.row?.data?.EffectFrom;

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

    const origDate = originalRow.NewEffectFrom
      ? new Date(originalRow.NewEffectFrom).setHours(0, 0, 0, 0)
      : 0;
    const newDate = e.data.NewEffectFrom
      ? new Date(e.data.NewEffectFrom).setHours(0, 0, 0, 0)
      : 0;

    const isModified =
      originalRow.NewPrice !== e.data.NewPrice ||
      originalRow.NewPaedAdjuster !== e.data.NewPaedAdjuster ||
      originalRow.NewSeniorAdjuster !== e.data.NewSeniorAdjuster ||
      originalRow.NewFollowUpAdjuster !== e.data.NewFollowUpAdjuster ||
      originalRow.NewNewPatientAdjuster !== e.data.NewNewPatientAdjuster ||
      originalRow.NewTeleMedicineAdjuster !== e.data.NewTeleMedicineAdjuster ||
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

  async savePriceMaster() {
    if (this.popupGrid && this.popupGrid.instance) {
      await this.popupGrid.instance.saveEditData();
    }

    const modifiedRows = this.cptPriceData.filter((row: any) => {
      const original = this.originalCptPriceData.find(
        (x) => x.SerialNumber === row.SerialNumber,
      );

      if (!original) {
        return false;
      }

      const isModified =
        original.NewPrice !== row.NewPrice ||
        original.NewPaedAdjuster !== row.NewPaedAdjuster ||
        original.NewSeniorAdjuster !== row.NewSeniorAdjuster ||
        original.NewFollowUpAdjuster !== row.NewFollowUpAdjuster ||
        original.NewNewPatientAdjuster !== row.NewNewPatientAdjuster ||
        original.NewTeleMedicineAdjuster !== row.NewTeleMedicineAdjuster ||
        row.IsSelected === true ||
        this.getDate(original.NewEffectFrom) !==
          this.getDate(row.NewEffectFrom);

      return isModified;
    });

    if (modifiedRows.length === 0) {
      this.notificationService.showNotification('No changes found', 'warning');
      return;
    }

    if (!this.globalEffectFromDate) {
      this.notificationService.showNotification(
        'Please select an Effect From date',
        'error',
      );
      return;
    }

    let dateError = false;
    for (const row of modifiedRows) {
      const activeEffectFrom = row.EffectFrom;
      if (activeEffectFrom) {
        const activeDate = new Date(activeEffectFrom);
        activeDate.setHours(0, 0, 0, 0);
        const newDate = new Date(this.globalEffectFromDate);
        newDate.setHours(0, 0, 0, 0);
        if (newDate <= activeDate) {
          dateError = true;
          break;
        }
      }
    }

    if (dateError) {
      this.notificationService.showNotification(
        'Effect From date must be strictly greater than current active dates',
        'error',
      );
      return;
    }

    const getVal = (newVal: any, activeVal: any): number => {
      if (newVal !== null && newVal !== undefined && newVal !== '') {
        const n = Number(newVal);
        return isNaN(n) ? 0 : n;
      }
      if (activeVal !== null && activeVal !== undefined && activeVal !== '') {
        const n = Number(activeVal);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };

    const payload = modifiedRows.map((x: any) => {
      const versionVal = x.ADOCVersion ?? this.selectedVersion ?? 0;
      const adocVersion =
        !isNaN(Number(versionVal)) && versionVal !== ''
          ? Number(versionVal)
          : versionVal;

      return {
        ID: x.ID ? Number(x.ID) : 0,
        ADOCClassID: Number(x.ADOCClassID) || 0,
        Price: getVal(x.NewPrice, x.Price),
        PaedAdjuster: getVal(x.NewPaedAdjuster, x.PaedAdjuster),
        SeniorAdjuster: getVal(x.NewSeniorAdjuster, x.SeniorAdjuster),
        FollowUpAdjuster: getVal(x.NewFollowUpAdjuster, x.FollowUpAdjuster),
        NewPatientAdjuster: getVal(x.NewNewPatientAdjuster, x.NewPatientAdjuster),
        TeleMedicineAdjuster: getVal(x.NewTeleMedicineAdjuster, x.TeleMedicineAdjuster),
        ADOCVersion: adocVersion,
        EffectTo: x.EffectTo ? new Date(x.EffectTo).toISOString() : null,
      };
    });

    this.showLoading('Saving ADOC Class Price Master...');
    this.masterService.Insert_PriceMaster_Data(payload).subscribe({
      next: (response: any) => {
        this.hideLoading();
        if (response.flag === '1') {
          this.notificationService.showNotification(
            'Price Master Saved Successfully',
            'success',
          );
          this.fetch_ADOC_Price_List();
        } else {
          this.notificationService.showNotification(
            'Failed to save Price Master',
            'error',
          );
        }
      },
      error: (error: any) => {
        this.hideLoading();
        this.notificationService.showNotification(
          'An error occurred while saving Price Master',
          'error',
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
    const date = dateString ? new Date(dateString) : new Date();
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

  togglePopupFilterRow = () => {
    this.isPopupFilterRowVisible = !this.isPopupFilterRowVisible;
  };

  onSelectAllChanged(e: any) {
    if (!e.event) return;
    const isChecked = !!e.value;
    this.isSelectAll = isChecked;

    if (!Array.isArray(this.cptPriceData)) return;

    this.cptPriceData.forEach((row: any) => {
      row.IsSelected = isChecked;
      if (isChecked) {
        row.NewPrice = row.Price ?? 0;
        row.NewPaedAdjuster = row.PaedAdjuster ?? 0;
        row.NewSeniorAdjuster = row.SeniorAdjuster ?? 0;
        row.NewFollowUpAdjuster = row.FollowUpAdjuster ?? 0;
        row.NewNewPatientAdjuster = row.NewPatientAdjuster ?? 0;
        row.NewTeleMedicineAdjuster = row.TeleMedicineAdjuster ?? 0;
      } else {
        row.NewPrice = null;
        row.NewPaedAdjuster = null;
        row.NewSeniorAdjuster = null;
        row.NewFollowUpAdjuster = null;
        row.NewNewPatientAdjuster = null;
        row.NewTeleMedicineAdjuster = null;
      }
    });

    if (this.popupGrid?.instance) {
      this.popupGrid.instance.refresh();
    }
  }

  onCheckboxChanged = (e: any, cell: any) => {
    const isChecked = !!e.value;
    cell.data.IsSelected = isChecked;

    const price = isChecked ? (cell.data.Price ?? 0) : null;
    const paed = isChecked ? (cell.data.PaedAdjuster ?? 0) : null;
    const senior = isChecked ? (cell.data.SeniorAdjuster ?? 0) : null;
    const followUp = isChecked ? (cell.data.FollowUpAdjuster ?? 0) : null;
    const newPatient = isChecked ? (cell.data.NewPatientAdjuster ?? 0) : null;
    const teleMed = isChecked ? (cell.data.TeleMedicineAdjuster ?? 0) : null;

    cell.data.NewPrice = price;
    cell.data.NewPaedAdjuster = paed;
    cell.data.NewSeniorAdjuster = senior;
    cell.data.NewFollowUpAdjuster = followUp;
    cell.data.NewNewPatientAdjuster = newPatient;
    cell.data.NewTeleMedicineAdjuster = teleMed;

    if (cell.component && cell.rowIndex !== undefined && cell.rowIndex >= 0) {
      cell.component.cellValue(cell.rowIndex, 'NewPrice', price);
      cell.component.cellValue(cell.rowIndex, 'NewPaedAdjuster', paed);
      cell.component.cellValue(cell.rowIndex, 'NewSeniorAdjuster', senior);
      cell.component.cellValue(cell.rowIndex, 'NewFollowUpAdjuster', followUp);
      cell.component.cellValue(
        cell.rowIndex,
        'NewNewPatientAdjuster',
        newPatient,
      );
      cell.component.cellValue(
        cell.rowIndex,
        'NewTeleMedicineAdjuster',
        teleMed,
      );
    }
    this.updateSelectAllState();
  };

  updateSelectAllState() {
    if (!Array.isArray(this.cptPriceData) || this.cptPriceData.length === 0) {
      this.isSelectAll = false;
      return;
    }
    this.isSelectAll = this.cptPriceData.every(
      (x: any) => x.IsSelected === true,
    );
  }

  onGridOptionChanged(e: any) {
    if (e.fullName && e.fullName.toLowerCase().includes('filter')) {
      setTimeout(() => {
        if (this.cptPriceGrid && this.cptPriceGrid.instance) {
          this.isFilterApplied =
            !!this.cptPriceGrid.instance.getCombinedFilter();
        }
      });
    }
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
  declarations: [AdocPriceMasterComponent],
})
export class AdocPriceMasterModule {}
