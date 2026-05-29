import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { DxDataGridModule, DxButtonModule, DxDropDownButtonModule, DxSelectBoxModule, DxTextBoxModule, DxLookupModule, DxPopupModule } from 'devextreme-angular';

@Component({
  selector: 'app-adoc-class',
  templateUrl: './adoc-class.component.html',
  styleUrl: './adoc-class.component.scss'
})
export class ADOCClassComponent {

  
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
    DxPopupModule,

  ],
  providers: [],
  exports: [],
  declarations: [ADOCClassComponent],
})
export class ADOCClassListModule {}