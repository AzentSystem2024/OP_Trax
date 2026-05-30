import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownBoxComponent,
  DxDropDownBoxModule,
  DxFormModule,
  DxNumberBoxModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DataService } from 'src/app/services';
import { firstValueFrom } from 'rxjs';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-cpt-master-edit-form',
  templateUrl: './cpt-master-edit-form.component.html',
  styleUrls: ['./cpt-master-edit-form.component.scss'],
})
export class CptMasterEditFormComponent implements OnChanges, OnInit {
  @ViewChild(DxDropDownBoxComponent, { static: false })
  facilityDropDownBox!: DxDropDownBoxComponent;

  @ViewChild('facilityGrid', { static: false })
  facilityGrid!: DxDataGridComponent;

  @ViewChild('CostdataGrid', { static: false })
  dataGrid!: DxDataGridComponent;

  @ViewChild('facilityValidator', { static: false }) facilityValidator: any;

  @ViewChild('encounterGrid', { static: false })
  encounterGrid!: DxDataGridComponent;

  @Input() formData: any;

  department_DropDownData: any;
  Subdepartment_DropDownData: any;
  Costdepartment_DropDownData: any;
  CptType_DropDownData: any;
  CostDrive_DropDownData: any;
  CostTypeDataSource: any;
  CostBucketDataSource: any;
  ClinicianDataSource: any;
  Facility_DataSource: any[] = [];
  Facility_Value: any;
  facilityDataMap: { [facilityId: string]: any[] } = {};

  newCptMasterData: any = {
    ID: '',
    CPTTypeID: '',
    CPTCode: '',
    CPTName: '',
    Description: '',
    CPTGroup: '',
    DepartmentID: '',
    CPTDepartmentID: '',
    CostDepartmentID: '',
    CostDriveID: 0,
    FixedQuantity: 0,
    IsDifferentCPTDepartment: 0,
    IsDifferentLedger: 0,
    selectedLedgerID: '',
    CPTEncounterDepartments: [],
    ADOCClassID: 0,
    ADOCGroupID: 0,
    data: [],
  };
  ClinicianRoleDataSource: any;

  ledgerModeOptions = [
    { value: 0, text: 'All Ledgers' },
    { value: 1, text: 'Selected Ledger' },
  ];

  departmentMode: 0 | 1 = 0;

  encounterDepartmentData: any[] = [];

