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
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../master-report.service';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
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
  readonly allowedPageSizes: any = [5, 10, 'all'];
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
          next: (response: any) => resolve(response.data), // Resolve with the data
          error: (error) => reject(error.message), // Reject with the error message
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
    private route: ActivatedRoute,
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
    this.masterService.selectCptMaster(ID).subscribe((response: any) => {
      console.log(response, 'select!!!');
      this.selectedCptMaster = response.data[0];
      this.isEditFormPopupOpened = true;
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
      CPTPrice,
      PriceEffectFrom,
      CPTWeightage,
      WeightageEffectFrom,
      CPTADOCMappings,
    } = this.CptNewFormComponent.getNewCptMasterData();

    this.masterService
      .Insert_CptMaster_Data(
        CPTTypeID,
        CPTCode,
        CPTName,
        CPTPrice,
        PriceEffectFrom,
        CPTWeightage,
        WeightageEffectFrom,
        CPTADOCMappings,
      )
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: 'New Cpt Master Saved Successfully',
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );

          this.CptNewFormComponent.clearForm();
        } else {
          notify(
            {
              message: 'Your Data Not Saved',
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
        }
      });
  };

  //======= Update data ==========
  onClickUpdateNewCptType = () => {
    const { ID, CPTTypeID, CPTCode, CPTName, CPTADOCMappings } =
      this.CptEditFormComponent.getUpdateCptMasterData();

    this.masterService
      .update_CptMaster_data(ID, CPTTypeID, CPTCode, CPTName, CPTADOCMappings)
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();

          notify(
            {
              message: 'Cpt Master Updated Successfully',
              position: { at: 'top right', my: 'top right' },
            },
            'success',
          );

          this.resetCptForm();
        } else {
          notify(
            {
              message: 'Your Data Not Updated',
              position: { at: 'top right', my: 'top right' },
            },
            'error',
          );
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
          notify(
            {
              message: 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
        } catch (error) {
          notify(
            {
              message: 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
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
