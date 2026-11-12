import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxDataGridModule,
  DxButtonModule,
  DxSelectBoxModule,
  DxLoadPanelModule,
  DxCheckBoxModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { MasterReportService } from '../master-report.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-specialty-adoc-mapping',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxSelectBoxModule,
    DxLoadPanelModule,
    DxCheckBoxModule,
  ],
  templateUrl: './specialty-adoc-mapping.component.html',
  styleUrl: './specialty-adoc-mapping.component.scss',
})
export class SpecialtyAdocMappingComponent implements OnInit {
  @ViewChild('specialtyAdocGrid', { static: false })
  dataGrid!: DxDataGridComponent;

  specialtyAdocData: any[] = [];
  versionList: any[] = [];
  selectedVersion: string = '';
  versionValueExpr: any = undefined;

  isFilterRowVisible: boolean = false;
  isFilterApplied: boolean = false;

  readonly allowedPageSizes: any = [10, 25, 50, 100, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector: boolean = true;
  showInfo: boolean = true;
  showNavButtons: boolean = true;

  constructor(
    private masterService: MasterReportService,
    private notificationService: NotificationService,
  ) {}

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

  ngOnInit() {
    this.get_ADOC_VERSION_Dropdown();
  }

  get_ADOC_VERSION_Dropdown(): void {
    this.showLoading('Loading ADOC Versions...');
    this.masterService.Get_GropDown('ADOC_VERSION').subscribe({
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
        this.hideLoading();
        this.fetch_Speciality_ADOC_Mapping();
      },
      error: (error: any) => {
        this.hideLoading();
        this.notificationService.showNotification(
          'Failed to load ADOC Version dropdown',
          'error',
        );
        this.fetch_Speciality_ADOC_Mapping();
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
      this.fetch_Speciality_ADOC_Mapping();
    }
  }

  fetch_Speciality_ADOC_Mapping() {
    this.showLoading('Loading Specialty-ADOC Mapping...');
    const versionParam = this.selectedVersion
      ? String(this.selectedVersion)
      : undefined;

    this.masterService
      .get_Speciality_ADOC_Mapping_List(versionParam)
      .subscribe({
        next: (response: any) => {
          if (
            response &&
            (response.flag === 1 || response.flag === '1' || response.data)
          ) {
            const list = Array.isArray(response.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [];
            list.forEach((item: any, index: number) => {
              item.SerialNumber = index + 1;
            });
            this.specialtyAdocData = list;
          } else {
            this.specialtyAdocData = [];
            if (response?.message) {
              this.notificationService.showNotification(
                response.message,
                'warning',
              );
            }
          }
          this.hideLoading();
        },
        error: (error: any) => {
          this.specialtyAdocData = [];
          this.hideLoading();
          this.notificationService.showNotification(
            'An error occurred while fetching Specialty-ADOC Mapping',
            'error',
          );
        },
      });
  }

  refresh = () => {
    this.fetch_Speciality_ADOC_Mapping();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  showLoading(message: string) {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.option('loadPanel.text', message);
      this.dataGrid.instance.beginCustomLoading(message);
    }
  }

  hideLoading() {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.endCustomLoading();
    }
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
