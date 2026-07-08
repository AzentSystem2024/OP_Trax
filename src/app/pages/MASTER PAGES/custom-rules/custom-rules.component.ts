import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule, DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../master-report.service';
import { DataService } from 'src/app/services';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-custom-rules',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule],
  providers: [MasterReportService, DataService],
  templateUrl: './custom-rules.component.html',
  styleUrl: './custom-rules.component.scss'
})
export class CustomRulesComponent {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

  allowedPageSizes: any = [10, 20, 50];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  isFilterRowVisible = false;
  menuPrevilage: any;
  addButtonOptions: any;
  isDataAvailable: boolean = false;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_CustomRules_List().subscribe({
          next: (response: any) => {
            const dataWithSerialNo = (response.data || []).map((item: any, index: number) => ({
              ...item,
              SlNo: index + 1
            }));
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
    private route: ActivatedRoute
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl) || { CanEdit: true, CanDelete: true, CanAdd: true };
    });

    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => {
        if (this.dataGrid && this.dataGrid.instance) {
          this.dataGrid.instance.addRow();
        }
      },
      elementAttr: { class: 'add-button' },
    };
  }

  //====================Row Data Inserting========================
  onRowInserting(event: any) {
    event.cancel = true;
    const newData = event.data;

    this.masterService
      .Insert_CustomRules_Data(newData)
      .subscribe((response: any) => {
        if (response) {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `New data saved Successfully`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
        } else {
          notify(
            {
              message: `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
        }
        event.component.cancelEditData();
      });
  }

  //===================Row Data Update==========================
  onRowUpdating(event: any) {
    event.cancel = true;
    const updataDate = event.newData;
    const oldData = event.oldData;
    const combinedData = { ...oldData, ...updataDate };

    this.masterService
      .update_CustomRules_data(combinedData)
      .subscribe((data: any) => {
        if (data) {
          this.dataGrid.instance.refresh();
          notify(
            {
              message: `Data updated Successfully`,
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
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    
    // Check if ID exists, or use SelectedRow itself if ID is not the key
    const id = SelectedRow.ID ? SelectedRow.ID : SelectedRow;

    this.masterService
      .Remove_CustomRules_Row_Data(id)
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

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  refresh = () => {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.refresh();
    }
  };
}
