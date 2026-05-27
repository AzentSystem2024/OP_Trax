import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  NgModule,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  DxButtonModule,
  DxDataGridModule,
  DxLoadPanelModule,
  DxProgressBarModule,
  DxTemplateModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import DataSource from 'devextreme/data/data_source';

@Component({
  selector: 'app-view-imported-master-data-form',
  templateUrl: './view-imported-master-data-form.component.html',
  styleUrls: ['./view-imported-master-data-form.component.scss'],
})
export class ViewImportedMasterDataFormComponent implements OnChanges {
  @Input() formdata: any;

  dataSource: any;
  selectedData: any;
  docNo: any;
  master: any;
  importedDate: any;
  user: any;
  isLoading: boolean = false;
  constructor(private service: MasterReportService) {}

  clearData() {
    this.dataSource = [];
    this.isLoading = false;
    this.docNo = '';
    this.master = '';
    this.importedDate = '';
    this.user = '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.formdata && changes.formdata.currentValue) {
      this.isLoading = true;

      this.dataSource = new DataSource({
        load: () => {
          return new Promise((resolve, reject) => {
            // API call to get data based on the formdata ID
            this.service.get_Imported_Data_By_Id(this.formdata.ID).subscribe(
              (res: any) => {
                if (res) {
                  // Store general information for display
                  this.docNo = res.DocNo;
                  this.master = res.Master;
                  this.user = res.UserName;

                  // Format imported date
                  const celldate = res.ImportTime;
                  if (celldate) {
                    const date = new Date(celldate);
                    this.importedDate = `${date.toLocaleDateString()}, ${date.toLocaleTimeString()}`;
                  } else {
                    this.importedDate = '';
                  }

                  // Determine data set based on MasterID and resolve it
                  let data;
                  switch (this.formdata.MasterID) {
                    case 1:
                      data = res.import_clinician.map(
                        ({ ID, LogID, ...rest }) => rest
                      );
                      break;
                    case 2:
                      data = res.import_Denial.map(
                        ({ ID, LogID, ...rest }) => rest
                      );
                      break;
                    case 3:
                      data = res.import_Insurance.map(
                        ({ ID, LogID, ...rest }) => rest
                      );
                      break;
                    case 4:
                      data = res.import_Cpt.map(
                        ({ ID, LogID, ...rest }) => rest
                      );
                      break;
                    case 5:
                      data = res.import_department.map(
                        ({ ID, LogID, ...rest }) => rest
                      );
                      break;
                    case 6:
                      data = res.import_accounts.map(
                        ({ ID, LogID, ...rest }) => rest
                      );
                      break;
                    default:
                      data = [];
                  }
                  resolve(data); // Resolve with the data to populate the grid
                } else {
                  reject('No data available');
                }
              },
              (error) => {
                console.error('Error loading data', error);
                reject(error); // Reject in case of an error
              }
            );
          });
        },
      });
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxTemplateModule,
    DxTextBoxModule,
    DxButtonModule,
    DxDataGridModule,
    DxValidatorModule,
    DxProgressBarModule,
    BrowserModule,
    DxTooltipModule,
    DxLoadPanelModule,
  ],
  providers: [],
  declarations: [ViewImportedMasterDataFormComponent],
  exports: [ViewImportedMasterDataFormComponent],
})
export class ViewImportedMasterDataFormModule {}
