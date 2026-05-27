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
  DxDataGridComponent,
  DxBoxModule,
  DxDropDownBoxComponent,
  DxLoadPanelModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
} from 'devextreme-angular';
import {
  DxoItemModule,
  DxoFormItemModule,
  DxoLookupModule,
  DxiItemModule,
  DxiGroupModule,
  DxoSummaryModule,
} from 'devextreme-angular/ui/nested';
import notify from 'devextreme/ui/notify';
import { FormTextboxModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss'],
})
export class AddAccountComponent implements OnInit {
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

  popupVisible = false;

  subGroupPopup = false;
  categoryPopup = false;

  groupingList: any;
  mainGroupList: any[] = [];
  selectedMainGroup: number | null = null;
  selectedMainGroupId: any;
  selectedSubGroup: number | null = null;
  selectedSubGroupId: any;
  subGroupList: any;
  categoryList: any;
  selectedCategory: number | null = null;
  selectedCategoryId: any;
  // ========= main form value adding input format ========
  ArabicName: any = '';
  SubGroupId: any;
  HEAD_NAME: any;

  subGroupName: any;
  categoryName: any;

  GridDataSource: any[] = [];
  departmentDataSource: any[];
  subDepartmentDataSource: any[];
  CptTypeDataSource: any[];
  CostTypeDataSource: any;
  CostTypeValue: any;

  IsinActive: boolean;
  HeadCode: any;
  rawSubDepartments: any[] = [];
  rawCptCodes: any[] = [];
  // rawClinicians: any[] = [];

  Facility_DataSource: any[] = [];
  Facility_Value: any;

  isLoading = false;
  loadingVisible: boolean = false;
  summaryTotalValid: boolean = false;
  clinicianDataSource: any;

  facilityDataMap: { [facilityId: string]: any[] } = {};

  expenseTypeValue: any = 0;
  showExpenseType: boolean = false;
  isexpensetypeReadOnly: boolean = false;

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

  CanBeGroupedInCosting: boolean = false;
  IsQtyWeight: boolean = false;
  ledgerGroupList: any;
  CostingGroupID: any;
  isEditingSupport: any;
  ExpenseTypeDataSource:any;

  constructor(private dataService: DataService) {}

  async ngOnInit() {
    this.loadingVisible = true;

    try {
      // Run independent calls in parallel
      await Promise.all([
        this.getGroupingList(),
        this.get_CostType_Dropdown(),
        this.Get_Account_HeadDepartment(),
        this.get_Facility_dataList(),
      ]);

      // If isEditDataAvailable depends on above data, run it after
      await this.isEditDataAvailable();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setTimeout(() => {
        this.loadingVisible = false;
      }, 2000);
    }
  }

  // ===== facility list fetching ======
  async get_Facility_dataList(): Promise<void> {
    // this.loadingVisible = true;
    try {
      const res: any = await firstValueFrom(
        this.dataService.Get_User_Facility_List_Data()
      );
      if (res) {
        this.Facility_DataSource = res.data;
      }
    } catch (error) {
      console.error('Error fetching facility data:', error);
    } finally {
      // this.loadingVisible = false;
    }
  }

  // ====== fetch main group list drop down =====
  async getGroupingList(): Promise<void> {
    const response = await firstValueFrom(this.dataService.getGroupingList());
    if (response?.flag === 1 && Array.isArray(response.Data)) {
      this.groupingList = response.Data;
      this.mainGroupList = this.groupingList.filter(
        (item) => item.GROUP_SUPER_ID === 0
      );
    }
  }

  async get_CostType_Dropdown(): Promise<void> {
    const [costTypeResponse, clinicianResponse, ledgergroupresponse] =
      await Promise.all([
        firstValueFrom(this.dataService.Get_GropDown('COST_TYPE')),
        firstValueFrom(this.dataService.Get_GropDown('CLINICIAN')),
        firstValueFrom(this.dataService.Get_GropDown('LEDGER_GROUP')),
      ]);

    if (costTypeResponse) {
      this.CostTypeDataSource = costTypeResponse;
    }
    if (clinicianResponse) {
      this.clinicianDataSource = clinicianResponse;
    }
    if (clinicianResponse) {
      this.ledgerGroupList = ledgergroupresponse;
    }
  }

