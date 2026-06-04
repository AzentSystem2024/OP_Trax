import {
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { ClinicianProfessionNewFormModule } from '../../POP-UP_PAGES/clinician-profession-new-form/clinician-profession-new-form.component';
import { CommonModule } from '@angular/common';
import { FormPopupModule } from 'src/app/components';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { ClinicianProfessionNewFormComponent } from '../../POP-UP_PAGES/clinician-profession-new-form/clinician-profession-new-form.component';
import notify from 'devextreme/ui/notify';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-clinician-profession',
  templateUrl: './clinician-profession.component.html',
  styleUrls: ['./clinician-profession.component.scss'],
  providers: [ReportService, DataService],
})
export class ClinicianProfessionComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;
  @ViewChild(ClinicianProfessionNewFormComponent, { static: false })
  ClinicianProfession: ClinicianProfessionNewFormComponent;

  isAddFormPopupOpened: any = false;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.Get_ClinicianProfession_Data().subscribe({
          next: (response: any) => resolve(response.data), // Resolve with the data
          error: (error) => reject(error.message), // Reject with the error message
        });
      }),
  });

  addButtonOptions: any;

  isFilterRowVisible: boolean = false;
  currentPathName: string;
  initialized: boolean;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute
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
      onClick: () => this.show_new_InsuranceClassification_Form(), // use your actual method here
      elementAttr: { class: 'add-button' },
    };
  }

  //=============Showing the new Facility Form===================
  show_new_InsuranceClassification_Form() {
    this.isAddFormPopupOpened = true;
  }
  //========================Get Datasource =======================

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'clinician_profession';
    this.service.exportDataGrid(event, fileName);
  }

  isDuplicateProfession(
  profession: string,
  currentId: number = 0
): boolean {

  const gridData = this.dataGrid.instance.getDataSource().items();

  return gridData.some((item: any) =>
    item.Profession?.trim().toLowerCase() ===
    profession.trim().toLowerCase() &&
    item.ID !== currentId
  );
}

  //====================Add data ================================
  onClickSaveNewData = () => {
    const { ProfessionValue, DescriptionValue } =
      this.ClinicianProfession.getNewclinicianProfession();

       // ===== Duplicate Check =====

  if (this.isDuplicateProfession(ProfessionValue)) {

    notify(
      {
        message: 'Profession already exists',
        position: { at: 'top right', my: 'top right' },
      },
      'error'
    );

    return false;
  }

    this.masterService
      .Insert_ClinicianProfession_Data(ProfessionValue, DescriptionValue)
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `New Insurance Classification saved Successfully`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
          this.ClinicianProfession.reset_newclinicianProfessionFormData();
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
        }
      });
  };

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .remove_ClinicianProfession(SelectedRow.ID)
      .subscribe(() => {
        try {
          notify(
            {
              message: 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
        } catch (error) {
          notify(
            {
              message: 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
        event.component.refresh();
        this.dataGrid.instance.refresh();
      });
  }
  //===================RTow Data Update==========================
  onRowUpdating(event: any) {
    const updataDate = event.newData;
    const oldData = event.oldData;
    const combinedData = { ...oldData, ...updataDate };
    let id = combinedData.ID;
    let Profession = combinedData.Profession;
    let Description = combinedData.Description;

    // ===== Duplicate Check =====

  if (
    this.isDuplicateProfession(
      combinedData.Profession,
      combinedData.ID
    )
  ) {

    notify(
      {
        message: 'Profession already exists',
        position: { at: 'top right', my: 'top right' },
      },
      'error'
    );

    event.cancel = true;
    return;
  }


    this.masterService
      .update_ClinicianProfession_data(id, Profession, Description)
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `Insurance classification updated Successfully`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }

        event.component.cancelEditData();
        this.dataGrid.instance.refresh();
      });

    event.cancel = true;
  }
  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };
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
    ClinicianProfessionNewFormModule,
    DxPopupModule
  ],
  providers: [],
  exports: [],
  declarations: [ClinicianProfessionComponent],
})
export class ClinicianProfessionModule {}
