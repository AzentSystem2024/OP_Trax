import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  NgModule,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import {
  DxSelectBoxModule,
  DxTextAreaModule,
  DxDateBoxModule,
  DxFormModule,
  DxTextBoxModule,
  DxCheckBoxModule,
  DxRadioGroupModule,
  DxFileUploaderModule,
  DxDataGridModule,
  DxButtonModule,
  DxValidatorModule,
  DxProgressBarModule,
  DxPopupModule,
  DxDropDownBoxModule,
  DxToolbarModule,
  DxTabPanelModule,
  DxTabsModule,
  DxNumberBoxModule,
  DxBoxModule,
  DxLoadPanelModule,
  DxValidationGroupModule,
  DxDataGridComponent,
  DxDropDownBoxComponent,
  DxValidationGroupComponent,
  DxTagBoxModule,
} from 'devextreme-angular';
import {
  DxoItemModule,
  DxoFormItemModule,
  DxoLookupModule,
  DxiItemModule,
  DxiGroupModule,
  DxoSummaryModule,
} from 'devextreme-angular/ui/nested';
import { FormTextboxModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ledger-group-popup',
  templateUrl: './ledger-group-popup.component.html',
  styleUrl: './ledger-group-popup.component.scss',
})
export class NewLedgerGroupPopupComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(DxDropDownBoxComponent, { static: false })
  facilityDropDownBox!: DxDropDownBoxComponent;

  @ViewChild('facilityGrid', { static: false })
  facilityGrid!: DxDataGridComponent;

  @ViewChild('facilityValidator', { static: false }) facilityValidator: any;

  @ViewChild('validationGroup', { static: false })
  validationGroup!: DxValidationGroupComponent;

  @Output() popupClosed = new EventEmitter<void>();
  @Input() payroll: any;
  @Input() isEditing: boolean = false;
  @Input() EditingResponseData: any;

  // ========= main form value adding input format ========

  subGroupName: any;
  categoryName: any;

  GridDataSource: any[] = [];
  departmentDataSource: any[];
  subDepartmentDataSource: any[];
  CptTypeDataSource: any[];

  IsinActive: boolean = false;
  HeadCode: any;
  HeadName: any;

  // rawClinicians: any[] = [];

  Facility_DataSource: any[] = [];
  Facility_Value: any;

  isLoading = false;
  loadingVisible: boolean = false;
  summaryTotalValid: boolean = false;
  clinicianDataSource: any;

  facilityDataMap: { [facilityId: string]: any[] } = {};

  isexpensetypeReadOnly: boolean = false;

  AttachedLedgerDataSource: any = [];
  ledgerDropDownDataList: any;
  popupSelectedLedgerIds: number[] = [];
  ledgerPopupVisible = false;

  // =============== custom percentage column format ============
  customPercentageFormat = {
    type: 'custom',
    formatter: (value: any) => {
      if (value === null || value === undefined) return '';
      if (Math.floor(value) !== value) {
        return value.toFixed(2).replace(/\.?0+$/, ''); // Removes trailing 0s
      }
      return value.toString(); // Integer as is
    },
  };
  isEditingSupport: boolean;

  constructor(private dataService: DataService) {}

  async ngOnInit() {
    this.loadingVisible = true;
    try {
      const [deptRes, facilityRes, ledgerRes]: any = await Promise.all([
        firstValueFrom(this.dataService.Get_Account_HeadDepartment()),
        firstValueFrom(this.dataService.Get_User_Facility_List_Data()),
        firstValueFrom(
          this.dataService.atteched_Ledger_list({
            ID: this.isEditing ? this.EditingResponseData.ID : 0,
          })
        ),
      ]);

      if (deptRes?.flag === '1') {
        this.departmentDataSource = deptRes.department;
      }

      if (facilityRes?.data) {
        this.Facility_DataSource = facilityRes.data;
      }

      if (ledgerRes?.flag === '1') {
        this.ledgerDropDownDataList = ledgerRes.data || [];
      } else {
        this.ledgerDropDownDataList = [];
      }

      await this.isEditDataAvailable();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      this.loadingVisible = false;
    }
  }

  // ===== facility list fetching ======
  async get_Facility_dataList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.dataService.Get_User_Facility_List_Data()
      );
      if (res) {
        this.Facility_DataSource = res.data;
      }
    } catch (error) {
      console.error('Error fetching facility data:', error);
    }
  }

  // ======== department, subdepartment, cpt code dropdowns =======
  async Get_Account_HeadDepartment(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_Account_HeadDepartment()
    );
    if (response.flag === '1') {
      this.departmentDataSource = response.department;
    }
  }

  // ======== edit form filling =======
  async isEditDataAvailable() {
    if (!this.isEditing || !this.EditingResponseData) return;
    this.isEditingSupport = this.isEditing;
    this.loadingVisible = true;

    try {
      // ====== Fill the fields ======
      this.HeadName = this.EditingResponseData.HeadName;
      this.HeadCode = this.EditingResponseData.HeadCode;
      this.IsinActive = this.EditingResponseData.IsInactive;

      this.facilityDataMap = this.convertDataToFacilityMap(
        this.EditingResponseData
      );

      if (this.EditingResponseData.AttachedLedgers) {
        const attachedIds = this.EditingResponseData.AttachedLedgers.split(
          ','
        ).map((id: string) => id.trim());

        this.AttachedLedgerDataSource = this.ledgerDropDownDataList.filter(
          (ledger: any) => attachedIds.includes(String(ledger.ID))
        );
      } else {
        this.AttachedLedgerDataSource = [];
      }

      const facilityIds = Object.keys(this.facilityDataMap);
      this.Facility_Value = facilityIds.length > 0 ? [facilityIds[0]] : null;

      const firstFacilityId = this.Facility_Value?.[0];
      this.GridDataSource = firstFacilityId
        ? this.facilityDataMap[firstFacilityId] || []
        : [];
    } finally {
      this.loadingVisible = false; // Hide loader after all data is set
    }
  }

  // ============= loading dropdown data to the ledger datagrid =========
  openLedgerPopup() {
    this.popupSelectedLedgerIds = this.AttachedLedgerDataSource.map(
      (x) => x.ID
    );
    this.ledgerPopupVisible = true;
  }

  closeLedgerPopup() {
    this.ledgerPopupVisible = false;
  }

  applyLedgerSelection() {
    this.AttachedLedgerDataSource = this.ledgerDropDownDataList.filter(
      (item: any) => this.popupSelectedLedgerIds.includes(item.ID)
    );
    this.ledgerPopupVisible = false;
  }

  // ========== custom validation for
  validateDepartment = (e: any) => {
    const row = e.data || {};
    const hasSubDepartment =
      row['CPT Department'] != null && row['CPT Department'] !== '';
    const hasPercentage = row['Percentage'] != null && row['Percentage'] !== '';
    const departmentEmpty =
      row['Department'] == null || row['Department'] === '';
    if ((hasSubDepartment || hasPercentage) && departmentEmpty) {
      return false;
    }
    return true;
  };

  // ===== percentage column validation ======
  percentageValidation = (e: any) => {
    const row = e.data || {};
    const percentage = e.value;
    const amount = row.Amount;

    // Only validate if Department is set
    if (!row['Department']) {
      return true;
    }
    // Usual "only one of Amount or Percentage" logic
    if (amount != null && amount !== '') {
      return !percentage;
    }
    return percentage != null && percentage !== '';
  };

  // ======= facility dropdown used row marking ========
  onFacilityRowPrepared(e: any) {
    if (e.rowType === 'data') {
      const facilityId = e.data.FacilityLicense;
      console.log(
        `Checking facility row:`,
        facilityId,
        this.facilityDataMap[facilityId]
      );

      if (
        this.facilityDataMap[facilityId] &&
        this.facilityDataMap[facilityId].length > 0
      ) {
        // Use border & text colors that work on both themes
        e.rowElement.style.border = '1px solid #ff9800';
        e.rowElement.style.fontWeight = 'bold';
        e.rowElement.style.color = '#a1f480';
        e.rowElement.title = 'Facility already used';
      }
    }
  }

  // ====== convert select api response to needed format ======
  convertDataToFacilityMap(data: any): { [facilityId: string]: any[] } {
    const result: { [facilityId: string]: any[] } = {};

    if (!data || !data.data) return result;

    data.data.forEach((item: any) => {
      const facilityId = item.FacilityID;
      if (!result[facilityId]) {
        result[facilityId] = [];
      }

      result[facilityId].push({
        Department: item.DepartmentID,
        Percentage: item.CostPercent || null,
      });
    });

    return result;
  }

  customizeSummaryText = (e: any) => {
    return this.summaryTotalValid
      ? `Total: ${e.value} %`
      : `Invalid Total: ${e.value} %`;
  };

  // ============ facility value change event ==========
  onFacilityChange(e: any) {
    const facilityIds = Array.isArray(e.value) ? e.value : [e.value];
    const facilityId = facilityIds[0];
    if (!facilityId) {
      setTimeout(() => {
        this.GridDataSource = [];
      });
      return;
    }
    if (!this.facilityDataMap[facilityId]) {
      this.facilityDataMap[facilityId] = [];
    }
    setTimeout(() => {
      this.Facility_Value = facilityIds;
      this.GridDataSource = this.facilityDataMap[facilityId];
      this.facilityDropDownBox?.instance?.close();

      this.onAddRowClick();
      this.facilityGrid?.instance.refresh();
      this.isEditingSupport = false;
    });
  }

  // =========== add new row in cost allocation ============
  onAddRowClick = () => {
    const result = this.facilityValidator?.instance?.validate();
    if (!result?.isValid) {
      return;
    }
    if (!this.isEditingSupport) {
      this.dataGrid.instance.addRow();
    }
  };

  // ========= row validation =============
  onRowValidating(e: any) {
    if (e.isNewRow) {
      return;
    }
    const data = { ...e.oldData, ...e.newData };
    const errors = [];

    const hasDepartment =
      data['Department'] != null && data['Department'] !== '';
    const hasPercentage =
      data['Percentage'] != null && data['Percentage'] !== '';

    // Department is always required
    if (!hasDepartment) {
      errors.push({
        columnIndex: e.component.columnOption('Department').index,
        message: 'Department is required',
      });
    }

    // Percentage is required
    if (!hasPercentage) {
      errors.push({
        columnIndex: e.component.columnOption('Percentage').index,
        message: 'Percentage is required',
      });
    }

    if (errors.length > 0) {
      e.isValid = false;
      e.errorText = '';
      e.brokenRules = errors;
    }
  }

  // ========= clear empty row after new row inserted ========
  onRowInserted(e: any) {
    this.onAddRowClick();
  }
  // ======= datagrid cell editing datasource filtering ======
  onCellValueChanged(e: any) {
    const row = e.data;
    const rowIndex = e.rowIndex;
    const grid = e.component;

    const department = row['Department'];
    const percentage = row['Percentage'];

    if (!department) return;

    // ======== Prevent duplicate Department ==========
    const isDuplicate = this.GridDataSource.some((item, index) => {
      if (index === rowIndex) return false;
      return item['Department'] === department;
    });

    if (isDuplicate) {
      notify('This department is already used.', 'error', 2000);

      if (e.column.dataField === 'Department') row['Department'] = null;
      if (e.column.dataField === 'Percentage') row['Percentage'] = null;
      grid.cellValue(rowIndex, 'Department', row['Department']);
      grid.cellValue(rowIndex, 'Percentage', row['Percentage']);
      return;
    }

    // ======== Check total % only when editing Percentage ==========
    if (e.column.dataField === 'Percentage') {
      const oldValue = e.oldValue ?? null;
      const newValue = e.value ?? 0;
      if (oldValue === null || newValue > oldValue) {
        const total = this.GridDataSource.reduce((sum, item, i) => {
          return (
            sum + (i === rowIndex ? +newValue || 0 : +item.Percentage || 0)
          );
        }, 0);

        this.summaryTotalValid = total === 100;

        if (total > 100) {
          notify(
            {
              message: `Total Percentage cannot exceed 100%. Current total: ${total}%`,
              type: 'error',
              displayTime: 3000,
              position: { my: 'top right', at: 'top right' },
            },
            'error',
            3000
          );

          // Revert back
          row['Percentage'] = oldValue;
          grid.cellValue(rowIndex, 'Percentage', oldValue);
        }
      }
    }
  }

  // ========== editing start event ===========
  onEditorPreparing(e: any) {
    if (e.parentType !== 'dataRow') return;

    const row = e.row?.data;
    const grid = e.component;
    const rowKey = e.row?.key;

    // ======= DEPARTMENT =======
    if (e.dataField === 'Department') {
      const usedDepartments = this.GridDataSource.filter((r) => r !== row).map(
        (r) => r['Department']
      );

      e.editorOptions.dataSource = this.departmentDataSource.filter(
        (dept: any) =>
          !usedDepartments.includes(dept.ID) || row['Department'] === dept.ID
      );

      e.editorOptions.valueExpr = 'ID';
      e.editorOptions.displayExpr = 'Description';
      e.editorOptions.dropDownOptions = {
        width: 'auto',
        autoResizeEnabled: false,
      };

      e.editorOptions.onValueChanged = (args: any) => {
        e.setValue(args.value);
      };
    }

    // ======= PERCENTAGE =======
    if (e.dataField === 'Percentage') {
      e.editorOptions.readOnly = false;

      const originalOnValueChanged = e.editorOptions?.onValueChanged;

      e.editorOptions.onValueChanged = (args: any) => {
        const newValue = Number(args.value) || 0;
        const oldValue = Number(row['Percentage']) || 0;

        // Calculate total percentage including this row’s new value
        const totalPercentage = this.GridDataSource.reduce((sum, item) => {
          return sum + (item === row ? newValue : Number(item.Percentage) || 0);
        }, 0);

        // Validation
        if (newValue < 0 || newValue > 100) {
          notify('Percentage must be between 0 and 100.', 'error', 3000);
          args.component.option('value', oldValue);
          e.setValue(oldValue);
          return;
        }

        if (row['Percentage'] == null || newValue > oldValue) {
          if (totalPercentage > 100) {
            notify('Total percentage cannot exceed 100%.', 'error', 3000);
            args.component.option('value', oldValue);
            e.setValue(oldValue);
            return;
          }
        }

        // Save new value
        e.setValue(newValue);

        if (originalOnValueChanged) {
          originalOnValueChanged(args);
        }
      };
    }
  }

  // =========== delete attached ledger row data ============
  async onRowDeleteLedgerAttached(e: any): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.dataService.delete_Atteched_Ledger_Data(e.ID)
      );

      if (res?.flag === '1') {
        this.AttachedLedgerDataSource = this.AttachedLedgerDataSource.filter(
          (row: any) => row.ID !== e.ID
        );

        notify('Row deleted successfully', 'success', 2000);
      } else {
        notify('Failed to delete row', 'error', 2000);
      }
    } catch (error) {
      notify('Error deleting row', 'error', 2000);
    }
  }

  // ================== main save function ===============
  saveLedgerGroup() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) {
      notify('Please fill all required fields.', 'error', 3000);
      return;
    }
    const convertedData = this.getConvertedDataSource();
    if (convertedData.length > 0) {
      const facilityTotals: { [facilityId: string]: number } = {};

      convertedData.forEach((row) => {
        const facilityId = row.FacilityID;
        const percent = Number(row.CostPercent) || 0;
        facilityTotals[facilityId] =
          (facilityTotals[facilityId] || 0) + percent;
      });

      const invalidFacilities = Object.keys(facilityTotals).filter(
        (id) => facilityTotals[id] !== 100
      );

      if (invalidFacilities.length > 0) {
        const msg = `Total percentage must be exactly 100% for Facility(s): ${invalidFacilities.join(
          ', '
        )}`;
        notify(msg, 'error', 5000);
        return;
      }
    }

    // Proceed to save
    const payload = {
      HeadCode: this.HeadCode || '',
      HeadName: this.HeadName,
      data: convertedData,
      AttachedLedgers: this.AttachedLedgerDataSource.map(
        (item) => item.ID
      ).join(','),
    };
    this.dataService.insert_Ledger_Group(payload).subscribe({
      next: (response: any) => {
        const message =
          response?.Message ||
          (response?.flag === '1'
            ? 'Saved successfully.'
            : 'Failed to save Ledger Group.');

        if (response?.flag === '1') {
          notify(
            { message, position: { at: 'top right', my: 'top right' } },
            'success',
            3000
          );

          this.popupClosed.emit();
        } else {
          notify(
            { message, position: { at: 'top right', my: 'top right' } },
            'error',
            3000
          );
        }
      },
      error: (err) => {
        console.error('Insert failed:', err);
        notify('Something went wrong while saving.', 'error', 3000);
      },
    });
  }

  // ================ Update the row data ================
  updateLedgerGroup() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) {
      notify('Please fill all required fields.', 'error', 3000);
      return;
    }

    const convertedData = this.getConvertedDataSource();

    if (convertedData.length > 0) {
      const facilityTotals: { [facilityId: string]: number } = {};

      convertedData.forEach((row) => {
        const facilityId = row.FacilityID;
        const percent = Number(row.CostPercent) || 0;
        facilityTotals[facilityId] =
          (facilityTotals[facilityId] || 0) + percent;
      });

      const invalidFacilities = Object.keys(facilityTotals).filter(
        (id) => facilityTotals[id] !== 100
      );

      if (invalidFacilities.length > 0) {
        const msg = `Total percentage must be exactly 100% for Facility(s): ${invalidFacilities.join(
          ', '
        )}`;
        notify(msg, 'error', 5000);
        return;
      }
    }

    // proceed to update
    const payload = {
      ID: this.EditingResponseData.ID,
      HeadCode: this.HeadCode,
      HeadName: this.HeadName,
      IsInactive: this.IsinActive,
      data: convertedData,
      AttachedLedgers: this.AttachedLedgerDataSource.map(
        (item) => item.ID
      ).join(','),
    };

    this.dataService.update_Ledger_Group(payload).subscribe({
      next: (response: any) => {
        const message =
          response?.Message ||
          (response?.flag === '1'
            ? 'Updated successfully.'
            : 'Failed to update ledger Group');

        if (response?.flag === '1') {
          notify(
            { message, position: { at: 'top center', my: 'top center' } },
            'success',
            3000
          );

          this.popupClosed.emit();
        } else {
          notify(
            { message, position: { at: 'top center', my: 'top center' } },
            'error',
            3000
          );
        }
      },
      error: (err) => {
        console.error('Update failed:', err);
        notify('Something went wrong while updating.', 'error', 3000);
      },
    });
  }

  // ======= convert the datasource to payload format ======
  getConvertedDataSource() {
    const rows = [];
    for (const facilityId in this.facilityDataMap) {
      const gridData = this.facilityDataMap[facilityId] || [];
      gridData.forEach((row) => {
        rows.push({
          FacilityID: facilityId,
          DepartmentID: row['Department'],
          CostPercent: row['Percentage'],
        });
      });
    }
    return rows;
  }

  handleClose() {
    this.popupClosed.emit();
  }

  closePopup() {
    this.popupClosed.emit();
  }
}

@NgModule({
  imports: [
    BrowserModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxDateBoxModule,
    DxFormModule,
    DxTextBoxModule,
    FormTextboxModule,
    DxCheckBoxModule,
    DxRadioGroupModule,
    DxFileUploaderModule,
    DxDataGridModule,
    DxButtonModule,
    DxoItemModule,
    DxoFormItemModule,
    DxoLookupModule,
    DxValidatorModule,
    DxProgressBarModule,
    DxPopupModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxToolbarModule,
    DxiItemModule,
    DxoItemModule,
    DxTabPanelModule,
    DxTabsModule,
    DxiGroupModule,
    FormsModule,
    DxNumberBoxModule,
    DxoSummaryModule,
    DxBoxModule,
    DxLoadPanelModule,
    DxValidationGroupModule,
    DxTagBoxModule,
  ],
  providers: [],
  declarations: [NewLedgerGroupPopupComponent],
  exports: [NewLedgerGroupPopupComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NewLedgerGroupPopupModule {}