  // ======== department, subdepartment, cpt code dropdowns =======
  async Get_Account_HeadDepartment(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_Account_HeadDepartment()
    );
    if (response.flag === '1') {
      this.departmentDataSource = response.department;
      this.rawSubDepartments = response.subdepartment;
      this.rawCptCodes = response.cptcode;

      this.subDepartmentDataSource = this.rawSubDepartments;
      this.CptTypeDataSource = this.rawCptCodes;
    }
  }

  // ======== edit form filling =======
  isEditDataAvailable() {
    if (!this.isEditing || !this.EditingResponseData) return;
    this.isEditingSupport = this.isEditing;
    this.selectedMainGroupId = this.EditingResponseData.MainGroupId;
    if (this.selectedMainGroupId) {
      this.subGroupList = this.groupingList.filter(
        (item) => item.GROUP_SUPER_ID === this.selectedMainGroupId
      );
    }

    this.selectedSubGroup = this.EditingResponseData.SubGroupId;

    if (this.selectedSubGroup) {
      this.categoryList = this.groupingList.filter(
        (item) => item.GROUP_SUPER_ID === this.selectedSubGroup
      );
    }

    this.selectedCategoryId = this.EditingResponseData.GroupID;
    this.HEAD_NAME = this.EditingResponseData.HeadName;
    this.CostTypeValue = this.EditingResponseData.CostTypeID;
    this.IsinActive = this.EditingResponseData.IsInactive;
    this.HeadCode = this.EditingResponseData.HeadCode;
    this.expenseTypeValue = this.EditingResponseData.IsOverhead;
    this.CanBeGroupedInCosting = this.EditingResponseData.CanBeGroupedInCosting;
    this.CostingGroupID = this.EditingResponseData.CostingGroupID;
    this.IsQtyWeight = this.EditingResponseData.IsQtyWeight;

    // Build facility map
    this.facilityDataMap = this.convertDataToFacilityMap(
      this.EditingResponseData
    );

    const facilityIds = Object.keys(this.facilityDataMap);
    this.Facility_Value = facilityIds.length > 0 ? [facilityIds[0]] : null;

    // Load initial grid data from the first facility
    const firstFacilityId = this.Facility_Value[0];
    if (firstFacilityId) {
      this.GridDataSource = this.facilityDataMap[firstFacilityId] || [];
    } else {
      this.GridDataSource = [];
    }
  }
  // ======= facility dropdown used row marking ========
  onFacilityRowPrepared(e: any) {
    if (e.rowType === 'data') {
      const facilityId = e.data.FacilityLicense;

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
        'CPT Department': item.CPTDepartmentID
          ? item.CPTDepartmentID.split(',').map((id: string) => +id)
          : [],
        'CPT Code': item.CPTID
          ? item.CPTID.split(',').map((id: string) => +id)
          : [],
        Clinician: item.ClinicianID
          ? item.ClinicianID.split(',').map((id: string) => +id)
          : [],
        AllocationType: item.AllocationType,
        Amount: item.Amount || null,
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

  //============ amount format ===========
  formatIndianAmount(value: number): string {
    if (value == null) return '';
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ========= row validation =============
  onRowValidating(e: any) {
    // Skip validation for new rows
    if (e.isNewRow) {
      return;
    }

    const grid = e.component;
    const rowKey = e.key;
    const data = { ...e.oldData, ...e.newData };
    const errors: any[] = [];

    const hasDepartment =
      data['Department'] != null && data['Department'] !== '';
    const hasAmount = data['Amount'] != null && data['Amount'] !== '';
    const hasPercentage =
      data['Percentage'] != null && data['Percentage'] !== '';
    const allocationType = data['AllocationType'];

    // ===== Always require Department =====
    if (!hasDepartment) {
      errors.push({
        columnIndex: grid.columnOption('Department').index,
        message: 'Department is required',
      });
    }

    // ===== Handle AllocationType logic and cleanup =====
    const rowIndex = grid.getRowIndexByKey(rowKey);

    switch (allocationType) {
      case 1: // 🔹 Fixed Amount
        // Amount is valid; Percentage must be cleared
        if (hasPercentage) {
          data['Percentage'] = null;
          if (rowIndex >= 0) {
            grid.cellValue(rowIndex, 'Percentage', null);
          }
        }

        if (!hasAmount) {
          errors.push({
            columnIndex: grid.columnOption('Amount').index,
            message: 'Amount is required for Fixed Amount allocation',
          });
        }
        break;

      case 2: // 🔹 Percentage
        // Percentage is valid; Amount must be cleared
        if (hasAmount) {
          data['Amount'] = null;
          if (rowIndex >= 0) {
            grid.cellValue(rowIndex, 'Amount', null);
          }
        }

        if (!hasPercentage) {
          errors.push({
            columnIndex: grid.columnOption('Percentage').index,
            message: 'Percentage is required for Percentage allocation',
          });
        }
        break;

      case 3: // 🔹 Activity Value
        // Both must be cleared
        data['Amount'] = null;
        data['Percentage'] = null;
        if (rowIndex >= 0) {
          grid.cellValue(rowIndex, 'Amount', null);
          grid.cellValue(rowIndex, 'Percentage', null);
        }

        // Skip Amount/Percentage validation
        e.isValid = true;
        e.brokenRules = [];
        e.errorText = '';
        return;

      default:
        // 🔸 No Allocation Type selected → require at least one
        if (!hasAmount && !hasPercentage) {
          errors.push({
            columnIndex: grid.columnOption('Percentage').index,
            message: 'Either Amount or Percentage is required',
          });
        }
        break;
    }

    // ===== Final validation result =====
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

  //===== Allow only one: Amount or Percentage (with CostType) =====
  amountValidation = (e: any) => {
    const row = e.data || {};
    const amount = e.value;
    const percentage = row.Percentage;
    const costType = row.AllocationType;

    if (costType === 3) {
      return true;
    }
    if (costType === 1) {
      return amount != null && amount !== '' && !percentage;
    }
    if (costType === 2) {
      return !amount;
    }

    if (percentage != null && percentage !== '') {
      return !amount;
    }
    return true;
  };

  // ===== percentage column validation ======
  percentageValidation = (e: any) => {
    const row = e.data || {};
    const percentage = e.value;
    const amount = row.Amount;
    const costType = row.AllocationType;

    if (costType === 3) {
      // Activity Value → skip validation completely
      return true;
    }

    if (costType === 2) {
      // Percentage mode → Percentage required, Amount must be empty
      return percentage != null && percentage !== '' && !amount;
    }

    if (costType === 1) {
      // Fixed Amount mode → Percentage must stay empty
      return !percentage;
    }

    // fallback (when CostType not yet chosen) → allow one of them
    if (amount != null && amount !== '') {
      return !percentage;
    }
    return true;
  };

  // ======= datagrid cell editing datasource filtering ======
  onCellValueChanged(e: any) {
    const row = e.data;
    const rowIndex = e.rowIndex;
    const grid = e.component;

    const department = row['Department'];
    const percentage = row['Percentage'];
    const amount = row['Amount'];
    const cptDepartments = Array.isArray(row['CPT Department'])
      ? row['CPT Department']
      : [];
    const cptCodes = Array.isArray(row['CPT Code']) ? row['CPT Code'] : [];

    if (!department) return;

    // ======== Prevent duplicate combinations ==========
    const isDuplicate = this.GridDataSource.some((item, index) => {
      if (index === rowIndex) return false;
      const depMatch = item['Department'] === department;
      const cptDeptMatch =
        JSON.stringify(item['CPT Department']?.sort() || []) ===
        JSON.stringify(cptDepartments.sort());
      const cptCodeMatch =
        JSON.stringify(item['CPT Code']?.sort() || []) ===
        JSON.stringify(cptCodes.sort());
      const isCptEmpty = cptDepartments.length === 0 && cptCodes.length === 0;
      const percentMatch = item['Percentage'] === percentage;
      return isCptEmpty
        ? depMatch && percentMatch
        : depMatch && cptDeptMatch && cptCodeMatch;
    });

    if (isDuplicate) {
      notify('Duplicate combination not allowed.', 'error', 2000);
      if (e.column.dataField === 'Department') row['Department'] = null;
      if (e.column.dataField === 'CPT Department') row['CPT Department'] = [];
      if (e.column.dataField === 'CPT Code') row['CPT Code'] = [];
      if (e.column.dataField === 'Percentage') row['Percentage'] = null;
      grid.cellValue(rowIndex, 'Department', row['Department']);
      grid.cellValue(rowIndex, 'CPT Department', row['CPT Department']);
      grid.cellValue(rowIndex, 'CPT Code', row['CPT Code']);
      grid.cellValue(rowIndex, 'Percentage', row['Percentage']);
      return;
    }

    // ======== Live update CPT Codes ===========
    if (e.column.dataField === 'CPT Department') {
      const selectedSubDepartments = Array.isArray(e.value)
        ? e.value
        : [e.value];
      this.CptTypeDataSource = this.rawCptCodes.filter(
        (c) =>
          c.DepartmentID === department &&
          selectedSubDepartments.includes(c.SubDepartmentID)
      );

      row['CPT Code'] = [];
      this.GridDataSource[rowIndex]['CPT Code'] = [];
      grid.cellValue(rowIndex, 'CPT Code', []);
    }

    // ======== Handle AllocationType (CostType) logic ==========
    if (e.column.dataField === 'AllocationType') {
      const type = e.value;

      // Always force-commit any open editor before clearing
      grid.saveEditData();

      switch (type) {
        case 1: // Fixed Amount
          // Clear Percentage
          row['Percentage'] = null;
          grid.cellValue(rowIndex, 'Percentage', null);
          break;

        case 2: // Percentage
          // Clear Amount
          row['Amount'] = null;
          grid.cellValue(rowIndex, 'Amount', null);
          break;

        case 3: // Activity Value
          // Clear both
          row['Amount'] = null;
          row['Percentage'] = null;
          grid.cellValue(rowIndex, 'Amount', 0);
          grid.cellValue(rowIndex, 'Percentage', 0);

          // Optional UX: add new row automatically
          grid.saveEditData();
          setTimeout(() => {
            grid.addRow();
            const newRowIndex = grid.getVisibleRows().length - 1;
            grid.editCell(newRowIndex, 'Department');
          }, 80);
          break;
      }

      // 🔥 Force full re-render + data sync
      grid.saveEditData();
      grid.refresh();
      grid.repaint(); // ensures visual UI reflects cleared cells
    }

    // ======== Clear conflicting values dynamically ==========
    if (e.column.dataField === 'Amount') {
      if (row['AllocationType'] === 2 || row['AllocationType'] === 3) {
        grid.cellValue(rowIndex, 'Amount', null);
        return;
      }
      if (e.value != null && e.value !== '') {
        grid.cellValue(rowIndex, 'Percentage', null);
      }
    }

    if (e.column.dataField === 'Percentage') {
      if (row['AllocationType'] === 1 || row['AllocationType'] === 3) {
        grid.cellValue(rowIndex, 'Percentage', null);
        return;
      }
      if (e.value != null && e.value !== '') {
        grid.cellValue(rowIndex, 'Amount', null);
      }
    }

    // ======== Check total % only when editing Percentage ==========
    if (e.column.dataField === 'Percentage' && row['AllocationType'] === 2) {
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
    const rowIndex = e.row?.rowIndex;
    const grid = e.component;
    const rowKey = e.row?.key;

    // Existing data restriction logic (kept)
    const usedCptDepartments = this.GridDataSource.filter(
      (r) => r !== row
    ).flatMap((r) => r['CPT Department'] || []);
    const usedCptCodes = this.GridDataSource.filter((r) => r !== row).flatMap(
      (r) => r['CPT Code'] || []
    );

    // =========== DEPARTMENT =======
    if (e.dataField === 'Department') {
      e.editorOptions.dataSource = this.departmentDataSource;
      e.editorOptions.dropDownOptions = {
        width: 'auto',
        autoResizeEnabled: false,
      };

      const isDeptAlreadyUsed = (deptID: any) =>
        this.GridDataSource.some(
          (rowItem) =>
            rowItem !== row &&
            rowItem['Department'] === deptID &&
            ((rowItem['CPT Department'] &&
              rowItem['CPT Department'].length > 0) ||
              (rowItem['CPT Code'] && rowItem['CPT Code'].length > 0))
        );

      e.editorOptions.onOpened = () => {
        const disabledDeptIDs = this.departmentDataSource
          .filter((dept) => {
            const deptID = dept.ID;

            //  If department is NOT already used elsewhere, allow it always
            if (!isDeptAlreadyUsed(deptID)) {
              return false; // keep it enabled
            }

            // If already used, use your existing deep logic
            const relatedSubDepts = this.rawSubDepartments.filter(
              (sd) => sd.DepartmentID === deptID
            );

            if (relatedSubDepts.length === 0) return true; // no sub departments

            const allSubDeptsUsed = relatedSubDepts.every((subDept) => {
              const subDeptID = subDept.ID;

              const cptCodesForSubDept = this.rawCptCodes.filter(
                (cpt) =>
                  cpt.DepartmentID === deptID &&
                  cpt.SubDepartmentID === subDeptID
              );

              if (cptCodesForSubDept.length === 0) {
                return usedCptDepartments.includes(subDeptID);
              }

              const unusedCptCodes = cptCodesForSubDept.filter(
                (cpt) => !usedCptCodes.includes(cpt.ID)
              );

              return unusedCptCodes.length === 0;
            });

            return allSubDeptsUsed;
          })
          .map((d) => d.ID);

        setTimeout(() => {
          const dropDown = e.editorElement.querySelector('.dx-dropdownlist');
          if (dropDown) {
            const items = dropDown.querySelectorAll('.dx-item');
            items.forEach((item: any, index: number) => {
              const dept = this.departmentDataSource[index];
              if (disabledDeptIDs.includes(dept.ID)) {
                item.classList.add('dx-state-disabled');
              } else {
                item.classList.remove('dx-state-disabled');
              }
            });
          }
        });
      };

      e.editorOptions.onValueChanged = (args: any) => {
        const newValue = args.value;

        // Check if already used elsewhere
        if (isDeptAlreadyUsed(newValue)) {
          const deptID = newValue;

          const relatedSubDepts = this.rawSubDepartments.filter(
            (sd) => sd.DepartmentID === deptID
          );

          const isDisabled =
            relatedSubDepts.length === 0 ||
            relatedSubDepts.every((subDept) => {
              const subDeptID = subDept.ID;
              const cptCodesForSubDept = this.rawCptCodes.filter(
                (cpt) =>
                  cpt.DepartmentID === deptID &&
                  cpt.SubDepartmentID === subDeptID
              );

              if (cptCodesForSubDept.length === 0) {
                return usedCptDepartments.includes(subDeptID);
              }

              const unusedCptCodes = cptCodesForSubDept.filter(
                (cpt) => !usedCptCodes.includes(cpt.ID)
              );

              return unusedCptCodes.length === 0;
            });

          if (isDisabled) {
            notify(
              'This department is fully used and cannot be selected.',
              'warning',
              3000
            );
            args.component.option('value', null);
            return;
          }
        }

        e.setValue(newValue);

        row['CPT Department'] = [];
        row['CPT Code'] = [];

        const dataIndex = this.GridDataSource.findIndex(
          (d) => d.ID === rowKey || d === row
        );

        if (dataIndex !== -1) {
          this.GridDataSource[dataIndex]['CPT Department'] = [];
          this.GridDataSource[dataIndex]['CPT Code'] = [];
        }

        grid.cellValue(rowKey, 'CPT Department', []);
        grid.cellValue(rowKey, 'CPT Code', []);

        this.subDepartmentDataSource = this.rawSubDepartments.filter(
          (sd) => sd.DepartmentID === newValue
        );
      };
    }

    // ======= CPT DEPARTMENT =======
    if (e.dataField === 'CPT Department') {
      const availableSubDepartments = this.rawSubDepartments
        .filter((sd) => sd.DepartmentID === row?.Department)
        .filter((sd) => {
          const subDeptID = sd.ID;

          const cptCodesForSubDept = this.rawCptCodes.filter(
            (c) =>
              c.DepartmentID === row?.Department &&
              c.SubDepartmentID === subDeptID
          );

          const unusedCptCodes = cptCodesForSubDept.filter(
            (cpt) => !usedCptCodes.includes(cpt.ID)
          );

          if (cptCodesForSubDept.length === 0) {
            return !usedCptDepartments.includes(subDeptID);
          }

          return unusedCptCodes.length > 0;
        });

      e.editorName = 'dxTagBox';
      e.editorOptions = {
        dataSource: availableSubDepartments,
        valueExpr: 'ID',
        displayExpr: 'Description',
        value: row['CPT Department'] || [],
        showSelectionControls: true,
        searchEnabled: true,
        applyValueMode: 'instantly',
        multiline: false,
        dropDownOptions: {
          width: 'auto',
        },
        onValueChanged: (args: any) => {
          e.setValue(args.value);
          grid.cellValue(rowKey, 'CPT Department', args.value);
        },
      };
    }

    // ========== CPT CODE ==========
    if (e.dataField === 'CPT Code') {
      const selectedSubDepartments = row?.['CPT Department'] || [];

      const availableCptCodes = this.rawCptCodes
        .filter((c) => {
          if (selectedSubDepartments.length > 0) {
            // If sub departments are selected, filter by Department + SubDepartment
            return (
              c.DepartmentID === row?.Department &&
              selectedSubDepartments.includes(c.SubDepartmentID)
            );
          } else {
            // If no sub departments, filter only by Department
            return c.DepartmentID === row?.Department;
          }
        })
        .filter((c) => !usedCptCodes.includes(c.ID));

      e.editorName = 'dxTagBox';
      e.editorOptions = {
        dataSource: availableCptCodes,
        valueExpr: 'ID',
        displayExpr: 'Description',
        value: row['CPT Code'] || [],
        showSelectionControls: true,
        searchEnabled: true,
        applyValueMode: 'instantly',
        multiline: false,
        dropDownOptions: {
          width: 'auto',
        },
        onValueChanged: (args: any) => {
          e.setValue(args.value);
          grid.cellValue(rowKey, 'CPT Code', args.value);
        },
      };
    }

    // ======= CLINICIAN =======
    if (e.dataField === 'Clinician') {
      const currentRowClinicians = e.row?.data['Clinician'] || [];

      // Get already used clinicians from other rows
      const usedClinicians = this.GridDataSource.filter(
        (r) => r !== e.row?.data
      ).flatMap((r) => r['Clinician'] || []);

      // Prepare available clinicians
      const availableClinicians = this.clinicianDataSource.filter(
        (clinician: any) =>
          !usedClinicians.includes(clinician.ID) ||
          currentRowClinicians.includes(clinician.ID)
      );

      e.editorName = 'dxTagBox';
      e.editorOptions = {
        dataSource: availableClinicians,
        valueExpr: 'ID',
        displayExpr: 'DESCRIPTION',
        value: currentRowClinicians,
        showSelectionControls: true,
        searchEnabled: true,
        applyValueMode: 'instantly',
        multiline: false,
        dropDownOptions: {
          width: 'auto',
        },
        onValueChanged: (args: any) => {
          e.setValue(args.value);
        },
      };
    }

    // ======= PERCENTAGE =======
    if (e.dataField === 'Percentage') {
      const hasAmount = !!row['Amount'];
      e.editorOptions.readOnly =
        row['AllocationType'] === 1 || // Fixed Amount
        row['AllocationType'] === 3 || // Activity Value
        hasAmount;

      if (e.editorOptions.readOnly) {
        e.editorOptions.inputAttr = { style: 'background-color:#f2f2f2;' };
      }

      const originalOnValueChanged = e.editorOptions?.onValueChanged;
      e.editorOptions.onValueChanged = (args: any) => {
        const newValue = Number(args.value);
        const oldValue = Number(row['Percentage']) || 0;

        // Disallow invalid or excessive totals
        if (isNaN(newValue) || newValue < 0 || newValue > 100) {
          notify('Percentage must be between 0 and 100.', 'error', 3000);
          args.component.option('value', oldValue);
          e.setValue(oldValue);
          return;
        }

        const total = this.GridDataSource.reduce((sum, item) => {
          return sum + (item === row ? newValue : item.Percentage || 0);
        }, 0);

        if (total > 100) {
          notify('Total percentage cannot exceed 100%.', 'error', 3000);
          args.component.option('value', oldValue);
          e.setValue(oldValue);
          return;
        }

        // Clear amount when entering percentage
        if (!isNaN(newValue)) {
          row['Amount'] = null;
          e.component.cellValue(rowIndex, 'Amount', null);
        }

        if (originalOnValueChanged) originalOnValueChanged(args);
      };
    }

    // ======= AMOUNT =======
    if (e.dataField === 'Amount') {
      const hasPercentage = !!row['Percentage'];
      e.editorOptions.readOnly =
        row['AllocationType'] === 2 || // Percentage mode
        row['AllocationType'] === 3 || // Activity Value
        hasPercentage;

      if (e.editorOptions.readOnly) {
        e.editorOptions.inputAttr = { style: 'background-color:#f2f2f2;' };
      }

      const originalOnValueChanged = e.editorOptions?.onValueChanged;
      e.editorOptions.onValueChanged = (args: any) => {
        const value = args.value;
        if (row['AllocationType'] === 2 || row['AllocationType'] === 3) {
          e.setValue(null);
          args.component.option('value', null);
          return;
        }

        if (value != null && value !== '') {
          row['Percentage'] = null;
          e.component.cellValue(rowIndex, 'Percentage', null);
        }

        if (originalOnValueChanged) originalOnValueChanged(args);
      };
    }
  }

  // ========== show description values in grid cell ==========
  calculateSubDepartmentDisplayValue = (rowData: any) => {
    return this.getDescriptions(rowData['CPT Department'], 'subdepartment');
  };
  // ========== show description values in grid cell ==========
  calculateCptCodeDisplayValue = (rowData: any) => {
    return this.getDescriptions(rowData['CPT Code'], 'cptcode');
  };
  // ========== show description values in grid cell ==========
  calculateClinicianDisplayValue = (rowData: any) => {
    return this.getDescriptions(rowData['Clinician'], 'clinician');
  };

  // ===== fetch description for displat the tag box inside the datagrid cell ========
  getDescriptions(
    ids: number[] = [],
    type: 'subdepartment' | 'cptcode' | 'clinician'
  ): string {
    if (!Array.isArray(ids)) return '';
    let source;
    if (type === 'subdepartment') source = this.rawSubDepartments;
    else if (type === 'cptcode') source = this.rawCptCodes;
    else if (type === 'clinician') source = this.clinicianDataSource;
    else return '';

    return source
      .filter((item) => ids.includes(item.ID))
      .map((item) => item.Description || item.Name || item.DESCRIPTION)
      .join(', ');
  }

  // =========== sub group dropdown saving =========
  saveSubGroup() {
    const payload = {
      GroupID: 0,
      GroupName: this.subGroupName, // updated variable
      GroupSuperID: this.selectedMainGroupId,
      GroupType: 0,
      IsSystemGroup: false,
      ArabicName: this.ArabicName,
      GroupOrder: 0,
      GroupLevel: 2,
    };

    this.dataService.insertAccountGroup(payload).subscribe((response: any) => {
      console.log(response, 'NEW SUB GROUP RESPONSE');

      const newGroupId = response?.Data?.GroupID;
      if (!newGroupId) return;

      notify(
        {
          message: 'Sub Group Added Successfully',
          position: { at: 'top center', my: 'top center' },
        },
        'success'
      );

      this.subGroupName = '';

      this.dataService.getGroupingList().subscribe((res: any) => {
        if (res?.flag === 1 && Array.isArray(res.Data)) {
          this.groupingList = res.Data;
          this.subGroupList = this.groupingList.filter(
            (item) => item.GROUP_SUPER_ID === this.selectedMainGroupId
          );

          setTimeout(() => {
            this.selectedSubGroup = newGroupId;
            this.selectedSubGroupId = newGroupId;
            this.SubGroupId = newGroupId;
          });

          this.subGroupPopup = false;
        }
      });
    });
  }
  // =========== category dropdown saving =========
  saveCategory() {
    const payload = {
      GroupID: 0,
      GroupName: this.categoryName, // updated variable
      GroupSuperID: this.selectedSubGroupId,
      GroupType: 0,
      IsSystemGroup: false,
      ArabicName: this.ArabicName,
      GroupOrder: 0,
      GroupLevel: 3,
    };

    this.dataService.insertAccountGroup(payload).subscribe((response: any) => {
      console.log(response, 'NEW CATEGORY RESPONSE');

      const newGroupId = response?.Data?.GroupID;
      if (!newGroupId) return;

      notify(
        {
          message: 'Category Added Successfully',
          position: { at: 'top center', my: 'top center' },
        },
        'success'
      );

      this.categoryName = ''; // reset input

      this.dataService.getGroupingList().subscribe((res: any) => {
        if (res?.flag === 1 && Array.isArray(res.Data)) {
          this.groupingList = res.Data;
          this.categoryList = this.groupingList.filter(
            (item) => item.GROUP_SUPER_ID === this.selectedSubGroupId
          );
          this.selectedCategoryId = newGroupId;

          this.categoryPopup = false;
        }
      });
    });
  }

  openPopup() {
    this.popupVisible = true;
  }

  onAddSubField() {
    this.subGroupPopup = true;
  }

  onAddCategory() {
    this.categoryPopup = true;
  }

  // ========== sub group popup adding assistance function ============
  get selectedMainGroupName(): string {
    const selectedGroup = this.mainGroupList.find(
      (item) => item.GROUP_ID === this.selectedMainGroupId
    );
    return selectedGroup ? selectedGroup.GROUP_NAME : '';
  }

  get selectedSubGroupName(): string {
    const selected = this.subGroupList?.find(
      (item) => item.GROUP_ID === this.selectedSubGroupId
    );
    return selected ? selected.GROUP_NAME : '';
  }

  // ============ main group list drop down change event ============
  onMainGroupChange(event: any) {
    if (this.isLoading) return;

    this.selectedMainGroupId = event.value;
    this.showExpenseType = this.selectedMainGroupId === 4;
    if (this.selectedMainGroupId === 4) {
      this.dataService.Get_GropDown('EXPENSE_TYPE').subscribe((res:any)=>{
        this.ExpenseTypeDataSource = res;
      })
    }

    this.subGroupList = this.groupingList.filter(
      (item) => item.GROUP_SUPER_ID === this.selectedMainGroupId
    );
  }

  // ============ sub group drop down change event ============
  onSubGroupChange(event: any) {
    if (this.isLoading) return;

    this.selectedSubGroupId = event.value;
    // this.isexpensetypeReadOnly = this.selectedSubGroupId === 22;
    // this.expenseTypeValue = this.isexpensetypeReadOnly ? 1 : 0;

    this.categoryList = this.groupingList.filter(
      (item) => item.GROUP_SUPER_ID === this.selectedSubGroupId
    );
  }

  // ============ category drop down change event ============
  onCategoryChange(event: any) {
    if (this.isLoading) return;
    this.selectedCategoryId = event.value;
  }
  // ================== main save function ===============
  saveAccountHead() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) {
      notify('Please fill all required fields.', 'error', 3000);
      return;
    }

    const convertedData = this.getConvertedDataSource();

    // Facility validation
    if (convertedData.length > 0) {
      const facilityTotals: { [facilityId: string]: number } = {};

      convertedData.forEach((row) => {
        const facilityId = row.FacilityID;
        const percent = Number(row.CostPercent) || 0;
        facilityTotals[facilityId] =
          (facilityTotals[facilityId] || 0) + percent;
      });

      const invalidFacilities = Object.keys(facilityTotals).filter(
        (id) => facilityTotals[id] !== 0 && facilityTotals[id] !== 100
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
      HeadName: this.HEAD_NAME,
      GroupID: this.selectedCategoryId,
      CostTypeID: this.CostTypeValue,
      IsOverhead: this.expenseTypeValue,
      CanBeGroupedInCosting: this.CanBeGroupedInCosting,
      CostingGroupID: this.CostingGroupID,
      IsQtyWeight:this.IsQtyWeight,
      FacilityID:
        Array.isArray(this.Facility_Value) && this.Facility_Value.length > 0
          ? this.Facility_Value.join(',')
          : '',
      data: convertedData,
    };

    this.dataService.insertAccountHead(payload).subscribe({
      next: (response: any) => {
        const message =
          response?.Message ||
          (response?.flag === 1
            ? 'Saved successfully.'
            : 'Failed to save Account Head.');

        if (response?.flag === 1) {
          notify(
            { message, position: { at: 'top right', my: 'top right' } },
            'success',
            3000
          );
          this.popupVisible = false;
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
  updateAccountHead() {
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
        (id) => facilityTotals[id] !== 0 && facilityTotals[id] !== 100
      );

      if (invalidFacilities.length > 0) {
        const msg = `Total percentage must be exactly 100% for Facility(s): ${invalidFacilities.join(
          ', '
        )}`;
        notify(msg, 'error', 5000);
        return;
      }
    }

    const payload = {
      HeadID: this.EditingResponseData.HeadID,
      HeadName: this.HEAD_NAME,
      GroupID: this.selectedCategoryId,
      IsInactive: this.IsinActive,
      CostTypeID: this.CostTypeValue,
      IsOverhead: this.expenseTypeValue,
      HeadCode: this.HeadCode || '',
      CanBeGroupedInCosting: this.CanBeGroupedInCosting,
      CostingGroupID: this.CostingGroupID,
      IsQtyWeight:this.IsQtyWeight,
      FacilityID:
        Array.isArray(this.Facility_Value) && this.Facility_Value.length > 0
          ? this.Facility_Value.join(',')
          : '',
      data: convertedData,
    };

    this.dataService.updateAccountHead(payload).subscribe({
      next: (response: any) => {
        const message =
          response?.Message ||
          (response?.flag === 1
            ? 'Updated successfully.'
            : 'Failed to update Account Head.');

        if (response?.flag === 1) {
          notify(
            { message, position: { at: 'top center', my: 'top center' } },
            'success',
            3000
          );
          this.popupVisible = false;
          this.popupClosed.emit();
          this.categoryPopup = false;
          this.getGroupingList();
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
          CPTDepartmentID: Array.isArray(row['CPT Department'])
            ? row['CPT Department'].join(',')
            : '',
          CPTID: Array.isArray(row['CPT Code'])
            ? row['CPT Code'].join(',')
            : '',
          AllocationType: row['AllocationType'] || null, // ✅ Added
          CostPercent: row['Percentage'] || null,
          Amount: row['Amount'] || null,
          ClinicianID: Array.isArray(row['Clinician'])
            ? row['Clinician'].join(',')
            : '',
        });
      });
    }
    return rows;
  }

  handleClose() {
    this.popupVisible = false;
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
  ],
  providers: [],
  declarations: [AddAccountComponent],
  exports: [AddAccountComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddAccountModule {}
