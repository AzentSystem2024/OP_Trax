import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
} from 'devextreme-angular';

@Component({
  selector: 'app-cpt-weightage',
  templateUrl: './cpt-weightage.component.html',
  styleUrl: './cpt-weightage.component.scss',
})
export class CPTWeightageComponent {}
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
    DxPopupModule,
  ],
  providers: [],
  exports: [],
  declarations: [CPTWeightageComponent],
})
export class CPTWeightageListModule {}
