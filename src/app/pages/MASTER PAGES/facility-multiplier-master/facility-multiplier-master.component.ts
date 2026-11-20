import { CommonModule } from '@angular/common';
import {
  Component,
  NgModule,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
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
  DxTooltipModule,
} from 'devextreme-angular';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs';

export interface ImportedMultiplierRow {
  SerialNumber?: number;
  Facility: string;
  FacilityID: string;
  isValidFacility: boolean;
  facilityError?: string;

  Receiver: string;
  ReceiverID: number;
  isValidReceiver: boolean;
  receiverError?: string;

  ServiceCategory: string;
  ServiceCategoryID: number;
  isValidCategory: boolean;
  serviceCategoryError?: string;

  CPT: string;
  isValidCpt: boolean;
  cptError?: string;

  Multiplier: any;
  isValidMultiplier: boolean;
  multiplierError?: string;

  hasError: boolean;
}

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

  @ViewChild('importDataGrid', { static: false })
  importDataGrid!: DxDataGridComponent;

  @ViewChild('importFileInput', { static: false })
  importFileInput!: ElementRef;

  readonly allowedPageSizes: any = [5, 10, 'all'];

  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;

  facilityList: any[] = [];

  menuPrevilage: any;

  selectedFacilityID: any;

  // Added adjuster fields
  regionAdjuster: any = null;
  quaternaryAdjuster: any = null;

  saveButtonOptions: any;
  editButtonOptions: any;
  addRowButtonOptions: any;
  importButtonOptions: any;
  facilitySelectOptions: any;

  cptPriceData: any = [];
  originalCptPriceData: any[] = [];

  editedRows: any = [];
  IsGlobalPrice: boolean = false;
  isEditingEnabled: boolean = false;

  PriceHistoryData: any = [];
  historyPopupVisible: boolean = false;
  isFilterApplied: boolean = false;

  receiverDataSource: any[] = [];
  serviceCategoryDataSource: any[] = [];

  // Import Popup properties
  importPopupVisible: boolean = false;
  importedGridData: ImportedMultiplierRow[] = [];
  importedFileName: string = '';
  hasImportErrors: boolean = false;
  clickedCellElement: any = null;
  clickedCellErrorMessage: string = '';
  cellTooltipVisible: boolean = false;

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
      if (this.editButtonOptions) {
        this.editButtonOptions.disabled = this.menuPrevilage
          ? !this.menuPrevilage.CanEdit && !this.menuPrevilage.CanAdd
          : false;
      }
      if (this.importButtonOptions) {
        this.importButtonOptions.disabled = this.menuPrevilage
          ? !this.menuPrevilage.CanEdit && !this.menuPrevilage.CanAdd
          : false;
      }
    });

    this.importButtonOptions = {
      text: 'Import',
      icon: 'import',
      hint: 'Import Facility Multipliers from Excel',
      stylingMode: 'text',
      elementAttr: { class: 'commonButtons' },
      disabled: this.menuPrevilage
        ? !this.menuPrevilage.CanEdit && !this.menuPrevilage.CanAdd
        : false,
      onClick: () => this.openImportPopup(),
    };

    this.saveButtonOptions = {
      class: 'ms-2',
      text: 'Save',
      icon: 'save',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Save Multiplier Master',
      disabled: !this.menuPrevilage?.CanAdd && !this.menuPrevilage?.CanEdit,
      onClick: () => this.savePriceMaster(),
      elementAttr: { class: 'add-button' },
    };

    this.addRowButtonOptions = {
      text: '',
      icon: 'add',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new multiplier row to top',
      elementAttr: { class: 'add-row-button' },
      onClick: () => this.addNewRow(),
    };

    this.editButtonOptions = {
      text: 'Edit',
      icon: 'edit',
      hint: 'Edit Multipliers',
      stylingMode: 'text',
      elementAttr: { class: 'commonButtons' },
      disabled: this.menuPrevilage
        ? !this.menuPrevilage.CanEdit && !this.menuPrevilage.CanAdd
        : false,
      onClick: this.toggleEditMode,
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
    this.updateEditButtonOptions();
    if (!this.isEditingEnabled) {
      this.fetch_Facility_multiplier_list();
    } else {
      if (this.cptPriceGrid?.instance) {
        this.cptPriceGrid.instance.clearSorting();
      }
    }
  };

  updateEditButtonOptions() {
    this.editButtonOptions = {
      ...this.editButtonOptions,
      text: this.isEditingEnabled ? 'Cancel' : 'Edit',
      icon: this.isEditingEnabled ? 'close' : 'edit',
      hint: this.isEditingEnabled ? 'Cancel Edit' : 'Edit Multipliers',
      type: this.isEditingEnabled ? 'danger' : 'normal',
      stylingMode: this.isEditingEnabled ? 'contained' : 'text',
      elementAttr: {
        class: this.isEditingEnabled ? 'cancel-edit-btn' : 'commonButtons',
      },
    };
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
    this.loadDropdowns();
    this.dataService.get_UserWise_FacilityList_Data().subscribe({
      next: (response: any) => {
        this.facilityList = response.facilityDetails || [];

        if (this.facilityList.length === 1) {
          this.selectedFacilityID = this.facilityList[0].FacilityLicense;
        }

        this.fetch_Facility_multiplier_list();

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

  fetch_Facility_multiplier_list() {
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

            const rawData = response.data || [];
            const data = rawData.map((item: any, index: number) => {
              let recId = item.ReceiverID;
              if (recId != null && !isNaN(Number(recId)) && Number(recId) > 0) {
                recId = Number(recId);
              } else {
                const recName = item.ReceiverName || item.Receiver;
                if (recName && this.receiverDataSource?.length) {
                  const found = this.receiverDataSource.find(
                    (r: any) =>
                      (r.DESCRIPTION || '').toLowerCase() ===
                        String(recName).toLowerCase() ||
                      (r.ReceiverName || '').toLowerCase() ===
                        String(recName).toLowerCase(),
                  );
                  if (found) {
                    recId = found.ID;
                  }
                }
              }

              let catId = item.ServiceCategoryID ?? item.CPTCategoryID;
              if (catId != null && !isNaN(Number(catId)) && Number(catId) > 0) {
                catId = Number(catId);
              } else {
                const catName =
                  item.ServiceCategory || item.CategoryName || catId;
                if (catName && this.serviceCategoryDataSource?.length) {
                  const found = this.serviceCategoryDataSource.find(
                    (s: any) =>
                      (s.DESCRIPTION || '').toLowerCase() ===
                      String(catName).toLowerCase(),
                  );
                  if (found) {
                    catId = found.ID;
                  }
                }
              }

              return {
                ...item,
                SerialNumber: index + 1,
                FacilityID: item.FacilityID || this.selectedFacilityID,
                ReceiverID:
                  recId != null && !isNaN(Number(recId))
                    ? Number(recId)
                    : item.ReceiverID != null && !isNaN(Number(item.ReceiverID))
                      ? Number(item.ReceiverID)
                      : null,
                ServiceCategoryID:
                  catId != null && !isNaN(Number(catId))
                    ? Number(catId)
                    : item.ServiceCategoryID != null &&
                        !isNaN(Number(item.ServiceCategoryID))
                      ? Number(item.ServiceCategoryID)
                      : null,
                CPT: item.CPT || '',
                Multiplier:
                  item.Multiplier != null && !isNaN(Number(item.Multiplier))
                    ? Number(item.Multiplier)
                    : null,
                IsModified: false,
              };
            });

            this.cptPriceData = data;
            this.originalCptPriceData = JSON.parse(JSON.stringify(data));
          } else {
            this.cptPriceData = [];
            this.originalCptPriceData = [];
            this.notificationService.showNotification(
              'Failed to load Facility Multipliers',
              'error',
            );
          }
        },
        error: (error) => {
          this.hideLoading();
          this.cptPriceData = [];
          this.originalCptPriceData = [];
          this.notificationService.showNotification(
            'An error occurred while fetching Facility Multipliers',
            'error',
          );
        },
      });
  }

  onHistoryClick(e: any) {
    const ID = e.row.data.ReceiverID;
    const FacilityID = this.selectedFacilityID;
    this.showLoading('Data Loading...');
    this.masterService
      .get_Facility_Multiplier_History_List(ID, FacilityID)
      .subscribe({
        next: (response: any) => {
          if (response.flag === '1' || response.flag === 'true') {
            this.PriceHistoryData = response.data;
            this.historyPopupVisible = true;
            this.hideLoading();
          } else {
            this.notificationService.showNotification(
              'Failed to load History',
              'error',
            );
            this.hideLoading();
          }
        },
        error: (error: any) => {
          this.hideLoading();
          this.notificationService.showNotification(
            'An error occurred while fetching History',
            'error',
          );
        },
      });
  }

  isAutoAddingRow: boolean = false;

  onEditorPreparing(e: any) {
    if (!this.isEditingEnabled) {
      e.cancel = true;
      return;
    }
    if (e.parentType === 'dataRow' && e.dataField === 'NewEffectFrom') {
      delete e.editorOptions.min;
    }

    const monitoredFields = [
      'ReceiverID',
      'ServiceCategoryID',
      'CPT',
      'Multiplier',
    ];
    if (e.parentType === 'dataRow' && monitoredFields.includes(e.dataField)) {
      const field = e.dataField;

      const origOnValueChanged = e.editorOptions.onValueChanged;
      e.editorOptions.onValueChanged = (args: any) => {
        if (origOnValueChanged) {
          origOnValueChanged(args);
        }
        if (e.row?.data) {
          e.row.data[field] = args.value;
          e.row.data.IsModified = true;
        }
      };

      const origOnKeyDown = e.editorOptions.onKeyDown;
      e.editorOptions.onKeyDown = (args: any) => {
        if (origOnKeyDown) {
          origOnKeyDown(args);
        }
        if (args.event?.key === 'Enter') {
          const val = args.component?.option('value');
          this.handleRowEntryCompleted(e.row?.data, field, val);
        }
      };

      const origOnEnterKey = e.editorOptions.onEnterKey;
      e.editorOptions.onEnterKey = (args: any) => {
        if (origOnEnterKey) {
          origOnEnterKey(args);
        }
        const val = args.component?.option('value');
        this.handleRowEntryCompleted(e.row?.data, field, val);
      };

      const origOnFocusOut = e.editorOptions.onFocusOut;
      e.editorOptions.onFocusOut = (args: any) => {
        if (origOnFocusOut) {
          origOnFocusOut(args);
        }
        const val = args.component?.option('value');
        this.handleRowEntryCompleted(e.row?.data, field, val);
      };
    }
  }

  validateMultiplierPositive = (e: any) => {
    if (e.value === null || e.value === undefined || e.value === '') {
      return true; // handled by 'required' validation rule
    }
    const val = Number(e.value);
    return !isNaN(val) && val > 0;
  };

  validateServiceCategoryOrCpt = (e: any) => {
    const row = e.data || {};
    const multiplier = Number(row.Multiplier);

    if (isNaN(multiplier) || multiplier <= 0) {
      return true;
    }

    if (
      e.value != null &&
      e.value !== '' &&
      String(e.value).trim() !== '' &&
      (!e.column ||
        e.column.dataField !== 'ServiceCategoryID' ||
        Number(e.value) > 0)
    ) {
      return true;
    }

    const hasCategory =
      row.ServiceCategoryID != null &&
      row.ServiceCategoryID !== '' &&
      Number(row.ServiceCategoryID) > 0;
    const hasCpt = !!String(row.CPT || '').trim();

    return hasCategory || hasCpt;
  };

  validateMultiplierRequiresCategoryOrCpt = (e: any) => {
    const mult = Number(e.value);
    if (isNaN(mult) || mult <= 0) {
      return true;
    }

    const row = e.data || {};
    const hasCategory =
      row.ServiceCategoryID != null &&
      row.ServiceCategoryID !== '' &&
      Number(row.ServiceCategoryID) > 0;
    const hasCpt = !!String(row.CPT || '').trim();

    return hasCategory || hasCpt;
  };

  handleRowEntryCompleted = async (
    rowData: any,
    field?: string,
    fieldVal?: any,
  ) => {
    if (this.isAutoAddingRow || !this.isEditingEnabled) {
      return;
    }

    if (rowData && field && fieldVal !== undefined) {
      rowData[field] = fieldVal;
    }

    const mult = Number(rowData?.Multiplier);
    const hasMultiplier = !isNaN(mult) && mult > 0;
    const hasCategory =
      rowData?.ServiceCategoryID != null &&
      rowData?.ServiceCategoryID !== '' &&
      Number(rowData?.ServiceCategoryID) > 0;
    const hasCpt = !!String(rowData?.CPT || '').trim();

    // Row is complete ONLY when Multiplier > 0 AND (ServiceCategoryID > 0 OR non-empty CPT)
    if (!hasMultiplier || (!hasCategory && !hasCpt)) {
      // Row not yet complete, user is still entering other fields.
      // Do not add row or show premature warning toast.
      return;
    }

    this.isAutoAddingRow = true;

    try {
      if (this.cptPriceGrid && this.cptPriceGrid.instance) {
        await this.cptPriceGrid.instance.saveEditData();
      }

      // Check if top row is already an empty row
      const gridItems =
        this.cptPriceGrid?.instance?.getDataSource()?.items() || [];
      const store: any = this.cptPriceGrid?.instance?.getDataSource()?.store();
      const storeArray = (store as any)?._array || [];
      const localData = Array.isArray(this.cptPriceData)
        ? this.cptPriceData
        : [];

      const topItem = gridItems[0] || storeArray[0] || localData[0];
      const topRowIsBlank =
        topItem &&
        (topItem.Multiplier == null ||
          topItem.Multiplier === '' ||
          Number(topItem.Multiplier) <= 0) &&
        !String(topItem.CPT || '').trim() &&
        (topItem.ServiceCategoryID == null ||
          topItem.ServiceCategoryID === '' ||
          Number(topItem.ServiceCategoryID) <= 0);

      if (!topRowIsBlank) {
        await this.addNewRow();
      }
    } catch (err) {
      console.error('Error auto-adding row:', err);
    } finally {
      setTimeout(() => {
        this.isAutoAddingRow = false;
      }, 500);
    }
  };

  handleMultiplierCompleted = (rowData: any, multiplierVal?: any) => {
    return this.handleRowEntryCompleted(rowData, 'Multiplier', multiplierVal);
  };

  onCellClick = (e: any) => {
    if (!this.isEditingEnabled && e.rowType === 'data') {
      if (e.cellElement) {
        e.cellElement.blur();
      }
    }
  };

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
      e.data.IsModified = true;
      return;
    }

    const isModified =
      Number(originalRow.ReceiverID) !== Number(e.data.ReceiverID) ||
      Number(originalRow.ServiceCategoryID) !==
        Number(e.data.ServiceCategoryID) ||
      String(originalRow.CPT || '').trim() !==
        String(e.data.CPT || '').trim() ||
      Number(originalRow.Multiplier) !== Number(e.data.Multiplier);

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
    this.fetch_Facility_multiplier_list();
  }

  loadDropdowns() {
    this.masterService.Get_GropDown('RECEIVER_ID').subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : res?.data || [];
        this.receiverDataSource = raw.map((item: any) => ({
          ...item,
          ID:
            item.ID != null
              ? Number(item.ID)
              : item.ReceiverID != null
                ? Number(item.ReceiverID)
                : item.id,
          DESCRIPTION:
            item.DESCRIPTION ||
            item.ReceiverName ||
            item.Name ||
            String(item.ID ?? ''),
        }));
        if (this.cptPriceGrid?.instance) {
          this.cptPriceGrid.instance.repaint();
        }
      },
      error: (err: any) => {
        console.error('Error fetching RECEIVERID dropdown:', err);
      },
    });

    this.masterService.Get_GropDown('SERVICE_CATEGORY').subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : res?.data || [];
        this.serviceCategoryDataSource = raw.map((item: any) => ({
          ...item,
          ID:
            item.ID != null
              ? Number(item.ID)
              : item.ServiceCategoryID != null
                ? Number(item.ServiceCategoryID)
                : item.id,
          DESCRIPTION:
            item.DESCRIPTION ||
            item.CategoryName ||
            item.Name ||
            String(item.ID ?? ''),
        }));
        if (this.cptPriceGrid?.instance) {
          this.cptPriceGrid.instance.repaint();
        }
      },
      error: (err: any) => {
        console.error('Error fetching SERVICE_CATEGORY dropdown:', err);
      },
    });
  }

  calculateReceiverDisplay = (rowData: any): string => {
    if (!rowData) return '';
    const recId = rowData.ReceiverID;
    if (recId != null && this.receiverDataSource?.length) {
      const found = this.receiverDataSource.find(
        (r: any) => r.ID === Number(recId),
      );
      if (found) {
        return found.DESCRIPTION;
      }
    }
    return (
      rowData.ReceiverName ||
      rowData.Receiver ||
      (recId != null && recId !== 0 ? String(recId) : '')
    );
  };

  calculateServiceCategoryDisplay = (rowData: any): string => {
    if (!rowData) return '';
    const catId = rowData.ServiceCategoryID ?? rowData.CPTCategoryID;
    if (catId != null && this.serviceCategoryDataSource?.length) {
      const found = this.serviceCategoryDataSource.find(
        (s: any) => s.ID === Number(catId),
      );
      if (found) {
        return found.DESCRIPTION;
      }
    }
    return (
      rowData.ServiceCategory ||
      rowData.CategoryName ||
      (catId != null && catId !== 0 ? String(catId) : '')
    );
  };

  addNewRow = async () => {
    if (!this.selectedFacilityID) {
      this.notificationService.showNotification(
        'Please select a facility first',
        'warning',
      );
      return;
    }

    if (this.cptPriceGrid && this.cptPriceGrid.instance) {
      await this.cptPriceGrid.instance.saveEditData();
      await this.cptPriceGrid.instance.addRow();
    }
  };

  getNextSerialNumber(): number {
    let maxSl = 0;
    const store = this.cptPriceGrid?.instance?.getDataSource()?.store();
    const storeArray = (store as any)?._array || [];
    const gridItems =
      this.cptPriceGrid?.instance?.getDataSource()?.items() || [];
    const localData = Array.isArray(this.cptPriceData) ? this.cptPriceData : [];

    const all = [...localData, ...storeArray, ...gridItems];
    all.forEach((item: any) => {
      const sl = Number(item?.SerialNumber);
      if (!isNaN(sl) && sl > maxSl) {
        maxSl = sl;
      }
    });

    return maxSl + 1;
  }

  onInitNewRow = (e: any) => {
    e.data.SerialNumber = this.getNextSerialNumber();
    e.data.FacilityID = this.selectedFacilityID;
    e.data.ReceiverID = null;
    e.data.ServiceCategoryID = null;
    e.data.CPT = '';
    e.data.Multiplier = null;
    e.data.IsModified = true;
  };

  savePriceMaster = async () => {
    if (this.cptPriceGrid && this.cptPriceGrid.instance) {
      await this.cptPriceGrid.instance.saveEditData();
    }

    if (!this.selectedFacilityID) {
      this.notificationService.showNotification(
        'Please select a facility',
        'warning',
      );
      return;
    }

    const store: any = this.cptPriceGrid?.instance?.getDataSource()?.store();
    let items: any[] = [];
    if (store) {
      try {
        const loaded: any = await store.load();
        items = Array.isArray(loaded)
          ? loaded
          : loaded?.data ||
            this.cptPriceGrid?.instance?.getDataSource()?.items() ||
            [];
      } catch {
        items = this.cptPriceGrid?.instance?.getDataSource()?.items() || [];
      }
    } else {
      items = Array.isArray(this.cptPriceData)
        ? this.cptPriceData
        : (this.cptPriceGrid?.instance?.getDataSource()?.items() as any[]) ||
          [];
    }

    const validRows = items.filter((row: any) => {
      const hasCategory =
        row.ServiceCategoryID != null &&
        row.ServiceCategoryID !== '' &&
        Number(row.ServiceCategoryID) > 0;
      const hasCpt = !!String(row.CPT || '').trim();
      const hasMultiplier =
        row.Multiplier !== null &&
        row.Multiplier !== undefined &&
        row.Multiplier !== '' &&
        !isNaN(Number(row.Multiplier)) &&
        Number(row.Multiplier) > 0;
      const hasReceiver =
        row.ReceiverID != null &&
        row.ReceiverID !== '' &&
        Number(row.ReceiverID) > 0;
      return hasCategory || hasCpt || hasMultiplier || hasReceiver;
    });

    if (!validRows || validRows.length === 0) {
      this.notificationService.showNotification(
        'Please add at least one multiplier row',
        'warning',
      );
      return;
    }

    // Basic Validations
    const seen = new Set<string>();
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const rowNum = i + 1;

      const hasCategory =
        row.ServiceCategoryID != null &&
        row.ServiceCategoryID !== '' &&
        Number(row.ServiceCategoryID) > 0;
      const hasCpt = !!String(row.CPT || '').trim();

      // Either Service Category or CPT is needed
      if (!hasCategory && !hasCpt) {
        this.notificationService.showNotification(
          `Row ${rowNum}: Either Service Category or CPT is required`,
          'warning',
        );
        return;
      }

      if (
        row.Multiplier === null ||
        row.Multiplier === undefined ||
        row.Multiplier === '' ||
        isNaN(Number(row.Multiplier))
      ) {
        this.notificationService.showNotification(
          `Row ${rowNum}: Multiplier is required and must be a number`,
          'warning',
        );
        return;
      }

      if (Number(row.Multiplier) <= 0) {
        this.notificationService.showNotification(
          `Row ${rowNum}: Multiplier must be greater than 0`,
          'warning',
        );
        return;
      }

      const cptVal = String(row.CPT || '').trim();
      const recId = row.ReceiverID != null ? Number(row.ReceiverID) : 0;
      const catId =
        row.ServiceCategoryID != null ? Number(row.ServiceCategoryID) : 0;

      const dupKey = `${recId}_${catId}_${cptVal.toUpperCase()}`;
      if (seen.has(dupKey)) {
        this.notificationService.showNotification(
          `Row ${rowNum}: Duplicate entry found for the same Receiver, Service Category, and CPT`,
          'warning',
        );
        return;
      }
      seen.add(dupKey);
    }

    const payload = {
      FacilityID: String(this.selectedFacilityID),
      data: validRows.map((row: any) => ({
        ReceiverID: row.ReceiverID != null ? Number(row.ReceiverID) : 0,
        ServiceCategoryID:
          row.ServiceCategoryID != null ? Number(row.ServiceCategoryID) : 0,
        CPT: String(row.CPT || '').trim(),
        Multiplier: Number(row.Multiplier),
      })),
    };

    this.showLoading('Data Saving...');
    this.masterService.Insert_Facility_Multiplier_Data(payload).subscribe({
      next: (response: any) => {
        this.hideLoading();
        if (
          response &&
          (response.flag === '1' ||
            response.flag === 'true' ||
            response.flag === true ||
            response.message === 'Success' ||
            response.status === 'success')
        ) {
          this.notificationService.showNotification(
            'Multiplier Master Saved Successfully',
            'success',
          );
          this.isEditingEnabled = false;
          this.updateEditButtonOptions();
          this.fetch_Facility_multiplier_list();
        } else {
          const msg = response?.message || 'Failed to save Multiplier Master';
          this.notificationService.showNotification(msg, 'error');
        }
      },
      error: (error: any) => {
        this.hideLoading();
        this.notificationService.showNotification(
          'An error occurred while saving Multiplier Master',
          'error',
        );
      },
    });
  };

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
    this.fetch_Facility_multiplier_list();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onExporting(event: any) {
    this.service.exportDataGrid(event, 'Facility-Multiplier-Master');
  }

  //====== Logcal storage Data =====
  get_local_storage_data() {
    const data = JSON.parse(localStorage.getItem('logData') || '{}');
    this.IsGlobalPrice = data.cptPriceGlobal || false;
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

  // ====== Import Functionality ======
  openImportPopup = () => {
    this.importPopupVisible = true;
    this.importedGridData = [];
    this.importedFileName = '';
    this.hasImportErrors = false;
    this.cellTooltipVisible = false;
    this.clickedCellElement = null;
    this.clickedCellErrorMessage = '';
  };

  closeImportPopup = () => {
    this.importPopupVisible = false;
    this.cellTooltipVisible = false;
  };

  onImportPopupHiding = () => {
    this.importedGridData = [];
    this.importedFileName = '';
    this.hasImportErrors = false;
    this.cellTooltipVisible = false;
    this.clickedCellElement = null;
    this.clickedCellErrorMessage = '';
    if (this.importFileInput?.nativeElement) {
      this.importFileInput.nativeElement.value = '';
    }
  };

  triggerFileInput = () => {
    if (this.importFileInput?.nativeElement) {
      this.importFileInput.nativeElement.click();
    }
  };

  downloadImportTemplate = () => {
    const headers = [
      'Facility',
      'Receiver',
      'Service Category',
      'CPT',
      'Multiplier',
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facility Multiplier');
    XLSX.writeFile(workbook, 'Facility_Multiplier_Template.xlsx');
  };

  onImportFileSelected = (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) {
      return;
    }

    this.importedFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        if (!rawJson || rawJson.length === 0) {
          this.notificationService.showNotification(
            'The selected Excel file is empty or has no data rows',
            'warning',
          );
          return;
        }

        this.processImportedData(rawJson);
      } catch (err) {
        console.error('Error processing Excel file:', err);
        this.notificationService.showNotification(
          'Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file',
          'error',
        );
      } finally {
        if (this.importFileInput?.nativeElement) {
          this.importFileInput.nativeElement.value = '';
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  processImportedData = (rawJson: any[]) => {
    const processed: ImportedMultiplierRow[] = [];

    const getVal = (row: any, ...keys: string[]) => {
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const normK = k.toLowerCase().replace(/[\s_-]/g, '');
        const matchedKey = rowKeys.find(
          (rk) => rk.toLowerCase().replace(/[\s_-]/g, '') === normK,
        );
        if (matchedKey && row[matchedKey] !== undefined) {
          return String(row[matchedKey]).trim();
        }
      }
      return '';
    };

    rawJson.forEach((row: any, idx: number) => {
      const facRaw = getVal(
        row,
        'Facility',
        'FacilityID',
        'FacilityLicense',
        'FacilityName',
      );
      const recRaw = getVal(row, 'Receiver', 'ReceiverID', 'ReceiverName');
      const catRaw = getVal(
        row,
        'Service Category',
        'ServiceCategory',
        'ServiceCategoryID',
        'ServiceCode',
        'Category',
      );
      const cptRaw = getVal(row, 'CPT', 'CPTCode', 'CPT Code');
      const multRaw = getVal(row, 'Multiplier', 'MultiplierValue');

      // Skip completely blank rows
      if (!facRaw && !recRaw && !catRaw && !cptRaw && !multRaw) {
        return;
      }

      const item: ImportedMultiplierRow = {
        SerialNumber: idx + 1,
        Facility: facRaw,
        FacilityID: '',
        isValidFacility: false,
        facilityError: '',

        Receiver: recRaw,
        ReceiverID: 0,
        isValidReceiver: false,
        receiverError: '',

        ServiceCategory: catRaw,
        ServiceCategoryID: 0,
        isValidCategory: false,
        serviceCategoryError: '',

        CPT: cptRaw,
        isValidCpt: false,
        cptError: '',

        Multiplier: multRaw ? Number(multRaw) : null,
        isValidMultiplier: false,
        multiplierError: '',

        hasError: false,
      };

      this.validateImportRow(item);
      processed.push(item);
    });

    if (processed.length === 0) {
      this.notificationService.showNotification(
        'No valid rows found in the file',
        'warning',
      );
      return;
    }

    this.importedGridData = processed;
    this.hasImportErrors = this.importedGridData.some((r) => r.hasError);

    if (this.hasImportErrors) {
      this.notificationService.showNotification(
        'Some rows contain invalid data. Red cells indicate errors; hover over them to view details.',
        'warning',
      );
    } else {
      this.notificationService.showNotification(
        `Successfully loaded ${processed.length} rows with all valid data!`,
        'success',
      );
    }
  };

  validateImportRow = (item: ImportedMultiplierRow) => {
    // 1. Facility validation
    const facVal = String(item.Facility || '').trim();
    if (!facVal) {
      item.isValidFacility = false;
      item.facilityError = 'Facility is required';
      item.FacilityID = '';
    } else {
      const facMatch = this.facilityList.find((f: any) => {
        const lic = String(f.FacilityLicense || '')
          .trim()
          .toLowerCase();
        const id = String(f.FacilityID || '')
          .trim()
          .toLowerCase();
        const name = String(f.FacilityName || '')
          .trim()
          .toLowerCase();
        const target = facVal.toLowerCase();
        return lic === target || id === target || name === target;
      });

      if (facMatch) {
        item.isValidFacility = true;
        item.facilityError = '';
        item.FacilityID = facMatch.FacilityLicense;
      } else {
        item.isValidFacility = false;
        item.facilityError = `Facility '${facVal}' is not available in the system`;
        item.FacilityID = '';
      }
    }

    // 2. Receiver validation (Optional: can be empty, 0, or matched)
    const recVal = String(item.Receiver || '').trim();
    if (!recVal || recVal === '0') {
      item.isValidReceiver = true;
      item.receiverError = '';
      item.ReceiverID = 0;
    } else {
      const recMatch = this.receiverDataSource.find((r: any) => {
        const id = String(r.ID ?? '').trim();
        const desc = String(r.DESCRIPTION ?? '')
          .trim()
          .toLowerCase();
        const target = recVal.toLowerCase();
        return id === target || desc === target;
      });

      if (recMatch) {
        item.isValidReceiver = true;
        item.receiverError = '';
        item.ReceiverID = Number(recMatch.ID);
      } else {
        item.isValidReceiver = false;
        item.receiverError = `Receiver '${recVal}' is not available in the system`;
        item.ReceiverID = 0;
      }
    }

    // 3. Service Category validation (Optional if CPT is present)
    const catVal = String(item.ServiceCategory || '').trim();
    if (!catVal || catVal === '0') {
      item.ServiceCategoryID = 0;
      item.isValidCategory = true;
      item.serviceCategoryError = '';
    } else {
      const catMatch = this.serviceCategoryDataSource.find((c: any) => {
        const id = String(c.ID ?? '').trim();
        const desc = String(c.DESCRIPTION ?? '')
          .trim()
          .toLowerCase();
        const target = catVal.toLowerCase();
        return id === target || desc === target;
      });

      if (catMatch) {
        item.isValidCategory = true;
        item.serviceCategoryError = '';
        item.ServiceCategoryID = Number(catMatch.ID);
      } else {
        item.isValidCategory = false;
        item.serviceCategoryError = `Service Category '${catVal}' is not available in the system`;
        item.ServiceCategoryID = 0;
      }
    }

    // 4. CPT validation & combined rule with Service Category
    const cptVal = String(item.CPT || '').trim();
    if (cptVal.length > 50) {
      item.isValidCpt = false;
      item.cptError = 'CPT must not exceed 50 characters';
    } else {
      item.isValidCpt = true;
      item.cptError = '';
    }

    // Combined rule: If Multiplier > 0, either Service Category or CPT is mandatory!
    const hasCategory = item.ServiceCategoryID > 0;
    const hasCpt = !!cptVal;
    if (!hasCategory && !hasCpt) {
      item.isValidCategory = false;
      item.serviceCategoryError =
        'Either Service Category or CPT is required when Multiplier is greater than 0';
      item.isValidCpt = false;
      item.cptError =
        'Either Service Category or CPT is required when Multiplier is greater than 0';
    }

    // 5. Multiplier validation
    const multVal = Number(item.Multiplier);
    if (
      item.Multiplier === null ||
      item.Multiplier === undefined ||
      item.Multiplier === '' ||
      isNaN(multVal) ||
      multVal <= 0
    ) {
      item.isValidMultiplier = false;
      item.multiplierError =
        'Multiplier is required and must be a number greater than 0';
    } else {
      item.isValidMultiplier = true;
      item.multiplierError = '';
      item.Multiplier = multVal;
    }

    // Summary flag
    item.hasError =
      !item.isValidFacility ||
      !item.isValidReceiver ||
      !item.isValidCategory ||
      !item.isValidCpt ||
      !item.isValidMultiplier;
  };

  getCellErrorMessage = (
    row: ImportedMultiplierRow,
    dataField: string,
  ): string => {
    if (!row || !dataField) return '';
    if (dataField === 'Facility' && !row.isValidFacility) {
      return row.facilityError || 'Facility is not available in the system';
    }
    if (dataField === 'Receiver' && !row.isValidReceiver) {
      return row.receiverError || 'Receiver is not available in the system';
    }
    if (dataField === 'ServiceCategory' && !row.isValidCategory) {
      return (
        row.serviceCategoryError ||
        'Service Category is not available in the system'
      );
    }
    if (dataField === 'CPT' && !row.isValidCpt) {
      return row.cptError || 'CPT is invalid';
    }
    if (dataField === 'Multiplier' && !row.isValidMultiplier) {
      return (
        row.multiplierError ||
        'Multiplier is required and must be greater than 0'
      );
    }
    return '';
  };

  onImportCellPrepared = (e: any) => {
    if (e.rowType === 'data') {
      const row = e.data;
      if (!row) return;

      const errorMsg = this.getCellErrorMessage(row, e.column?.dataField);

      if (errorMsg) {
        e.cellElement.style.backgroundColor = '#ffebee';
        e.cellElement.style.border = '2px solid #ef5350';
        e.cellElement.style.color = '#c62828';
        e.cellElement.style.fontWeight = '600';
        e.cellElement.style.cursor = 'pointer';
        e.cellElement.setAttribute('title', errorMsg);
      } else {
        e.cellElement.style.backgroundColor = '';
        e.cellElement.style.border = '';
        e.cellElement.style.color = '';
        e.cellElement.style.fontWeight = '';
        e.cellElement.style.cursor = '';
        e.cellElement.removeAttribute('title');
      }
    }
  };

  onImportCellClick = (e: any) => {
    if (e.rowType === 'data' && e.data && e.column?.dataField) {
      const errorMsg = this.getCellErrorMessage(e.data, e.column.dataField);
      if (errorMsg) {
        this.clickedCellElement = e.cellElement;
        this.clickedCellErrorMessage = errorMsg;
        this.cellTooltipVisible = true;
        return;
      }
    }
    this.cellTooltipVisible = false;
  };

  saveImportedData = async () => {
    // Re-check all rows
    this.importedGridData.forEach((row) => this.validateImportRow(row));
    this.hasImportErrors = this.importedGridData.some((r) => r.hasError);

    if (this.hasImportErrors) {
      this.notificationService.showNotification(
        'Please correct all invalid/red cells before saving',
        'warning',
      );
      return;
    }

    if (!this.importedGridData || this.importedGridData.length === 0) {
      this.notificationService.showNotification(
        'No data to save. Please upload an Excel file first',
        'warning',
      );
      return;
    }

    // Check for duplicate entries
    const seen = new Set<string>();
    for (let i = 0; i < this.importedGridData.length; i++) {
      const row = this.importedGridData[i];
      const dupKey = `${row.FacilityID}_${row.ReceiverID}_${row.ServiceCategoryID}_${String(
        row.CPT || '',
      )
        .trim()
        .toUpperCase()}`;
      if (seen.has(dupKey)) {
        this.notificationService.showNotification(
          `Row ${i + 1}: Duplicate entry found for the same Facility, Receiver, Service Category, and CPT`,
          'warning',
        );
        return;
      }
      seen.add(dupKey);
    }

    // Group rows by FacilityID
    const facilityMap = new Map<string, any[]>();
    for (const row of this.importedGridData) {
      const facId = String(row.FacilityID);
      if (!facilityMap.has(facId)) {
        facilityMap.set(facId, []);
      }
      facilityMap.get(facId)!.push({
        ReceiverID: row.ReceiverID != null ? Number(row.ReceiverID) : 0,
        ServiceCategoryID:
          row.ServiceCategoryID != null ? Number(row.ServiceCategoryID) : 0,
        CPT: String(row.CPT || '').trim(),
        Multiplier: Number(row.Multiplier),
      });
    }

    this.showLoading('Saving Imported Data...');

    const requests = Array.from(facilityMap.entries()).map(([facId, data]) => {
      return this.masterService.Insert_Facility_Multiplier_Data({
        FacilityID: facId,
        data: data,
      });
    });

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        this.hideLoading();
        const allSuccessful = responses.every(
          (res: any) =>
            res &&
            (res.flag === '1' ||
              res.flag === 'true' ||
              res.flag === true ||
              res.message === 'Success' ||
              res.status === 'success'),
        );

        if (allSuccessful) {
          this.notificationService.showNotification(
            `Successfully imported ${this.importedGridData.length} records!`,
            'success',
          );
          this.importPopupVisible = false;
          this.importedGridData = [];
          this.fetch_Facility_multiplier_list();
        } else {
          this.notificationService.showNotification(
            'Some records could not be saved. Please check the data and try again',
            'warning',
          );
          this.fetch_Facility_multiplier_list();
        }
      },
      error: (err: any) => {
        this.hideLoading();
        console.error('Error saving imported multipliers:', err);
        this.notificationService.showNotification(
          'An error occurred while saving the imported data',
          'error',
        );
      },
    });
  };
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
    DxTooltipModule,
  ],
  declarations: [FacilityMultiplierMasterComponent],
})
export class FacilityMultiplierMasterModule {}
