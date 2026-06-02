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

@Component({
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrl: './price-master.component.scss',
  providers: [ReportService, DataService],
})
export class PriceMasterComponent {
  @ViewChild('cptPriceGrid', { static: false })
  cptPriceGrid!: DxDataGridComponent;

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

  isLoading: boolean = false;
  editedRows: any = [];

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

    this.loadLookups();
    this.fetchCPTPriceList();
  }

  loadLookups() {
    this.dataService
      .get_UserWise_FacilityList_Data()
      .subscribe((response: any) => {
        this.facilityList = response.facilityDetails || [];

        if (this.facilityList.length > 1) {
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

  fetchCPTPriceList() {
    this.isLoading = true;
    this.masterService
      .get_CPT_Price_List(this.selectedFacilityID || '')
      .subscribe(
        (response: any) => {
          if (response.flag === '1') {
            const data = response.data || [];
            this.cptPriceData = data.map((item: any, index: number) => ({
              ...item,
              SerialNumber: index + 1,
            }));
            this.originalCptPriceData = JSON.parse(
              JSON.stringify(this.cptPriceData),
            );
            this.isLoading = false;
          } else {
            notify('Failed to load CPT Price List', 'error', 2000);
            this.isLoading = false;
          }
        },
        (error) => {
          notify(
            'An error occurred while fetching CPT Price List',
            'error',
            2000,
          );
          this.isLoading = false;
        },
      );
  }

  onEditorPreparing(e: any) {
    if (e.parentType === 'dataRow' && e.dataField === 'NewEffectFrom') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      e.editorOptions.min = today;

      const activePrice = e.row.data.ActivePrice;
      const activeEffectFrom = e.row.data.ActiveEffectFrom;

      // Initial Setup
      if (!activePrice && !activeEffectFrom) {
        return;
      }

      const activeDate = new Date(activeEffectFrom);
      activeDate.setHours(0, 0, 0, 0);

      // Optional: user can't select dates <= active date
      const minDate = new Date(activeDate);
      minDate.setDate(minDate.getDate() + 1);

      if (minDate > today) {
        e.editorOptions.min = minDate;
      }
    }
  }

  validateNewEffectFrom = (e: any) => {
    if (!e.value) {
      return false;
    }

    const newEffectFrom = new Date(e.value);
    newEffectFrom.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Never allow past dates
    if (newEffectFrom < today) {
      return false;
    }

    const activePrice = e.data?.ActivePrice ?? e.row?.data?.ActivePrice;

    const activeEffectFrom =
      e.data?.ActiveEffectFrom ?? e.row?.data?.ActiveEffectFrom;

    // Initial Setup
    if (!activePrice && !activeEffectFrom) {
      return true;
    }

    const activeDate = new Date(activeEffectFrom);
    activeDate.setHours(0, 0, 0, 0);

    // Existing validation
    if (newEffectFrom <= activeDate) {
      return false;
    }

    return true;
  };

  onRowUpdated(e: any) {
    const originalRow = this.originalCptPriceData.find(
      (x) => x.SerialNumber === e.data.SerialNumber,
    );

    if (!originalRow) {
      return;
    }

    const isModified =
      originalRow.NewPrice !== e.data.NewPrice ||
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
    this.fetchCPTPriceList();
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
        this.getDate(original.NewEffectFrom) !== this.getDate(row.NewEffectFrom)
      );
    });

    if (modifiedRows.length === 0) {
      notify('No changes found', 'warning', 2000);
      return;
    }

    const payload = modifiedRows.map((x: any) => ({
      FacilityID: this.selectedFacilityID,
      CPTID: x.CPTID,
      Price: x.NewPrice,
      EffectFrom: this.formatDate(x.NewEffectFrom),
      EffectTo: null,
    }));

    this.masterService
      .Insert_PriceMaster_Data(payload)
      .subscribe((response: any) => {
        if (response.flag === '1') {
          notify('Price Master Saved Successfully', 'success', 2000);
          this.fetchCPTPriceList();
        } else {
          notify('Failed to save Price Master', 'error', 2000);
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
    this.fetchCPTPriceList();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onExporting(event: any) {
    this.service.exportDataGrid(event, 'Price-Master');
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
  declarations: [PriceMasterComponent],
})
export class PriceMasterModule {}
