import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxAccordionModule,
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxListModule,
  DxLoadPanelModule,
  DxLookupModule,
  DxPopupModule,
  DxResizableModule,
  DxSelectBoxModule,
  DxSliderModule,
  DxSortableModule,
  DxTabPanelModule,
  DxTagBoxModule,
  DxTemplateModule,
  DxTextBoxModule,
  DxToolbarModule,
  DxTreeViewModule,
  DxValidationSummaryModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { DxoSummaryModule } from 'devextreme-angular/ui/nested';
import { FormPopupModule } from 'src/app/components';
import { AdocDetailPopupModule } from '../../pages/POP-UP_PAGES/adoc-detail-popup/adoc-detail-popup.component';
import { CptMasterEditFormModule } from '../../pages/POP-UP_PAGES/cpt-master-edit-form/cpt-master-edit-form.component';
import { GroupingDetailsReportComponent } from './pages/grouping-details-report/grouping-details-report.component';


@NgModule({
  declarations: [GroupingDetailsReportComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReportsRoutingModule,
    DxAccordionModule,
    DxButtonModule,
    DxCheckBoxModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
    DxDropDownButtonModule,
    DxFormModule,
    DxListModule,
    DxLoadPanelModule,
    DxLookupModule,
    DxPopupModule,
    DxResizableModule,
    DxSelectBoxModule,
    DxSliderModule,
    DxSortableModule,
    DxTabPanelModule,
    DxTagBoxModule,
    DxTemplateModule,
    DxTextBoxModule,
    DxToolbarModule,
    DxTreeViewModule,
    DxValidationSummaryModule,
    DxValidatorModule,
    DxoSummaryModule,
    FormPopupModule,
    AdocDetailPopupModule,
    CptMasterEditFormModule,
  ]
})
export class ReportsModule { }
