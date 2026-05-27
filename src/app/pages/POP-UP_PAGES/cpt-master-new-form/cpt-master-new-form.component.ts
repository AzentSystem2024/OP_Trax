import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
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
  DxBoxModule,
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownBoxComponent,
  DxDropDownBoxModule,
  DxFormModule,
  DxNumberBoxModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { firstValueFrom } from 'rxjs';
import { ReportService } from 'src/app/services/Report-data.service';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-cpt-master-new-form',
  templateUrl: './cpt-master-new-form.component.html',
  styleUrls: ['./cpt-master-new-form.component.scss'],
})
export class CptMasterNewFormComponent implements OnInit {
  @ViewChild('gridRef', { static: false }) grid!: DxDataGridComponent;

  @ViewChild(DxDropDownBoxComponent, { static: false })
  facilityDropDownBox!: DxDropDownBoxComponent;

  @ViewChild('facilityGrid', { static: false })
  facilityGrid!: DxDataGridComponent;

  @ViewChild('CostdataGrid', { static: false })
  dataGrid!: DxDataGridComponent;

  @ViewChild('facilityValidator', { static: false }) facilityValidator: any;

  @ViewChild('encounterGrid', { static: false })
  encounterGrid!: DxDataGridComponent;

  // @Input() formData: any = null;

  CptMasterData = {
    ID: '',
    CPTTypeID: '',
    CPTCode: '',
    CPTName: '',
    Description: '',
    CPTGroup: '',
    DepartmentID: '',
    CPTDepartmentID: '',
    CostDepartmentID: '',
    FixedQuantity: 0,
    CostDriveID: 0,
    IsDifferentCPTDepartment:0,
    IsDifferentLedger:0,
    selectedLedgerID:'',
    CPTEncounterDepartments:[],
    data: [],
  };

  department_DropDownData: any;
  Subdepartment_DropDownData: any;
  Costdepartment_DropDownData: any;
  CptType_DropDownData: any;
  CostDrive_DropDownData: any;
  Facility_DataSource: any[] = [];
  Facility_Value: any;
  ClinicianRVUDataSource: any[] = [];
  CostTypeDataSource: any;
  CostBucketDataSource: any;
  ClinicianDataSource: any;
  ClinicianRoleDataSource: any;
  selectedMasterRow: any = null;

  departmentMode: 0 | 1 = 0;

  encounterDepartmentData: any[] = [];


  ledgerModeOptions = [
  { value: 0, text: 'All Ledgers' },
  { value: 1, text: 'Selected Ledger' }
];

  ledgerMode: 0 | 1 = 0;

  // Ledger master list
  ledgerList: any[] = [];
  // Selected ledger IDs
  selectedLedgerIds: number[] = [];

  newCptMasterData: any = this.CptMasterData;

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
    private cdRef: ChangeDetectorRef
  ) {
    this.getDepartment_DropDown();
    this.getCostDepartment_DropDown();
    this.getCpt_DropDown();
    this.getCostDrive_DropDown();
    this.getClinicianRole_DropDown();
  }

  async ngOnInit() {
    try {
      await this.get_Facility_dataList();
      await this.get_CostBucket_Dropdown();
      await this.get_CostType_Dropdown();
      await this.get_Clinician_Dropdown();
      await this.loadEncounterTypes();
      await this.loadLedger();
      // this.isEditDataAvailable();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
    }
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['formData'] && this.formData && this.formData.ID) {
  //     this.masterService
  //       .getSubDepartmentDropDownData(this.formData.DepartmentID)
  //       .subscribe({
  //         next: (response: any) => {
  //           this.Subdepartment_DropDownData = response.data;
  //         },
  //         error: (err) => {
  //           console.error('Error fetching sub departments:', err);
  //         },
  //       });

  //     this.newCptMasterData = { ...this.formData };
  //     this.onDepartmentChanged({});
  //   }
  // }

  async get_Facility_dataList(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.dataService.Get_User_Facility_List_Data()
      );
      if (res && res.data) {
        this.Facility_DataSource = res.data;
        console.log(this.Facility_DataSource,"facilityDatasource");
        this.newCptMasterData.data = this.Facility_DataSource.map((fac: any) => ({
          FacilityID: fac.FacilityLicense,
          RVU_Doctor: 0,
          RVU_Nurse: 0,
          RVU_Allied: 0,
          RVU_Cost: 0,
        }));

        console.log(this.CptMasterData,"cptmasterdata")
      }
    } catch (error) {}
  }

  async get_CostBucket_Dropdown(): Promise<void> {
    const dropdownType = 'COST_BUCKET';
    const response = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType)
    );
    if (response) {
      this.CostBucketDataSource = response;
      console.log(this.CostBucketDataSource, 'costbucketDatasource');
    }
  }

  async get_CostType_Dropdown(): Promise<void> {
    const dropdownType = 'COST_TYPE';
    const response = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType)
    );
    if (response) {
      this.CostTypeDataSource = response;
      console.log(this.CostBucketDataSource, 'costTypeDatasource');
    }
  }

  async get_Clinician_Dropdown(): Promise<void> {
    const dropdownType = 'CLINICIAN';
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown(dropdownType)
    );
    if (response) {
      // Prepend 'All' option
      this.ClinicianDataSource = [{ ID: -1, DESCRIPTION: 'All' }, ...response];
    }
  }

  async loadEncounterTypes() {
  const res: any = await firstValueFrom(
    this.dataService.Get_GropDown('ENCOUNTER_TYPE')
  );

  this.newCptMasterData.CPTEncounterDepartments = res.map((e: any) => ({
    EncounterType: e.DESCRIPTION,
    DepartmentID: null
  }));
}

