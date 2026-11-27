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
  DxTextAreaModule,
  DxValidatorModule,
  DxValidationGroupModule,
  DxTabPanelModule,
} from 'devextreme-angular';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxHtmlEditorModule } from 'devextreme-angular/ui/html-editor';
import { LicenseInfoComponent } from './pages/license-info/license-info.component';
import { PostOfficeCredentialsComponent } from './pages/post-office-credentials/post-office-credentials.component';
import { SecurityPolicyComponent } from './pages/security-policy/security-policy.component';
import { NotificationSettingsComponent } from './pages/notificarion-settings/notificarion-settings.component';


@NgModule({
  declarations: [
    LicenseInfoComponent,
    PostOfficeCredentialsComponent,
    SecurityPolicyComponent,
    NotificationSettingsComponent,
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
    DxTextAreaModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxTabPanelModule,
    DxTabsModule,
    DxHtmlEditorModule,
  ],
  exports: [
    LicenseInfoComponent,
    PostOfficeCredentialsComponent,
    SecurityPolicyComponent,
    NotificationSettingsComponent,
  ],
})
export class SystemModule { }
