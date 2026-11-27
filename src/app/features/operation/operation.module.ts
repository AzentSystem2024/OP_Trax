import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationRoutingModule } from './operation-routing.module';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxLoadIndicatorModule,
  DxLoadPanelModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { DxoSummaryModule } from 'devextreme-angular/ui/nested';
import { FormPopupModule } from 'src/app/components';
import { AdocDetailPopupModule } from '../../pages/POP-UP_PAGES/adoc-detail-popup/adoc-detail-popup.component';
import { ClinicalDataImportFormModule } from '../../pages/POP-UP_PAGES/clinical-data-import-form/clinical-data-import-form.component';
import { CptMasterEditFormModule } from '../../pages/POP-UP_PAGES/cpt-master-edit-form/cpt-master-edit-form.component';
import { ClinicalDataComponent } from './pages/Billing-info/clinical-data.component';

@NgModule({
  declarations: [ClinicalDataComponent],
  imports: [
    CommonModule,
    OperationRoutingModule,
    DxButtonModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
    DxDropDownButtonModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxLoadPanelModule,
    DxLookupModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxoSummaryModule,
    FormPopupModule,
    AdocDetailPopupModule,
    ClinicalDataImportFormModule,
    CptMasterEditFormModule,
  ]
})
export class OperationModule { }
