import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDataGridComponent, DxCheckBoxModule,
  DxDropDownButtonModule,
  DxFormComponent,
  DxFormModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidationSummaryModule,
  DxValidatorModule,
  DxDateBoxModule
} from 'devextreme-angular';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { DataSource } from 'devextreme/common/data';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-icd-adoc-mapping',
  templateUrl: './icd-adoc-mapping.component.html',
  styleUrls: ['./icd-adoc-mapping.component.scss'],
  providers: [ReportService, DataService],
})
export class IcdAdocMappingComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild('addForm', { static: false })
  addForm!: DxFormComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  isAddPopupVisible = false;

  specialityList: any[] = [];
  adocClassList: any[] = [];

  versionList: any[] = [];
  selectedVersion: string = '';
  versionValueExpr: any | undefined = undefined;

  displayVersionExpr = (item: any) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return (
      item.DESCRIPTION ||
      item.Description ||
      item.Name ||
      item.Version ||
      item.version ||
      item.ID ||
      ''
    );
  };

  customizeSpecialtyText = (cellInfo: any) => {
    if (cellInfo.value === 0 || cellInfo.value === '0') {
      return 'N/A';
    }
    return cellInfo.valueText || (cellInfo.value ?? '');
  };

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        if (!this.selectedVersion) {
          resolve([]);
          return;
        }
        const versionParam = String(this.selectedVersion);
        this.masterService.get_icdAdocMapping_List(versionParam).subscribe({
          next: (response: any) =>
            resolve(response.datas || response.data || response || []),
          error: (error: any) => reject(error.message),
        });
      }),
  });

  addButtonOptions: any;
  editButtonOptions: any;
  isEditingEnabled: boolean = false;

  menuPrevilage: any;

  newIcdAdocMapping = {
    SpecialtyID: null,
    ICDCode: '',
    ADOCClassID: null,
    EffectFrom: null as Date | null,
  };
  isFilterApplied: boolean = false;

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private route: ActivatedRoute,
    private dataService: DataService,
    private notificationService: NotificationService,
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });

    this.dataService.Get_GropDown('SPECIALITY').subscribe((res: any) => {
      const list = Array.isArray(res) ? res : res?.data || [];
      this.specialityList = [{ ID: 0, DESCRIPTION: 'N/A' }, ...list];
    });

    this.dataService.Get_GropDown('ADOC_CLASS').subscribe((res: any) => {
      this.adocClassList = res;
    });

    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.showNewPopup(),
      elementAttr: { class: 'add-button' },
    };

    this.editButtonOptions = {
      class: 'ms-2',
      text: '',
      icon: 'edit',
      type: 'default',
      stylingMode: 'default',
      hint: 'Toggle Edit Mode',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: this.toggleEditMode,
      elementAttr: { class: 'edit-button' },
    };
  }

  ngOnInit() {
    this.get_ADOC_VERSION_Dropdown();
  }

  get_ADOC_VERSION_Dropdown(): void {
    this.dataService.Get_GropDown('ADOC_VERSION').subscribe({
      next: (response: any) => {
        this.versionList = Array.isArray(response)
          ? response
          : response?.data || [];
        if (this.versionList.length > 0) {
          const latestItem =
            [...this.versionList].sort((a: any, b: any) => {
              const idA = a?.ID !== undefined ? Number(a.ID) : 0;
              const idB = b?.ID !== undefined ? Number(b.ID) : 0;
              if (idA !== idB) return idB - idA;
              const descA = parseFloat(a?.DESCRIPTION || '0');
              const descB = parseFloat(b?.DESCRIPTION || '0');
              return descB - descA;
            })[0] || this.versionList[this.versionList.length - 1];

          if (latestItem && typeof latestItem === 'object') {
            this.versionValueExpr =
              latestItem.DESCRIPTION !== undefined
                ? 'DESCRIPTION'
                : latestItem.ID !== undefined
                  ? 'ID'
                  : undefined;
            const val =
              latestItem.DESCRIPTION !== undefined
                ? latestItem.DESCRIPTION
                : latestItem.ID !== undefined
                  ? latestItem.ID
                  : '';
            this.selectedVersion = String(val);
          } else {
            this.versionValueExpr = undefined;
            this.selectedVersion = String(latestItem ?? '');
          }
        }
        if (this.dataSource) {
          this.dataSource.reload();
        }
      },
      error: (error: any) => {
        this.notificationService.showNotification(
          'Failed to load ADOC Version dropdown',
          'error',
        );
        if (this.dataSource) {
          this.dataSource.reload();
        }
      },
    });
  }

  onVersionChanged(event: any) {
    if (event.event) {
      this.selectedVersion =
        event.value && typeof event.value === 'object'
          ? String(
              event.value.DESCRIPTION ||
                event.value.Description ||
                event.value.Name ||
                event.value.ID ||
                '',
            )
          : event.value != null
            ? String(event.value)
            : '';
      if (this.dataSource) {
        this.dataSource.reload();
      }
    }
  }

  toggleEditMode = () => {
    this.isEditingEnabled = !this.isEditingEnabled;
    this.editButtonOptions = {
      ...this.editButtonOptions,
      icon: this.isEditingEnabled ? 'close' : 'edit',
    };

    if (!this.isEditingEnabled) {
      // this.refresh();
    }
  };

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  showNewPopup() {
    this.isAddPopupVisible = true;
  }

  onPopupHiding() {
    this.newIcdAdocMapping = {
      SpecialtyID: null,
      ICDCode: '',
      ADOCClassID: null,
      EffectFrom: null,
    };

    this.addForm?.instance.reset();
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // =========== Save data  =========
  saveIcdAdocMapping() {
    const result = validationEngine.validateGroup('icdAdocMappingValidation');

    if (!result.isValid) {
      this.notificationService.showNotification(
        'Please fill all required fields',
        'warning',
      );
      return;
    }

    const payload = {
      SpecialtyID: this.newIcdAdocMapping.SpecialtyID,
      ICDCode: this.newIcdAdocMapping.ICDCode,
      ADOCClassID: this.newIcdAdocMapping.ADOCClassID,
      EffectFrom: this.formatDate(this.newIcdAdocMapping.EffectFrom),
      UserID: sessionStorage.getItem('UserID'),
      ADOCVersion: this.selectedVersion || undefined,
    };

    this.masterService.insert_icdAdocMapping_Data(payload).subscribe({
      next: (res: any) => {
        if (
          res &&
          (res.flag === '1' || res.status === 'success' || res === '1')
        ) {
          this.notificationService.showNotification(
            'ICD ADOC Mapping Added Successfully',
            'success',
          );

          this.isAddPopupVisible = false;

          this.newIcdAdocMapping = {
            SpecialtyID: null,
            ICDCode: '',
            ADOCClassID: null,
            EffectFrom: null,
          };

          this.dataGrid.instance.refresh();
        } else {
          this.notificationService.showNotification(
            res?.message || 'Save Failed',
            'error',
          );
        }
      },
      error: (err: any) => {
        this.notificationService.showNotification(
          err?.message || 'Save Failed',
          'error',
        );
      },
    });
  }

  // =========== row data updating =========
  onRowUpdating(event: any) {
    const combinedData = {
      ...event.oldData,
      ...event.newData,
    };

    if (
      !combinedData.SpecialtyID ||
      !combinedData.ICDCode?.trim() ||
      !combinedData.ADOCClassID ||
      !combinedData.EffectFrom
    ) {
      this.notificationService.showNotification(
        'Please fill all required fields',
        'warning',
      );

      event.cancel = true;
      return;
    }

    const payload = {
      ID: combinedData.ID,
      SpecialtyID: combinedData.SpecialtyID,
      ICDCode: combinedData.ICDCode,
      ADOCClassID: combinedData.ADOCClassID,
      EffectFrom: this.formatDate(combinedData.EffectFrom),
      UserID: sessionStorage.getItem('UserID'),
      ADOCVersion: combinedData.ADOCVersion || this.selectedVersion || undefined,
    };

    this.masterService.update_icdAdocMapping_data(payload).subscribe({
      next: (res: any) => {
        if (
          res &&
          (res.flag === '1' || res.status === 'success' || res === '1')
        ) {
          this.notificationService.showNotification(
            'Data Updated Successfully',
            'success',
          );
        } else {
          this.notificationService.showNotification(
            res?.message || 'Your Data Not Saved',
            'error',
          );
        }

        event.component.cancelEditData();
        this.dataGrid.instance.refresh();
      },
      error: (err: any) => {
        this.notificationService.showNotification(
          err?.message || 'Update Failed',
          'error',
        );
        event.component.cancelEditData();
      },
    });

    event.cancel = true;
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_icdAdocMapping_Row_Data(SelectedRow.ID)
      .subscribe({
        next: (res: any) => {
          if (
            res &&
            (res.flag === '1' ||
              res.status === 'success' ||
              res === '1' ||
              res.data === 'Deleted Successfully')
          ) {
            this.notificationService.showNotification(
              'Delete operation successful',
              'success',
            );
          } else {
            this.notificationService.showNotification(
              res?.message || 'Delete operation failed',
              'error',
            );
          }
          event.component.refresh();
          this.dataGrid.instance.refresh();
        },
        error: (err: any) => {
          this.notificationService.showNotification(
            err?.message || 'Delete operation failed',
            'error',
          );
          event.component.refresh();
        },
      });
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileGroupName = 'ICD-ADOC-Mapping';
    this.service.exportDataGrid(event, fileGroupName);
  }

  onGridOptionChanged(e: any) {
    if (e.fullName && e.fullName.toLowerCase().includes('filter')) {
      setTimeout(() => {
        if (this.dataGrid && this.dataGrid.instance) {
          this.isFilterApplied = !!this.dataGrid.instance.getCombinedFilter();
        }
      });
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxPopupModule,
    DxCheckBoxModule,
    DxFormModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxDateBoxModule,
  ],
  declarations: [IcdAdocMappingComponent],
  exports: [IcdAdocMappingComponent],
})
export class IcdAdocMappingModule {}