  ledgerMode: 0 | 1 = 0;
  selectedLedgerIds: number[] = [];
  ledgerList: any[] = [];
  ADOCClassDataSource: any[]=[];
  ADOCgroupDataSource: any[]=[];

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
  ) {
    this.getDepartment_DropDown();
    this.getCostDepartment_DropDown();
    this.getCpt_DropDown();
    this.getCostDrive_DropDown();
  }

  async ngOnInit() {
    try {
      await this.get_Facility_dataList();
      await this.get_CostBucket_Dropdown();
      await this.get_CostType_Dropdown();
      await this.get_Clinician_Dropdown();
      await this.loadLedger();
      this.getClinicianRole_DropDown();
      await this.loadEncounterTypes();
    } catch (error) {
    } finally {
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (!changes['formData'] || !this.formData || !this.formData.ID) {
      return;
    }

    /* ===============================
     1. Load Sub-Departments (COMMON)
     =============================== */
    if (this.formData.DepartmentID) {
      this.masterService
        .getSubDepartmentDropDownData(this.formData.DepartmentID)
        .subscribe({
          next: (response: any) => {
            this.Subdepartment_DropDownData = response.data;
          },
          error: (err) => {
            console.error('Error fetching sub departments:', err);
          },
        });
    }

    /* ===============================
     2. Merge RVU data with Facilities
     =============================== */
    const savedData = this.formData.data || [];

    // ⬇️ WAIT properly
    await this.get_Facility_dataList();

    const allFacilities = this.Facility_DataSource || [];

    const mergedData = allFacilities.map((fac: any) => {
      const savedRow = savedData.find(
        (d: any) => d.FacilityID === fac.FacilityLicense,
      );

      return {
        FacilityID: fac.FacilityLicense,
        RVU_Doctor: savedRow?.RVU_Doctor || 0,
        RVU_Nurse: savedRow?.RVU_Nurse || 0,
        RVU_Allied: savedRow?.RVU_Allied || 0,
        RVU_Cost: savedRow?.RVU_Cost || 0,
      };
    });

    /* ===============================
     3. Bind Base CPT Master Data
     =============================== */
    this.newCptMasterData = {
      ...this.formData,
      data: mergedData,
    };

    /* ===============================
     4. Determine MODE (ONCE)
     =============================== */
    this.departmentMode = this.formData.IsDifferentCPTDepartment ? 1 : 0;

    if (
      Array.isArray(this.formData.CPTEncounterDepartments) &&
      this.formData.CPTEncounterDepartments.length > 0
    ) {
      // -------- SEPARATE MODE --------
      this.newCptMasterData.CPTEncounterDepartments =
        this.formData.CPTEncounterDepartments.map((x: any) => ({
          EncounterType: x.EncounterType,
          DepartmentID: x.DepartmentID,
        }));

      // Clear COMMON values
      this.newCptMasterData.DepartmentID = null;
      this.newCptMasterData.CPTDepartmentID = null;
    } else {
      // -------- COMMON MODE --------
      this.encounterDepartmentData = [];

      this.onDepartmentChanged({
        value: this.newCptMasterData.DepartmentID,
      });
    }

    this.ledgerMode = this.formData.IsDifferentLedger ? 1 : 0;

    if (
      this.ledgerMode === 1 &&
      this.formData.SelectedLedgerID &&
      typeof this.formData.SelectedLedgerID === 'string'
    ) {
      this.selectedLedgerIds = this.formData.SelectedLedgerID.split(',')
        .map((x: string) => +x)
        .filter((x: number) => !isNaN(x));
    } else {
      this.selectedLedgerIds = [];
    }

    /* ===============================
     ✅ FINAL LOG (REAL FINAL VALUE)
     =============================== */
    console.log(this.departmentMode, 'FINAL departmentMode');
  }

  getClinicianRole_DropDown() {
    this.masterService.Get_GropDown('CLINICIAN_ROLE').subscribe((data: any) => {
      this.ClinicianRoleDataSource = data;
    });
  }

  onAddRowClick = () => {
    // const result = this.facilityValidator?.instance?.validate();
    // if (!result?.isValid) {
    //   return;
    // }
    this.dataGrid.instance.addRow();
  };

  getUpdateCptMasterData = () => ({ ...this.newCptMasterData });

  getDepartment_DropDown() {
    this.masterService.Get_GropDown('DEPARTMENT').subscribe((data: any) => {
      this.department_DropDownData = data;
    });
  }

  getSubDepartment_DropDown() {
    this.masterService.Get_GropDown('SUB_DEPARTMENT').subscribe((data: any) => {
      this.Subdepartment_DropDownData = data;
    });
  }

  getCostDepartment_DropDown() {
    this.masterService
      .Get_GropDown('COST_DEPARTMENT')
      .subscribe((data: any) => {
        this.Costdepartment_DropDownData = data;
      });
  }

  getCpt_DropDown() {
    this.masterService.Get_GropDown('CPTTYPE').subscribe((data: any) => {
      this.CptType_DropDownData = data;
    });
  }

  getCostDrive_DropDown() {
    this.masterService.Get_GropDown('COST_DRIVE').subscribe((data: any) => {
      this.CostDrive_DropDownData = data;
    });
  }

    async get_ADOC_GROUP_Dropdown(): Promise<void> {
      const dropdownType = 'ADOC_GROUP';
      const response: any = await firstValueFrom(
        this.dataService.Get_GropDown(dropdownType),
      );
      if (response) {
        // Prepend 'All' option
        this.ADOCgroupDataSource = response;
      }
    }
  
    async get_ADOC_CLASS_Dropdown(): Promise<void> {
      const dropdownType = 'ADOC_CLASS';
      const response: any = await firstValueFrom(
        this.dataService.Get_GropDown(dropdownType),
      );
      if (response) {
        // Prepend 'All' option
        this.ADOCClassDataSource = response;
      }
    }

  // =============== facility dropdown used row marking ========
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

  onDepartmentChanged(e: any) {
    const selectedDepartmentId = e.value;

    if (selectedDepartmentId) {
      this.masterService
        .getSubDepartmentDropDownData(selectedDepartmentId)
        .subscribe({
          next: (response: any) => {
            console.log('Sub departments:', response);
            this.Subdepartment_DropDownData = response.data; // or however you want to use it
          },
          error: (err) => {
            console.error('Error fetching sub departments:', err);
          },
        });
    }
  }

  onClickAddRow(masterRow: any, gridInstance: any) {
    // Check if 'All' is already selected in any row
    const hasAllSelected = masterRow.data.Clinicians?.some(
      (row: any) => row.ClinicianID === -1,
    );

    if (hasAllSelected) {
      notify('All clinicians are already selected.', 'warning', 3000);
      return; // Don't add another row if 'All' is selected
    }

    if (!masterRow.data.Clinicians) {
      masterRow.data.Clinicians = [];
    }

    // Add new row
    masterRow.data.Clinicians.push({
      ClinicianID: null,
      ClinicianRoleID: null,
      RVU: null,
    });

    setTimeout(() => {
      const lastRowIndex = masterRow.data.Clinicians.length - 1;
      gridInstance.editCell(lastRowIndex, 'ClinicianID');
    }, 100);
  }
  // ========= custom validation for cost bucket column ===========
  validateCostBucket = (e: any) => {
    const row = e.data || {};

    const hasTriggerField =
      (row.Description && row.Description.toString().trim() !== '') ||
      (row.RVU !== null && row.RVU !== undefined && row.RVU !== '') ||
      (row.CostTypeID !== null &&
        row.CostTypeID !== undefined &&
        row.CostTypeID !== '');

    if (hasTriggerField) {
      return (
        row.CostBucketID !== null &&
        row.CostBucketID !== undefined &&
        row.CostBucketID !== ''
      );
    }
    return true;
  };

  // ========== DATA GRID VALIDATION TO SKIP EMPTY ROW ==========
  onRowValidating(e: any) {
    const data = e.newData ? { ...e.oldData, ...e.newData } : e.oldData;
    const hasAnyOtherField =
      (data['Description'] && data['Description'].trim() !== '') ||
      (data['RVU'] != null && data['RVU'] !== '') ||
      (data['CostTypeID'] != null && data['CostTypeID'] !== '');
    const costBucketEmpty =
      data['CostBucketID'] == null || data['CostBucketID'] === '';
    if (hasAnyOtherField && costBucketEmpty) {
      e.isValid = false;
    }
  }
  // ========== REMOVE EMPTY ROWS AFTER INSERT ==========
  onRowInserted(e: any) {
    this.dataGrid.instance.addRow();
  }

  onRowInserting(e: any) {
    if (!this.Facility_Value) {
      e.cancel = true;
      notify('Please select a Facility before adding a row.', 'warning', 3000);
      return;
    }
  }

  onSubRowInserting(e: any, parentRow: any) {
    // Ensure the array exists (optional safeguard)
    if (!parentRow.Clinicians) {
      parentRow.Clinicians = [];
    }
  }

  async get_Facility_dataList(): Promise<void> {
    // this.loadingVisible = true;
    try {
      const res: any = await firstValueFrom(
        this.dataService.Get_User_Facility_List_Data(),
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

  async get_CostBucket_Dropdown(): Promise<void> {
    const dropdownType = 'COST_BUCKET';
    const response = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType),
    );
    if (response) {
      this.CostBucketDataSource = response;
      console.log(this.CostBucketDataSource, 'costbucketDatasource');
    }
  }

  async get_CostType_Dropdown(): Promise<void> {
    const dropdownType = 'COST_TYPE';
    const response = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType),
    );
    if (response) {
      this.CostTypeDataSource = response;
      console.log(this.CostBucketDataSource, 'costTypeDatasource');
    }
  }

  async get_Clinician_Dropdown(): Promise<void> {
    const dropdownType = 'CLINICIAN';
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType),
    );
    if (response) {
      // Prepend 'All' option
      this.ClinicianDataSource = [{ ID: -1, DESCRIPTION: 'All' }, ...response];
    }
  }

  async loadEncounterTypes() {
    const res: any = await firstValueFrom(
      this.dataService.Get_GropDown('ENCOUNTER_TYPE'),
    );

    if (this.newCptMasterData.CPTEncounterDepartments?.length) {
      return;
    }

    this.newCptMasterData.CPTEncounterDepartments = res.map((e: any) => ({
      EncounterType: e.DESCRIPTION,
      DepartmentID: null,
    }));
  }

  async loadLedger() {
    const res: any = await firstValueFrom(
      this.dataService.Get_GropDown('AC_HEAD'),
    );
    if (res) {
      this.ledgerList = res;
    }
  }

  clearForm() {
    this.newCptMasterData = {
      CPTCode: '',
      CPTName: '',
      Description: '',
      CPTTypeID: null,
      CPTGroup: '',
      CostDriveID: 0,
      FixedQuantity: 0,
      DepartmentID: null,
      CPTDepartmentID: null,
      CostDepartmentID: null,
      ADOCClassID: 0,
      ADOCGroupID: 0,
      data: [],
    };

    this.Facility_Value = null;
  }

  onCostCenterChanged(e: any) {
    // Reset radio selection
    // this.departmentMode = 0;

    // Clear COMMON selections

    // Clear SEPARATE grid selections
    if (Array.isArray(this.newCptMasterData.CPTEncounterDepartments)) {
      this.newCptMasterData.CPTEncounterDepartments.forEach((row: any) => {
        // row.DepartmentID = null;
      });
    }
  }

  onRadioButtonChanged(e: any) {
    const selectedMode = e.value;

    if (selectedMode == 1) {
      // Clear SEPARATE values (grid)
      this.newCptMasterData.IsDifferentCPTDepartment = 1;
      console.log(
        this.newCptMasterData.IsDifferentCPTDepartment,
        '$$$$$$$$$$$$$$$$$4',
      );
      if (Array.isArray(this.newCptMasterData.CPTEncounterDepartments)) {
        this.newCptMasterData.CPTEncounterDepartments.forEach((row: any) => {
          // row.DepartmentID = null;
        });
      }
    }

    if (selectedMode == 0) {
      // Clear COMMON values
      this.newCptMasterData.IsDifferentCPTDepartment = 0;
    }
  }

  validateDepartment = (e: any): boolean => {
    // e.value is DepartmentID
    return e.value !== null && e.value !== undefined && e.value !== '';
  };

  validateForm(): boolean {
    // 🔴 Ledger validation
    if (
      this.ledgerMode === 1 &&
      (!this.selectedLedgerIds || !this.selectedLedgerIds.length)
    ) {
      return false;
    }

    // 2️⃣ SEPARATE mode validation
    if (this.departmentMode === 1) {
      const rows = this.newCptMasterData.CPTEncounterDepartments || [];

      let isValid = true;

      rows.forEach((row: any, index: any) => {
        if (!row.DepartmentID) {
          isValid = false;

          // 🔥 Force grid validation error
          this.encounterGrid.instance.cellValue(index, 'DepartmentID', null);
        }
      });

      if (!isValid) {
        // 🔥 This makes grid show red error message
        this.encounterGrid.instance.repaint();
        return false;
      }
    }

    return true;
  }

  get selectedLedgerTooltip(): string {
    if (!this.selectedLedgerIds?.length) {
      return '';
    }

    return this.ledgerList
      .filter((l) => this.selectedLedgerIds.includes(l.ID))
      .map((l) => l.DESCRIPTION)
      .join(', ');
  }

  onledgerRadioButtonChanged(e: any) {
    const selectedMode = e.value;

    if (selectedMode == 1) {
      // Clear SEPARATE values (grid)
      this.newCptMasterData.IsDifferentLedger = 1;
    }

    if (selectedMode == 0) {
      // Clear COMMON values
      this.newCptMasterData.IsDifferentLedger = 0;
    }
  }

  validateSelectedLedger = (): boolean => {
    // Validation only applies when Selected Ledger mode is ON
    if (this.ledgerMode === 1) {
      return (
        Array.isArray(this.selectedLedgerIds) &&
        this.selectedLedgerIds.length > 0
      );
    }
    return true; // All Ledger → always valid
  };
}
@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    DxTextAreaModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxRadioGroupModule,
  ],
  declarations: [CptMasterEditFormComponent],
  exports: [CptMasterEditFormComponent],
})
export class CptMasterEditFormModule {}
