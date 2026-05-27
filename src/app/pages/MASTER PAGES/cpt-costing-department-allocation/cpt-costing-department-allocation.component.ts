import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxDataGridComponent,
  DxTagBoxModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import { MasterReportService } from '../master-report.service';
import notify from 'devextreme/ui/notify';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-cpt-costing-department-allocation',
  templateUrl: './cpt-costing-department-allocation.component.html',
  styleUrl: './cpt-costing-department-allocation.component.scss',
})
export class CPTCostingDepartmentAllocationComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  readonly allowedPageSizes: any = [10, 20, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };

  dataSource: any[] = [];

  cptToSearchDataSource: any;
  effectiveCPTDataSource: any;

  encounterTypeDataSource: any;

  costingDepartmentDataSource: any;
  statusDataSource = [
    { id: 'Active', name: 'Active' },
    { id: 'Inactive', name: 'Inactive' },
  ];

  loadingVisible: boolean = false;

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private masterService: MasterReportService
  ) {}

  ngOnInit() {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
    this.initializeData();
  }

  // ========== master initializer ==========
  initializeData() {
    this.loadingVisible = true;
    forkJoin({
      cpt: this.masterService.Get_GropDown('CPT'),
      encounter: this.masterService.Get_GropDown('ENCOUNTER_TYPE'),
      dept: this.masterService.Get_GropDown('DEPARTMENT'),
    }).subscribe({
      next: (res: any) => {
        this.cptToSearchDataSource = res.cpt;
        this.effectiveCPTDataSource = res.cpt;
        this.encounterTypeDataSource = res.encounter;
        this.costingDepartmentDataSource = res.dept;

        // after dropdowns load → fetch datasource
        this.getDataSource();
      },
      error: () => {
        this.loadingVisible = false;
      },
    });
  }

  // ============= fetch datasource ========
  getDataSource() {
    this.loadingVisible = true;
    this.masterService
      .getCptCostingDepartmentAllocationData()
      .subscribe((res: any) => {
        this.dataSource = this.transformEffectiveCPTID(res.datas);
        this.updateSerialNumbers();
        this.loadingVisible = false;
      });
  }

  // ============ transform helper =========
  transformEffectiveCPTID(data: any[]) {
    return data.map((item) => ({
      ...item,
      SearchCPTID: item.SearchCPTID
        ? item.SearchCPTID.split(',').map((id: string) => Number(id.trim()))
        : [],
      EffectiveCPTID: item.EffectiveCPTID
        ? item.EffectiveCPTID.split(',').map((id: string) => Number(id.trim()))
        : [],
    }));
  }

  // ================ new row initialising ===========
  onInitNewRow(e: any) {
    const maxSlNo = Math.max(
      0,
      ...this.dataSource.map((d: any) => d.slNo || 0)
    );
    e.data.slNo = maxSlNo + 1;
    e.data.Status = 'Active';
  }

  // ============ update serial number ========
  updateSerialNumbers() {
    this.dataSource.forEach((item: any, index: number) => {
      item.slNo = index + 1;
    });
  }

  // ======== add new row in cost allocation ========
  onAddRowClick = () => {
    this.dataGrid.instance.addRow();
  };

  // ===== bind value to Search CPT (show part before '-') =====
  searchCptCellTemplate = (cellElement, cellInfo) => {
    const selectedIds = cellInfo.value || [];
    const displayText = this.cptToSearchDataSource
      .filter((item) => selectedIds.includes(item.ID))
      .map((item) => item.DESCRIPTION.split('-')[0].trim())
      .join(', ');

    const fullDescriptions = this.cptToSearchDataSource
      .filter((item) => selectedIds.includes(item.ID))
      .map((item) => item.DESCRIPTION);

    const tooltipText = fullDescriptions
      .reduce((acc: string[], curr, idx) => {
        const lineIndex = Math.floor(idx / 2);
        acc[lineIndex] = acc[lineIndex] ? acc[lineIndex] + ', ' + curr : curr;
        return acc;
      }, [])
      .join('\n');

    cellElement.textContent = displayText;
    cellElement.title = tooltipText;
  };

  // ===== bind value to Effective CPT (show part before '-') =====
  effectiveCptCellTemplate = (cellElement, cellInfo) => {
    const selectedIds = cellInfo.value || [];
    const displayText = this.effectiveCPTDataSource
      .filter((item) => selectedIds.includes(item.ID))
      .map((item) => item.DESCRIPTION.split('-')[0].trim())
      .join(', ');
    const fullDescriptions = this.effectiveCPTDataSource
      .filter((item) => selectedIds.includes(item.ID))
      .map((item) => item.DESCRIPTION);
    const tooltipText = fullDescriptions
      .reduce((acc: string[], curr, idx) => {
        const lineIndex = Math.floor(idx / 2);
        acc[lineIndex] = acc[lineIndex] ? acc[lineIndex] + ', ' + curr : curr;
        return acc;
      }, [])
      .join('\n');

    cellElement.textContent = displayText;
    cellElement.title = tooltipText;
  };

  // ======= edit row validations ======
  onEditorPreparing(e: any) {
    if (e.parentType !== 'dataRow') return;

    if (e.dataField === 'EncounterType') {
      const row = e.row?.data;
      const searchCpts = Array.isArray(row?.SearchCPTID)
        ? row.SearchCPTID
        : row?.SearchCPTID
        ? [row.SearchCPTID]
        : [];

      if (searchCpts.length > 0) {
        // find all encounter types already used with these CPTs
        const usedEncounterTypes = this.dataSource
          .filter((r) => r !== row) // skip current row
          .filter((r) => {
            const rSearch = Array.isArray(r.SearchCPTID)
              ? r.SearchCPTID
              : [r.SearchCPTID];
            return rSearch.some((s) => searchCpts.includes(s));
          })
          .map((r) => r.EncounterType)
          .filter((x) => !!x);

        // override lookup datasource
        e.editorOptions.dataSource = this.encounterTypeDataSource.filter(
          (et: any) => !usedEncounterTypes.includes(et.DESCRIPTION)
        );
        e.editorOptions.valueExpr = 'DESCRIPTION';
        e.editorOptions.displayExpr = 'DESCRIPTION';
      } else {
        e.editorOptions.dataSource = this.encounterTypeDataSource;
        e.editorOptions.valueExpr = 'DESCRIPTION';
        e.editorOptions.displayExpr = 'DESCRIPTION';
      }
    }

    // ====== Status disable on new row ======
    if (e.dataField === 'Status') {
      e.editorOptions.disabled = e.row?.isNewRow ? true : false;
    }
  }

  onSearchCptChanged(newValue: any, cellInfo: any) {
    cellInfo.setValue(newValue);
    if (cellInfo.component) {
      cellInfo.component.repaint();
    }
  }

  // ========== row validation ==========
  onRowValidating(e: any) {
    const row =
      e.newData && Object.keys(e.newData).length > 0
        ? { ...e.oldData, ...e.newData }
        : e.oldData;

    const searchCpts = Array.isArray(row.SearchCPTID)
      ? row.SearchCPTID
      : row.SearchCPTID
      ? [row.SearchCPTID]
      : [];

    const encounterType = row.EncounterType;

    if (searchCpts.length && encounterType) {
      for (const sCpt of searchCpts) {
        const duplicate = this.dataSource.find((r: any) => {
          if (r === e.oldData) return false;

          const rSearch = Array.isArray(r.SearchCPTID)
            ? r.SearchCPTID
            : [r.SearchCPTID];
          return r.EncounterType === encounterType && rSearch.includes(sCpt);
        });

        if (duplicate) {
          e.isValid = false;
          e.errorText =
            'This combination of CPT To Search and Encounter Type already exists.';
          return;
        }
      }
    }
    // ====== your existing completeness check (optional) ======
    const hasCpt = searchCpts.length > 0;
    const hasEncounter = !!encounterType;
    const hasEffective =
      row.EffectiveCPTID != null && row.EffectiveCPTID.length > 0;
    const hasCosting = row.DepartmentID != null && row.DepartmentID !== '';

    const filledCount = [hasCpt, hasEncounter, hasEffective, hasCosting].filter(
      Boolean
    ).length;

    if (filledCount > 0 && filledCount < 4) {
      e.isValid = false;
      // e.errorText = 'If one field is filled, all four fields are required.';
    }
  }

  // ========== custom validation =======
  groupRequiredValidation = (e: any) => {
    const row = e.data || {};
    const hasCpt = row.SearchCPTID != null && row.SearchCPTID !== '';
    const hasEncounter = row.EncounterType != null && row.EncounterType !== '';
    const hasEffective =
      row.EffectiveCPTID != null && row.EffectiveCPTID.length > 0;
    const hasCosting = row.DepartmentID != null && row.DepartmentID !== '';
    const hasPrinciple =
      row.PrincipleCPTID != null && row.PrincipleCPTID !== '';

    const filledCount = [
      hasCpt,
      hasEncounter,
      hasEffective,
      hasCosting,
      hasPrinciple,
    ].filter(Boolean).length;

    if (filledCount === 0) return true;
    return (
      e.value !== null &&
      e.value !== '' &&
      !(Array.isArray(e.value) && e.value.length === 0)
    );
  };

  // ========= save newly added row ======
  handleRowInserted(e: any) {
    const rowData = e.data || {};

    const hasCpt = Array.isArray(rowData.SearchCPTID)
      ? rowData.SearchCPTID.length > 0
      : rowData.SearchCPTID != null && rowData.SearchCPTID !== '';

    const hasEncounter =
      rowData.EncounterType != null && rowData.EncounterType !== '';
    const hasEffective = Array.isArray(rowData.EffectiveCPTID)
      ? rowData.EffectiveCPTID.length > 0
      : rowData.EffectiveCPTID != null && rowData.EffectiveCPTID !== '';

    const hasCosting =
      rowData.DepartmentID != null && rowData.DepartmentID !== '';
    const hasPrinciple =
      rowData.PrincipleCPTID != null && rowData.PrincipleCPTID !== '';

    if (
      !hasCpt ||
      !hasEncounter ||
      !hasEffective ||
      !hasCosting ||
      !hasPrinciple
    ) {
      notify('Please fill all required fields before adding.', 'error', 3000);
      e.component.cancelEditData();
      return;
    }
    // ===== prepare payload =====
    const payload = {
      UserID: 1,
      SearchCPTID: Array.isArray(rowData.SearchCPTID)
        ? rowData.SearchCPTID.join(',')
        : rowData.SearchCPTID,
      EncounterType: rowData.EncounterType,
      EffectiveCPTID: Array.isArray(rowData.EffectiveCPTID)
        ? rowData.EffectiveCPTID.join(',')
        : rowData.EffectiveCPTID,
      DepartmentID: rowData.DepartmentID,
      PrincipleCPTID: rowData.PrincipleCPTID,
    };

    // ===== API call =====
    this.masterService.addCptCostingDepartmentAllocation(payload).subscribe({
      next: () => {
        notify({
          message: 'Row saved successfully',
          type: 'success',
          displayTime: 3000,
          position: 'top right',
        });
        this.getDataSource();
      },
      error: () => {
        notify({
          message: 'Error saving row',
          type: 'error',
          displayTime: 3000,
          position: 'top right',
        });
      },
    });

    this.onAddRowClick();
  }

  //===== update row data =====
  handleRowUpdated(e: any) {
    const rowData = e.data || {};

    const hasCpt = rowData.SearchCPTID != null && rowData.SearchCPTID !== '';
    const hasEncounter =
      rowData.EncounterType != null && rowData.EncounterType !== '';
    const hasEffective =
      rowData.EffectiveCPTID != null && rowData.EffectiveCPTID.length > 0;
    const hasCosting =
      rowData.DepartmentID != null && rowData.DepartmentID !== '';
    const hasPrinciple =
      rowData.PrincipleCPTID != null && rowData.PrincipleCPTID !== '';

    if (
      !hasCpt ||
      !hasEncounter ||
      !hasEffective ||
      !hasCosting ||
      !hasPrinciple
    ) {
      notify('Please fill all required fields before updating.', 'error', 3000);
      e.component.cancelEditData();
      return;
    }

    const payload = {
      ID: rowData.ID,
      UserID: rowData.UserID ?? 0,
      SearchCPTID: Array.isArray(rowData.SearchCPTID)
        ? rowData.SearchCPTID.join(',')
        : rowData.SearchCPTID,
      EncounterType: rowData.EncounterType,
      EffectiveCPTID: Array.isArray(rowData.EffectiveCPTID)
        ? rowData.EffectiveCPTID.join(',')
        : rowData.EffectiveCPTID,
      DepartmentID: rowData.DepartmentID,
      PrincipleCPTID: rowData.PrincipleCPTID,
      IsInactive: rowData.Status === 'Inactive' ? true : false,
    };

    this.masterService.updateCptCostingDepartmentAllocation(payload).subscribe({
      next: (res) => {
        notify({
          message: 'Row updated successfully',
          type: 'success',
          displayTime: 3000,
          position: 'top right',
        });
        this.getDataSource();
      },
      error: (err) => {
        notify({
          message: 'Error updating row',
          type: 'error',
          displayTime: 3000,
          position: 'top right',
        });
      },
    });
  }

  // ======== delete row data ========
  handleRowRemoved(e: any) {
    const rowData = e.data || {};

    if (!rowData.ID) {
      notify('Invalid row selected for deletion.', 'error', 3000);
      return;
    }

    this.masterService
      .removeCptCostingDepartmentAllocation(rowData.ID)
      .subscribe({
        next: (res) => {
          notify({
            message: 'Row deleted successfully',
            type: 'success',
            displayTime: 3000,
            position: 'top right',
          });
          this.getDataSource();
        },
        error: (err) => {
          notify({
            message: 'Error deleting row',
            type: 'error',
            displayTime: 3000,
            position: 'top right',
          });
        },
      });
  }

  // ======= refresh the datSource =======
  refresh = () => {
    this.dataGrid.instance.refresh();
    this.getDataSource();
  };
}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxTagBoxModule,
    DxLoadPanelModule,
  ],
  providers: [],
  exports: [],
  declarations: [CPTCostingDepartmentAllocationComponent],
})
export class CPTCostingDepartmentAllocationModule {}
