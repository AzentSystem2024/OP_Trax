import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxBoxModule,
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
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
  };

  IsWeightGlobal = false;
  IsPriceGlobal = false;

  specialityDataSource: any[] = [];
  ADOCClassDataSource: any[] = [];
  ADOCgroupDataSource: any[] = [];
  allADOCClassDataSource: any;

  selectedTabIndex = 0;
  dropdownsLoaded = false;

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
  ) {}

  getNewCptMasterData = () => ({
    ...this.newCptMasterData,
    CPTADOCMappings: (this.newCptMasterData.CPTADOCMappings || []).filter(
      (x: any) =>
        x.SpecialityID != null &&
        x.ADOCClassID != null &&
        x.ADOCCategoryID != null,
    ),
  });

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([
        this.getCpt_DropDown(),
        this.getSpecialityDropdown(),
        this.get_ADOC_CLASS_Dropdown(),
        this.get_ADOC_GROUP_Dropdown(),
      ]);

      if (!this.newCptMasterData.CPTADOCMappings.length) {
        this.newCptMasterData.CPTADOCMappings = [
          {
            SpecialityID: null,
            ADOCClassID: null,
            ADOCCategoryID: null,
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
    // Prevent duplicate Specialty selection
    if (e.parentType === 'dataRow' && e.dataField === 'SpecialityID') {
      const currentRow = e.row?.data;

      e.editorOptions.dataSource = this.specialityDataSource.filter(
        (speciality: any) => {
          return !this.newCptMasterData.CPTADOCMappings.some(
            (row: any) =>
              row !== currentRow && row.SpecialityID === speciality.ID,
          );
        },
      );
    }

    // Auto populate ADOC Category when ADOC Class changes
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

        // Update category
        e.component.cellValue(
          e.row.rowIndex,
          'ADOCCategoryID',
          category?.ID ?? null,
        );

        // Commit row immediately
        setTimeout(() => {
          e.component.saveEditData();
        }, 10);
      };
    }
  }

  onADOCMappingRowUpdated(e: any) {
    const row = e.data;

    const isCompleted =
      row?.SpecialityID != null &&
      row?.ADOCClassID != null &&
      row?.ADOCCategoryID != null;

    if (!isCompleted) {
      return;
    }

    const hasEmptyRow = this.newCptMasterData.CPTADOCMappings.some(
      (x: any) =>
        x.SpecialityID == null &&
        x.ADOCClassID == null &&
        x.ADOCCategoryID == null,
    );

    if (hasEmptyRow) {
      return;
    }

    this.newCptMasterData.CPTADOCMappings.push({
      SpecialityID: null,
      ADOCClassID: null,
      ADOCCategoryID: null,
    });

    this.newCptMasterData.CPTADOCMappings = [
      ...this.newCptMasterData.CPTADOCMappings,
    ];
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
    DxBoxModule,
    DxNumberBoxModule,
    DxTagBoxModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxRadioGroupModule,
    DxDateBoxModule,
  ],
  declarations: [CptMasterNewFormComponent],
  exports: [CptMasterNewFormComponent],
})
export class CptMasterNewFormModule {}
