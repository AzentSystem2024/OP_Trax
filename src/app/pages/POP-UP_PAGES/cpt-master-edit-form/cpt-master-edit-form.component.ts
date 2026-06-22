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
  DxCheckBoxModule,
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
  @Input() formData: any;

  CptType_DropDownData: any;

  newCptMasterData: any = {
    CPTCode: '',
    CPTTypeID: '',
    CPTName: '',
    CPTPrices: [],
    CPTWeightages: [],
    CPTADOCMappings: [],
    IsADOCExcluded: false,
  };

  IsWeightGlobal = false;
  IsPriceGlobal = false;

  tabsWithText = [
    { id: 0, text: 'CPT - ADOC Mapping' },
    { id: 1, text: 'Price History' },
    { id: 2, text: 'Weightage History' },
  ];

  specialityDataSource: any[] = [];
  ADOCClassDataSource: any[] = [];
  ADOCgroupDataSource: any[] = [];
  allADOCClassDataSource: any;
  ADOCApplicationDataSource: any[] = [];

  selectedTabIndex = 0;
  dropdownsLoaded = false;

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
  ) {}

  getUpdateCptMasterData = () => ({
    ...this.newCptMasterData,
    CPTADOCMappings: this.newCptMasterData.IsADOCExcluded
      ? []
      : (this.newCptMasterData.CPTADOCMappings || [])
          .filter(
            (x: any) =>
              x.SpecialityID != null &&
              x.ADOCClassID != null &&
              x.ADOCCategoryID != null,
          )
          .map((x: any) => {
            const { __KEY__, ...rest } = x;
            return {
              ...rest,
              ADOCApplicationID: rest.ADOCApplicationID || 0,
            };
          }),
  });

  async ngOnInit() {
    try {
      await Promise.all([
        this.getCpt_DropDown(),
        this.get_ADOC_CLASS_Dropdown(),
        this.get_ADOC_GROUP_Dropdown(),
        this.getSpecialityDropdown(),
        this.get_local_storage_data(),
        this.get_ADOC_Application_Dropdown(),
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
      CPTADOCMappings: [...(this.formData.CPTADOC || [])],
    };

    const hasEmptyRow = this.newCptMasterData.CPTADOCMappings.some(
      (row: any) =>
        (row.SpecialityID == null || row.SpecialityID === '') &&
        (row.ADOCClassID == null || row.ADOCClassID === '') &&
        (row.ADOCCategoryID == null || row.ADOCCategoryID === '') &&
        (row.ICDCode == null || row.ICDCode === ''),
    );

    // if (!hasEmptyRow) {
    //   this.newCptMasterData.CPTADOCMappings.push({
    //     SpecialityID: null,
    //     ICDCode: null,
    //     ADOCClassID: null,
    //     ADOCCategoryID: null,
    //     ADOCApplicationID: 0,
    //   });
    // }

    this.newCptMasterData.CPTADOCMappings = [
      ...this.newCptMasterData.CPTADOCMappings,
    ];

    this.selectedTabIndex = 0;
  }

  onTabSelectionChanged(e: any) {
    this.selectedTabIndex = e.addedItems[0].id;
  }

  async getSpecialityDropdown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown('CPT_SPECIALITY'),
    );

    this.specialityDataSource = response || [];
  }

  async getCpt_DropDown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.masterService.Get_GropDown('CPTTYPE'),
    );

    this.CptType_DropDownData = response || [];
  }

  async get_ADOC_GROUP_Dropdown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown('ADOC_GROUP'),
    );

    if (response) {
      this.ADOCgroupDataSource = response;
    }
  }

  async get_ADOC_CLASS_Dropdown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown('ADOC_CLASS'),
    );

    if (response) {
      this.allADOCClassDataSource = response;
      this.ADOCClassDataSource = response;
    }
  }

  async get_ADOC_Application_Dropdown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown('ADOC_APPLICATION'),
    );

    this.ADOCApplicationDataSource = response || [];
  }

  onEditorPreparingADOC(e: any) {
    if (this.newCptMasterData.IsADOCExcluded) {
      e.cancel = true;
      return;
    }
    // Prevent duplicate Specialty selection
    // if (e.parentType === 'dataRow' && e.dataField === 'SpecialityID') {
    //   const currentRow = e.row?.data;

    //   e.editorOptions.dataSource = this.specialityDataSource.filter(
    //     (speciality: any) => {
    //       return !this.newCptMasterData.CPTADOCMappings.some(
    //         (row: any) =>
    //           row !== currentRow && row.SpecialityID === speciality.ID,
    //       );
    //     },
    //   );
    // }

    // ADOC Class
    if (e.parentType === 'dataRow' && e.dataField === 'ADOCClassID') {
      const originalHandler = e.editorOptions.onValueChanged;

      e.editorOptions.onValueChanged = (args: any) => {
        originalHandler?.(args);

        const selectedClass = this.allADOCClassDataSource.find(
          (x: any) => x.ID === args.value,
        );

        if (!selectedClass?.DESCRIPTION) {
          e.component.cellValue(e.row.rowIndex, 'ADOCCategoryID', null);
          return;
        }

        const prefix = selectedClass.DESCRIPTION.trim().charAt(0).toUpperCase();

        const category = this.ADOCgroupDataSource.find(
          (x: any) => x.DESCRIPTION?.trim().charAt(0).toUpperCase() === prefix,
        );

        e.component.cellValue(
          e.row.rowIndex,
          'ADOCCategoryID',
          category?.ID ?? null,
        );

        setTimeout(() => {
          e.component.editCell(e.row.rowIndex, 'ICDCode');
        }, 10);
      };
    }

    // ICD Code
    if (e.parentType === 'dataRow' && e.dataField === 'ICDCode') {
      const originalKeyDown = e.editorOptions.onKeyDown;

      e.editorOptions.onKeyDown = (args: any) => {
        originalKeyDown?.(args);

        if (args.event.key !== 'Enter') {
          return;
        }

        // Commit current editor value immediately
        e.setValue(args.component.option('value'));
        e.component.closeEditCell();

        // Save edited ICD value
        e.component.saveEditData();

        const rowIndex = e.row.rowIndex;
        const currentRow = this.newCptMasterData.CPTADOCMappings[rowIndex];
        if (
          currentRow &&
          (currentRow.ADOCApplicationID == null ||
            currentRow.ADOCApplicationID === '')
        ) {
          currentRow.ADOCApplicationID = 0;
        }

        const lastRowIndex = this.newCptMasterData.CPTADOCMappings.length - 1;

        // Existing row edit -> just save
        if (rowIndex !== lastRowIndex) {
          return;
        }

        setTimeout(() => {
          const hasEmptyRow = this.newCptMasterData.CPTADOCMappings.some(
            (x: any) =>
              (x.SpecialityID == null || x.SpecialityID === '') &&
              (x.ADOCClassID == null || x.ADOCClassID === '') &&
              (x.ADOCCategoryID == null || x.ADOCCategoryID === '') &&
              (x.ICDCode == null || x.ICDCode === ''),
          );

          if (!hasEmptyRow) {
            this.newCptMasterData.CPTADOCMappings.push({
              SpecialityID: null,
              ICDCode: '',
              ADOCClassID: null,
              ADOCCategoryID: null,
              ADOCApplicationID: null,
            });

            this.newCptMasterData.CPTADOCMappings = [
              ...this.newCptMasterData.CPTADOCMappings,
            ];

            setTimeout(() => {
              const newRowIndex =
                this.newCptMasterData.CPTADOCMappings.length - 1;

              e.component.editCell(newRowIndex, 'SpecialityID');
            }, 50);
          }
        }, 50);
      };
    }

    // ADOC Application KeyDown to Save and Make New Row
    if (e.parentType === 'dataRow' && e.dataField === 'ADOCApplicationID') {
      const originalKeyDown = e.editorOptions.onKeyDown;

      e.editorOptions.onKeyDown = (args: any) => {
        originalKeyDown?.(args);

        if (args.event.key !== 'Enter') {
          return;
        }

        // Commit current editor value immediately
        e.setValue(args.component.option('value'));
        e.component.closeEditCell();

        // Save edited value
        e.component.saveEditData();

        const rowIndex = e.row.rowIndex;
        const currentRow = this.newCptMasterData.CPTADOCMappings[rowIndex];
        if (
          currentRow &&
          (currentRow.ADOCApplicationID == null ||
            currentRow.ADOCApplicationID === '')
        ) {
          currentRow.ADOCApplicationID = 0;
        }

        const lastRowIndex = this.newCptMasterData.CPTADOCMappings.length - 1;

        // Existing row edit -> just save
        if (rowIndex !== lastRowIndex) {
          return;
        }

        setTimeout(() => {
          const hasEmptyRow = this.newCptMasterData.CPTADOCMappings.some(
            (x: any) =>
              (x.SpecialityID == null || x.SpecialityID === '') &&
              (x.ADOCClassID == null || x.ADOCClassID === '') &&
              (x.ADOCCategoryID == null || x.ADOCCategoryID === '') &&
              (x.ICDCode == null || x.ICDCode === ''),
          );

          if (!hasEmptyRow) {
            this.newCptMasterData.CPTADOCMappings.push({
              SpecialityID: null,
              ICDCode: '',
              ADOCClassID: null,
              ADOCCategoryID: null,
              ADOCApplicationID: null,
            });

            this.newCptMasterData.CPTADOCMappings = [
              ...this.newCptMasterData.CPTADOCMappings,
            ];

            setTimeout(() => {
              const newRowIndex =
                this.newCptMasterData.CPTADOCMappings.length - 1;

              e.component.editCell(newRowIndex, 'SpecialityID');
            }, 50);
          }
        }, 50);
      };
    }
  }

  onInitNewRowADOC(e: any) {
    e.data.SpecialityID = null;
    e.data.ICDCode = '';
    e.data.ADOCClassID = null;
    e.data.ADOCCategoryID = null;
    e.data.ADOCApplicationID = null;
  }

  onRowValidatingADOC(e: any) {
    const data = { ...e.oldData, ...e.newData };
    const hasOtherValues =
      (data.SpecialityID != null && data.SpecialityID !== '') ||
      (data.ADOCClassID != null && data.ADOCClassID !== '') ||
      (data.ADOCCategoryID != null && data.ADOCCategoryID !== '') ||
      (data.ICDCode != null && data.ICDCode !== '');

    if (!hasOtherValues) {
      if (e.newData) {
        e.newData.ADOCApplicationID = null;
      }
      e.isValid = true;
      e.brokenRules = [];
      e.errorText = '';
    }
  }

  get_local_storage_data() {
    const data = JSON.parse(localStorage.getItem('logData') || '{}');

    this.IsWeightGlobal = data.cptWeightGlobal;
    this.IsPriceGlobal = data.cptPriceGlobal;
  }

  onRowPreparedWeightages(e: any) {
    if (e.rowType !== 'data') return;

    const data = this.newCptMasterData.CPTWeightages;

    if (!data || data.length <= 1) return;

    const latestRow = data.reduce((a: any, b: any) =>
      new Date(a.CreatedTime) > new Date(b.CreatedTime) ? a : b,
    );

    if (e.data === latestRow) {
      e.rowElement.classList.add('latest-row');
    }
  }

  onRowPreparedPrice(e: any) {
    if (e.rowType !== 'data') return;

    const data = this.newCptMasterData.CPTPrices;

    if (!data || data.length <= 1) return;

    const latestRow = data.reduce((a: any, b: any) =>
      new Date(a.CreatedTime) > new Date(b.CreatedTime) ? a : b,
    );

    if (e.data === latestRow) {
      e.rowElement.classList.add('latest-row');
    }
  }

  clearForm() {
    this.newCptMasterData = {
      CPTCode: '',
      CPTName: '',
      CPTTypeID: null,
      CPTPrices: [],
      CPTWeightages: [],
      CPTADOCMappings: [],
    };
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
    DxCheckBoxModule,
  ],
  declarations: [CptMasterEditFormComponent],
  exports: [CptMasterEditFormComponent],
})
export class CptMasterEditFormModule {}