async loadLedger() {
  const res: any = await firstValueFrom(
    this.dataService.Get_GropDown('AC_HEAD')
  );

   if (res) {
      this.ledgerList = res;
    }
}

  getNewCptMasterData = () => ({ ...this.newCptMasterData });

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

  getCostBucket_DropDown() {
    this.masterService.Get_GropDown('COST_BUCKET').subscribe((data: any) => {
      this.CostBucketDataSource = data;
    });
  }

  getClinicianRole_DropDown() {
    this.masterService.Get_GropDown('CLINICIAN_ROLE').subscribe((data: any) => {
      this.ClinicianRoleDataSource = data;
    });
  }

  checkDuplicateCPTCode = (params: any): Promise<boolean> => {
    const inputValue = params.value?.toLowerCase().trim();

    if (!inputValue) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      this.masterService.Get_GropDown('CPT_CODE').subscribe({
        next: (res: any) => {
          const exists = res?.some(
            (item: any) => item.DESCRIPTION?.toLowerCase().trim() === inputValue
          );
          resolve(!exists);
        },
        error: () => {
          resolve(true);
        },
      });
    });
  };

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

  clearForm() {
    this.newCptMasterData = {
      CPTCode: '',
      CPTName: '',
      Description: '',
      CPTTypeID: null,
      CPTGroup: '',
      CostDriveID: 0,
      FixedQuantity : 0,
      DepartmentID: null,
      CPTDepartmentID: null,
      CostDepartmentID: null,
      IsDifferentCPTDepartment:0,
      IsDifferentLedger:0,
      CPTEncounterDepartments : [],
      data: [],
    };
    this.CptMasterData.data = [];
    this.CptMasterData.CPTEncounterDepartments = [];
    this.CptMasterData = {
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
      FixedQuantity:0,
      IsDifferentCPTDepartment:0,
      IsDifferentLedger:0,
      selectedLedgerID:'',
      CPTEncounterDepartments : [],
      data: [],
    };

    this.Facility_Value = null;
  }


  onCostCenterChanged(e: any) {
  // Reset radio selection
  this.departmentMode = 0;

  // Clear COMMON selections
  this.newCptMasterData.DepartmentID = null;
  this.newCptMasterData.CPTDepartmentID = null;

  // Clear SEPARATE grid selections
  if (Array.isArray(this.newCptMasterData.CPTEncounterDepartments)) {
    this.newCptMasterData.CPTEncounterDepartments.forEach((row:any) => {
      row.DepartmentID = null;
    });
  }
}


  onRadioButtonChanged(e: any) {
  const selectedMode = e.value;

  if (selectedMode ==1) {
    // Clear SEPARATE values (grid)
    this.newCptMasterData.IsDifferentCPTDepartment = 1;
    if (Array.isArray(this.newCptMasterData.CPTEncounterDepartments)) {
      this.newCptMasterData.CPTEncounterDepartments.forEach((row:any) => {
        row.DepartmentID = null;
      });
    }
  }

  if (selectedMode ==0) {
    // Clear COMMON values
    this.newCptMasterData.IsDifferentCPTDepartment = 0;
    this.newCptMasterData.DepartmentID = null;
    this.newCptMasterData.CPTDepartmentID = null;
  }
}

validateDepartment = (e: any): boolean => {
  // e.value is DepartmentID
  return e.value !== null && e.value !== undefined && e.value !== '';
};

validateForm(): boolean {

  // 🔴 Ledger validation
  if (this.ledgerMode === 1 && (!this.selectedLedgerIds || !this.selectedLedgerIds.length)) {
    return false;
  }

  // 2️⃣ SEPARATE mode validation
  if (this.departmentMode === 1) {
    const rows = this.newCptMasterData.CPTEncounterDepartments || [];

    let isValid = true;

    rows.forEach((row:any, index:any) => {
      if (!row.DepartmentID) {
        isValid = false;

        // 🔥 Force grid validation error
        this.encounterGrid.instance.cellValue(
          index,
          'DepartmentID',
          null
        );
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


ledgerDisplayFormatter = (selectedIds: number[]) => {
  if (!selectedIds?.length) {
    return '';
  }

  return this.ledgerList
    .filter(l => selectedIds.includes(l.ID))
    .map(l => l.DESCRIPTION)
    .join(', ');
};

get selectedLedgerTooltip(): string {
  if (!this.selectedLedgerIds?.length) {
    return '';
  }

  return this.ledgerList
    .filter(l => this.selectedLedgerIds.includes(l.ID))
    .map(l => l.DESCRIPTION)
    .join(', ');
}

onledgerRadioButtonChanged(e: any) {
  const selectedMode = e.value;

  if (selectedMode ==1) {
    // Clear SEPARATE values (grid)
    this.newCptMasterData.IsDifferentLedger = 1;
  }

  if (selectedMode ==0) {
    // Clear COMMON values
    this.newCptMasterData.IsDifferentLedger = 0;
    this.newCptMasterData.selectedLedgerID = null;
  }
}

validateSelectedLedger = (): boolean => {
  // Validation only applies when Selected Ledger mode is ON
  if (this.ledgerMode === 1) {
    return Array.isArray(this.selectedLedgerIds) &&
           this.selectedLedgerIds.length > 0;
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
    DxBoxModule,
    DxNumberBoxModule,
    DxTagBoxModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxRadioGroupModule
  ],
  declarations: [CptMasterNewFormComponent],
  exports: [CptMasterNewFormComponent],
})
export class CptMasterNewFormModule {}
