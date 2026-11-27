import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemRoutingModule } from './system-routing.module';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxLoadPanelModule,
  DxLookupModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTextBoxModule,
  DxTemplateModule,
} from 'devextreme-angular';
import { LicenseInfoComponent } from './pages/license-info/license-info.component';
import { PostOfficeCredentialsComponent } from './pages/post-office-credentials/post-office-credentials.component';
import { SecurityPolicyComponent } from './pages/security-policy/security-policy.component';


@NgModule({
  declarations: [
    LicenseInfoComponent,
    PostOfficeCredentialsComponent,
    SecurityPolicyComponent,
  ],
  imports: [
    CommonModule,
    SystemRoutingModule,
    DxDataGridModule,
    DxButtonModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxLoadPanelModule,
    DxPopupModule,
    DxFormModule,
    DxCheckBoxModule,
    DxSwitchModule,
    DxNumberBoxModule,
    DxRadioGroupModule,
    DxTemplateModule,
  ],
  exports: [
    LicenseInfoComponent,
    PostOfficeCredentialsComponent,
    SecurityPolicyComponent,
  ],
})
export class SystemModule { }
