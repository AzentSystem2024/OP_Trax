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
  selector: 'app-adoc-group',
  templateUrl: './adoc-group.component.html',
  styleUrl: './adoc-group.component.scss',
})
export class ADOCGroupComponent {




  
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
  declarations: [ADOCGroupComponent],
})
export class ADOCGroupModule {}
