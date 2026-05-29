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
  selector: 'app-price-master',
  templateUrl: './price-master.component.html',
  styleUrl: './price-master.component.scss',
})
export class PriceMasterComponent {}
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
  declarations: [PriceMasterComponent],
})
export class PriceMasterListModule {}
