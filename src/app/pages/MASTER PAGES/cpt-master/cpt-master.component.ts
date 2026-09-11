import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { CptMasterNewFormComponent } from '../../POP-UP_PAGES/cpt-master-new-form/cpt-master-new-form.component';
import { CptMasterNewFormModule } from '../../POP-UP_PAGES/cpt-master-new-form/cpt-master-new-form.component';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { DataService } from 'src/app/services';
import {
  CptMasterEditFormComponent,
  CptMasterEditFormModule,
} from '../../POP-UP_PAGES/cpt-master-edit-form/cpt-master-edit-form.component';

@Component({
  selector: 'app-cpt-master',
  templateUrl: './cpt-master.component.html',
  styleUrls: ['./cpt-master.component.scss'],
  providers: [ReportService, DataService],
})
export class CPTMasterComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(CptMasterNewFormComponent)
  CptNewFormComponent!: CptMasterNewFormComponent;

  @ViewChild(CptMasterEditFormComponent, { static: false })
  CptEditFormComponent!: CptMasterEditFormComponent;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [50, 100, 200];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  
  facilityGroupDatasource: any;
  isAddFormPopupOpened: boolean = false;
  isEditFormPopupOpened: boolean = false;
  selectedCptMaster: any;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_CptMaster_List().subscribe({
          next: (response: any) => resolve(response.data), 
          error: (error) => reject(error.message), 
        });
      }),
  });

  addButtonOptions: any;

  isFilterRowVisible: boolean = false;
  currentPathName: string = '';
  initialized: boolean = false;
  menuPrevilage: any;

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute, private notificationService: NotificationService
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.show_new_Form(), // use your actual method here
      elementAttr: { class: 'add-button' },
    };
  }

  //=========================show new popup=========================
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  openEditingStart(event: any) {
    event.cancel = true;
    const ID = event.data.ID;
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.beginCustomLoading('Loading...');
    }
    this.masterService.selectCptMaster(ID).subscribe({
      next: (response: any) => {
        this.selectedCptMaster = response.data[0];
        this.isEditFormPopupOpened = true;
        if (this.dataGrid && this.dataGrid.instance) {
          this.dataGrid.instance.endCustomLoading();
        }
      },
      error: (error: any) => {
        if (this.dataGrid && this.dataGrid.instance) {
          this.dataGrid.instance.endCustomLoading();
        }
      }
    });
  }

  //======= Add data ==========
  onClickSaveNewCptType = async () => {
    if (!this.CptNewFormComponent) {
      console.error('Child component not available');
      return;
    }

    const {
      CPTTypeID,
      CPTCode,
      CPTName,
      CPTADOCMappings,
      ADOCApplicationID,
    } = this.CptNewFormComponent.getNewCptMasterData();

    this.masterService
      .Insert_CptMaster_Data(
        CPTTypeID,
        CPTCode,
        CPTName,
        CPTADOCMappings,
        ADOCApplicationID,
      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification('New Cpt Master Saved Successfully', 'success');

          this.CptNewFormComponent.clearForm();
        } else {
          this.notificationService.showNotification('Your Data Not Saved', 'error');
        }
      });
  };

  //======= Update data ==========
  onClickUpdateNewCptType = () => {
    const {
      ID,
      CPTTypeID,
      CPTCode,
      CPTName,
      CPTADOCMappings,
      ADOCApplicationID,
    } = this.CptEditFormComponent.getUpdateCptMasterData();

    console.log(
      ID,
      CPTTypeID,
      CPTCode,
      CPTName,
      CPTADOCMappings,
      ADOCApplicationID,
    );

    this.masterService
      .update_CptMaster_data(
        ID,
        CPTTypeID,
        CPTCode,
        CPTName,
        CPTADOCMappings,
        ADOCApplicationID,
      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          this.notificationService.showNotification('Cpt Master Updated Successfully', 'success');

          this.resetCptForm();
        } else {
          this.notificationService.showNotification('Your Data Not Updated', 'error');
        }
      });
  };

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_CptMaster_Row_Data(SelectedRow.ID)
      .subscribe(() => {
        try {
          this.notificationService.showNotification('Delete operation successful', 'success');
        } catch (error) {
          this.notificationService.showNotification('Delete operation failed', 'error');
        }
        event.component.refresh();
        this.dataGrid.instance.refresh();
      });
  }

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Cpt_master';
    this.service.exportDataGrid(event, fileName);
  }

  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  resetCptForm() {
    this.CptNewFormComponent.clearForm();
  }

  clearEditForm() {
    this.CptEditFormComponent.clearForm();
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    FormPopupModule,
    CptMasterNewFormModule,
    CptMasterEditFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [CPTMasterComponent],
})
export class CPTMasterModule {}
