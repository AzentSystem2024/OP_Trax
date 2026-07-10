import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDataGridComponent,
  DxFormComponent,
  DxPopupModule,
  DxFormModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxDateBoxModule,
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../master-report.service';
import { DataService } from 'src/app/services';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exclusion-inclusion',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxPopupModule,
    DxFormModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxDateBoxModule,
  ],
  providers: [MasterReportService, DataService],
  templateUrl: './exclusion-inclusion.component.html',
  styleUrl: './exclusion-inclusion.component.scss',
})
export class ExclusionInclusionComponent {
  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid!: DxDataGridComponent;
  @ViewChild('addForm', { static: false }) addForm!: DxFormComponent;

  allowedPageSizes: any = [10, 20, 50];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  menuPrevilage: any;
  addButtonOptions: any;
  isDataAvailable: boolean = false;
  cptCodeList: any[] = [];
  specialityList: any[] = [];
  clinicianList: any[] = [];
  clinicianDataSource: any;
  icdCodeList: any[] = [];
  adocClassList: any[] = [];
  adocRuleList: any[] = [];

  isSpecialtyReadOnly = false;
  isAdocClassReadOnly = false;

  isAddPopupVisible = false;
  newRule: any = {
    CPTCode: null,
    Clinician: null,
    Specialty: null,
    ICDCode: null,
    ADOCRule: null,
    ADOCClass: null,
    EffectFrom: null,
  };

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_ExclusionInclusion_List().subscribe({
          next: (response: any) => {
            const dataWithSerialNo = (response.datas || []).map(
              (item: any, index: number) => ({
                ...item,
                ClinicianID: item.ClinicianID === 0 ? null : item.ClinicianID,
                SpecialtyID: item.SpecialtyID === 0 ? null : item.SpecialtyID,
                ADOCClassID: item.ADOCClassID === 0 ? null : item.ADOCClassID,
                SlNo: index + 1,
              }),
            );
            this.isDataAvailable = dataWithSerialNo.length > 0;
            resolve(dataWithSerialNo);
          },
          error: (error: any) => reject(error.message),
        });
      }),
  });

  constructor(
    private masterService: MasterReportService,
    private dataService: DataService,
    private route: ActivatedRoute,
  ) {
    this.dataService.Get_GropDown('SPECIALITY').subscribe((res: any) => {
      this.specialityList = res || [];
    });
    this.masterService.get_Clinian_Table_Data().subscribe((res: any) => {
      this.clinicianList = res.data || res || [];
      this.clinicianDataSource = new DataSource({
        store: {
          type: 'array',
          data: this.clinicianList,
          key: 'ID',
        },
        paginate: true,
        pageSize: 50,
      });
    });

    this.dataService.Get_GropDown('ADOC_APPLICATION').subscribe((res: any) => {
      this.adocRuleList = res.data || res || [];
    });

    this.dataService.Get_GropDown('ADOC_CLASS').subscribe((res: any) => {
      this.adocClassList = res;
    });

    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl) || {
        CanEdit: true,
        CanDelete: true,
        CanAdd: true,
      };
    });

    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => {
        this.showNewPopup();
      },
      elementAttr: { class: 'add-button' },
    };
  }

  showNewPopup() {
    this.newRule = {
      CPTCode: null,
      Clinician: null,
      Specialty: null,
      ICDCode: null,
      ADOCRule: null,
      ADOCClass: null,
      EffectFrom: null,
    };
    this.isSpecialtyReadOnly = false;
    this.isAdocClassReadOnly = false;
    this.isAddPopupVisible = true;
  }

  validateAdocClass = (e: any) => {
    if (this.isAdocClassReadOnly) {
      return true;
    }
    return e.value !== null && e.value !== undefined && e.value !== '';
  };

  onClinicianChangedInPopup = (e: any) => {
    if (e.value) {
      this.isSpecialtyReadOnly = true;
      const clinician = this.clinicianList.find((c) => c.ID === e.value);
      if (clinician && clinician.SpecialityID) {
        this.newRule.SpecialtyID = clinician.SpecialityID;
      } else {
        this.newRule.SpecialtyID = null;
      }
    } else {
      this.isSpecialtyReadOnly = false;
    }
  };

  onAdocRuleChangedInPopup = (e: any) => {
    const selectedRule = this.adocRuleList.find((r) => r.ID === e.value);
    if (
      selectedRule &&
      selectedRule.DESCRIPTION &&
      selectedRule.DESCRIPTION.toString().toLowerCase().includes('excluded')
    ) {
      this.isAdocClassReadOnly = true;
      this.newRule.ADOCClassID = null;
    } else {
      this.isAdocClassReadOnly = false;
    }
  };

  saveNewRule() {
    if (!this.addForm.instance.validate().isValid) {
      return;
    }

    let formattedDate = null;
    if (this.newRule.EffectFrom) {
      const d = new Date(this.newRule.EffectFrom);
      formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const payload = {
      CPTCode: this.newRule.CPTCode || '',
      ClinicianID: this.newRule.ClinicianID || 0,
      SpecialtyID: this.newRule.SpecialtyID || 0,
      ICDCode: this.newRule.ICDCode || '',
      ADOCStatusID: this.newRule.ADOCStatusID || 0,
      UserID: sessionStorage.getItem('UserID'),
      ADOCClassID: this.newRule.ADOCClassID || 0,
      EffectFrom: formattedDate,
    };

    this.masterService.Insert_ExclusionInclusion_Data(payload).subscribe({
      next: (response: any) => {
        if (response && response.flag === '1') {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: response.message || 'New data saved Successfully',
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );
          this.isAddPopupVisible = false;
        } else {
          notify(
            {
              message: response?.message || 'Your Data Not Saved',
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      },
      error: (err: any) => {
        notify(
          {
            message:
              err?.error?.message ||
              err?.message ||
              'An error occurred while saving data.',
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
      },
    });
  }

  //===================Row Data Update==========================
  onEditorPreparing(e: any) {
    if (e.parentType === 'dataRow') {
      if (e.dataField === 'ClinicianID') {
        this.isSpecialtyReadOnly = !!e.row.data.ClinicianID;
        const standardHandler = e.editorOptions.onValueChanged;
        e.editorOptions.onValueChanged = (args: any) => {
          if (standardHandler) standardHandler(args);
          this.isSpecialtyReadOnly = !!args.value;
          const clinician = this.clinicianList.find((c) => c.ID === args.value);
          if (clinician && clinician.SpecialityID) {
            e.component.cellValue(
              e.row.rowIndex,
              'SpecialtyID',
              clinician.SpecialityID,
            );
          } else {
            e.component.cellValue(e.row.rowIndex, 'SpecialtyID', null);
          }
        };
      }
      if (e.dataField === 'SpecialtyID') {
        if (e.row.data.ClinicianID) {
          e.editorOptions.readOnly = true;
        } else {
          e.editorOptions.readOnly = false;
        }
      }
      if (e.dataField === 'ADOCStatusID') {
        const initialRule = this.adocRuleList.find(
          (r) => r.ID === e.row.data.ADOCStatusID,
        );
        this.isAdocClassReadOnly = !!(
          initialRule &&
          initialRule.DESCRIPTION &&
          initialRule.DESCRIPTION.toString().toLowerCase().includes('excluded')
        );

        const standardHandler = e.editorOptions.onValueChanged;
        e.editorOptions.onValueChanged = (args: any) => {
          if (standardHandler) standardHandler(args);
          const selectedRule = this.adocRuleList.find(
            (r) => r.ID === args.value,
          );

          this.isAdocClassReadOnly = !!(
            selectedRule &&
            selectedRule.DESCRIPTION &&
            selectedRule.DESCRIPTION.toString()
              .toLowerCase()
              .includes('excluded')
          );

          if (this.isAdocClassReadOnly) {
            e.component.cellValue(e.row.rowIndex, 'ADOCClassID', null);
          }
        };
      }
    }
  }

  onRowUpdating(event: any) {
    event.cancel = true;
    const updataDate = event.newData;
    const oldData = event.oldData;

    const combinedData = { ...oldData, ...updataDate };

    let formattedDate = null;
    if (combinedData.EffectFrom) {
      const d = new Date(combinedData.EffectFrom);
      formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const payload = {
      ID: combinedData.ID || null,
      CPTCode: combinedData.CPTCode || '',
      ClinicianID: combinedData.ClinicianID || 0,
      SpecialtyID: combinedData.SpecialtyID || 0,
      ICDCode: combinedData.ICDCode || '',
      ADOCStatusID: combinedData.ADOCStatusID || 0,
      UserID: sessionStorage.getItem('UserID'),
      ADOCClassID: combinedData.ADOCClassID || 0,
      EffectFrom: formattedDate,
    };

    this.masterService.update_ExclusionInclusion_data(payload).subscribe({
      next: (data: any) => {
        if (data && data.flag === '1') {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: data.message || 'Data updated Successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
        } else {
          notify(
            {
              message: data?.message || 'Your Data Not Saved',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
        }
        event.component.cancelEditData();
        this.dataGrid.instance.refresh();
      },
      error: (err: any) => {
        notify(
          {
            message:
              err?.error?.message ||
              err?.message ||
              'An error occurred while updating data.',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error',
        );
        event.component.cancelEditData();
      },
    });
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    const id = SelectedRow.ID ? SelectedRow.ID : SelectedRow;

    this.masterService.Remove_ExclusionInclusion_Row_Data(id).subscribe({
      next: (response: any) => {
        if (response && response.flag === '1') {
          notify(
            {
              message: response.message || 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
        } else {
          notify(
            {
              message: response?.message || 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
        }
        event.component.refresh();
        this.dataGrid.instance.refresh();
      },
      error: (err: any) => {
        notify(
          {
            message:
              err?.error?.message ||
              err?.message ||
              'An error occurred while deleting data.',
            position: { at: 'top right', my: 'top right' },
            displayTime: 500,
          },
          'error',
        );
      },
    });
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  refresh = () => {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.refresh();
    }
  };
}
