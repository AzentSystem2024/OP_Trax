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
  DxTabPanelModule,
  DxTabsModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DataService } from 'src/app/services';
import { firstValueFrom } from 'rxjs';

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
    ADOCClassID: null,
    ADOCGroupID: null,
    data: [],
    CPTPrices: [],
    CPTWeightages: [],
  };
  ClinicianRoleDataSource: any;
  IsWeightGlobal: boolean = false;
  IsPriceGlobal: boolean = false;
  ledgerModeOptions = [
    { value: 0, text: 'All Ledgers' },
    { value: 1, text: 'Selected Ledger' },
  ];

  departmentMode: 0 | 1 = 0;

  encounterDepartmentData: any[] = [];

  ledgerMode: 0 | 1 = 0;
  selectedLedgerIds: number[] = [];
  ledgerList: any[] = [];

  ADOCClassDataSource: any[] = [];
  ADOCgroupDataSource: any[] = [];
  allADOCClassDataSource: any;

  priceDataSource: any[] = [];
  weightageDataSource: any[] = [];
  tabsWithText: any = [
    { id: 0, text: 'Price Data' },
    { id: 1, text: 'Weightage Data' },
  ];

  selectedTabIndex = 0;
  dropdownsLoaded: boolean = false;

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
  ) {
    this.selectedTabIndex = 0;
  }

  async ngOnInit() {
    try {
      await Promise.all([
        this.getCpt_DropDown(),
        this.get_ADOC_CLASS_Dropdown(),
        this.get_ADOC_GROUP_Dropdown(),
        this.get_local_storage_data()
      ]);

      this.dropdownsLoaded = true;

      this.bindFormData();
    } catch (error) {
      console.error(error);
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (!changes['formData'] || !this.formData?.ID) {
      return;
    }

    this.bindFormData();
  }

  private bindFormData(): void {
    if (!this.dropdownsLoaded || !this.formData) {
      return;
    }

    this.newCptMasterData = {
      ...this.formData,
    };

    this.selectedTabIndex = 0;

    if (this.newCptMasterData.ADOCGroupID) {
      this.onADOCGroupChanged({
        value: this.newCptMasterData.ADOCGroupID,
      });
    }
  }
  getUpdateCptMasterData = () => ({ ...this.newCptMasterData });

  onTabSelectionChanged(e: any) {
    this.selectedTabIndex = e.addedItems[0].id;
  }

  async getCpt_DropDown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.masterService.Get_GropDown('CPTTYPE'),
    );

    this.CptType_DropDownData = response || [];
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
      this.allADOCClassDataSource = response;
      this.ADOCClassDataSource = response;
    }
  }

  onADOCGroupChanged(e: any) {
    if (!e.value) {
      this.ADOCClassDataSource = [];
      return;
    }

    const selectedGroup = this.ADOCgroupDataSource.find(
      (x) => x.ID === e.value,
    );

    const prefix = selectedGroup.DESCRIPTION.split('-')[0]
      .trim()
      .charAt(0)
      .toUpperCase();

    this.ADOCClassDataSource = this.allADOCClassDataSource.filter((x: any) =>
      x.DESCRIPTION?.trim().toUpperCase().startsWith(prefix),
    );
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


  //======================Logcal storage Data ======================
  get_local_storage_data() {
    const data = JSON.parse(localStorage.getItem('logData') || '');
    this.IsWeightGlobal = data.cptWeightGlobal;
    this.IsPriceGlobal = data.cptPriceGlobal;
  }

  //==========================
  onRowPreparedWeightages(e: any) {
    if (e.rowType !== 'data') return;
    const data = this.newCptMasterData.CPTWeightages;
    if (!data || data.length === 0) return;
    const latestRow = data.reduce((a, b) =>
      new Date(a.CreatedTime) > new Date(b.CreatedTime) ? a : b
    );
    if (e.data === latestRow) {
      e.rowElement.classList.add('latest-row');
    }
  }

  //================latesed  pricerow color change========================
  onRowPreparedPrice(e: any) {
    if (
      e.rowType === 'data' &&
      e.rowIndex === this.newCptMasterData.CPTPrices.length - 1
    ) {
      e.rowElement.classList.add('latest-row');
    }
  }
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
    DxTabPanelModule,
    DxTabsModule,
  ],
  declarations: [CptMasterEditFormComponent],
  exports: [CptMasterEditFormComponent],
})
export class CptMasterEditFormModule { }
