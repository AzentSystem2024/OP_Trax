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

  facilityList: any[] = [];

  menuPrevilage: any;

  selectedFacilityID: any;

  // Added adjuster fields
  regionAdjuster: any = null;
  quaternaryAdjuster: any = null;

  saveButtonOptions: any;
  editButtonOptions: any;
  addRowButtonOptions: any;
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
    });

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

  onEditorPreparing(e: any) {
    if (!this.isEditingEnabled) {
      e.cancel = true;
      return;
    }
    if (e.parentType === 'dataRow' && e.dataField === 'NewEffectFrom') {
      delete e.editorOptions.min;
    }
  }

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
    const localData = Array.isArray(this.cptPriceData)
      ? this.cptPriceData
      : [];

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
      const hasReceiver = row.ReceiverID != null && row.ReceiverID !== '';
      const hasCategory =
        row.ServiceCategoryID != null && row.ServiceCategoryID !== '';
      const hasCpt = !!String(row.CPT || '').trim();
      const hasMultiplier =
        row.Multiplier !== null &&
        row.Multiplier !== undefined &&
        row.Multiplier !== '' &&
        !isNaN(Number(row.Multiplier));
      return hasReceiver || hasCategory || hasCpt || hasMultiplier;
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
