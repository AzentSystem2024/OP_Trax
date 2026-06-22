import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxBoxModule,
  DxButtonModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxNumberBoxModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxCheckBoxModule,
} from 'devextreme-angular';
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { firstValueFrom } from 'rxjs';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-cpt-master-new-form',
  templateUrl: './cpt-master-new-form.component.html',
  styleUrls: ['./cpt-master-new-form.component.scss'],
})
export class CptMasterNewFormComponent implements OnInit {
  CptType_DropDownData: any;

  newCptMasterData: any = {
    CPTCode: '',
    CPTTypeID: '',
    CPTName: '',
    CPTPrice: null,
    PriceEffectFrom: null,
    CPTWeightage: null,
    WeightageEffectFrom: null,
    CPTADOCMappings: [],
    IsADOCExcluded: false,
  };

  IsWeightGlobal = false;
  IsPriceGlobal = false;

  specialityDataSource: any[] = [];
  ADOCClassDataSource: any[] = [];
  ADOCgroupDataSource: any[] = [];
  allADOCClassDataSource: any;

  selectedTabIndex = 0;
  dropdownsLoaded = false;

  ADOCApplicationDataSource: any[] = [];

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
  ) {}

  getNewCptMasterData = () => ({
    ...this.newCptMasterData,
    CPTADOCMappings: (this.newCptMasterData.CPTADOCMappings || [])
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

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([
        this.getCpt_DropDown(),
        this.getSpecialityDropdown(),
        this.get_ADOC_CLASS_Dropdown(),
        this.get_ADOC_GROUP_Dropdown(),
        this.get_ADOC_Application_Dropdown(),
      ]);

      if (!this.newCptMasterData.CPTADOCMappings.length) {
        this.newCptMasterData.CPTADOCMappings = [
          {
            SpecialityID: null,
            ICDCode: '',
            ADOCClassID: null,
            ADOCCategoryID: null,
            ADOCApplicationID: null,
          },
        ];
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
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

    this.ADOCgroupDataSource = response || [];
  }

  async get_ADOC_CLASS_Dropdown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown('ADOC_CLASS'),
    );

    this.allADOCClassDataSource = response || [];
    this.ADOCClassDataSource = [...this.allADOCClassDataSource];
  }

  async get_ADOC_Application_Dropdown(): Promise<void> {
    const response: any = await firstValueFrom(
      this.dataService.Get_GropDown('ADOC_APPLICATION'),
    );

    this.ADOCApplicationDataSource = response || [];
  }

  onADOCGroupChanged(e: any) {
    this.newCptMasterData.ADOCClassID = null;

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

  checkDuplicateCPTCode = (params: any): Promise<boolean> => {
    const inputValue = params.value?.toLowerCase().trim();

    if (!inputValue) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      this.masterService.Get_GropDown('CPT_CODE').subscribe({
        next: (res: any) => {
          const exists = res?.some(
            (item: any) =>
              item.DESCRIPTION?.toLowerCase().trim() === inputValue,
          );
          resolve(!exists);
        },
        error: () => {
          resolve(true);
        },
      });
    });
  };

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

  onADOCRowRemoving(e: any) {
    const row = e.data;

    const isEmptyRow =
      (row.SpecialityID == null || row.SpecialityID === '') &&
      (row.ADOCClassID == null || row.ADOCClassID === '') &&
      (row.ADOCCategoryID == null || row.ADOCCategoryID === '') &&
      (row.ICDCode == null || row.ICDCode.trim() === '');

    // Prevent deleting the empty row
    if (isEmptyRow) {
      e.cancel = true;
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

  clearForm() {
    this.newCptMasterData = {
      CPTCode: '',
      CPTName: '',
      CPTTypeID: null,
      CPTPrices: [],
      CPTWeightages: [],
      CPTADOCMappings: [],
      IsADOCExcluded: false,
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
    DxBoxModule,
    DxNumberBoxModule,
    DxTagBoxModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxRadioGroupModule,
    DxDateBoxModule,
    DxCheckBoxModule,
  ],
  declarations: [CptMasterNewFormComponent],
  exports: [CptMasterNewFormComponent],
})
export class CptMasterNewFormModule {}
