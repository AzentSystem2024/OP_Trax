import { Message } from 'src/app/types/messages';
import { CommonModule } from '@angular/common';
import {
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import {
  DxFormModule,
  DxTextBoxModule,
  DxTextAreaModule,
  DxButtonModule,
  DxFormComponent,
  DxCheckBoxModule,
  DxValidatorModule,
  DxValidatorComponent,
  DxPopupModule,
  DxDataGridModule,
  DxDataGridComponent,
  DxValidationGroupModule,
} from 'devextreme-angular';
import {
  DxHtmlEditorComponent,
  DxHtmlEditorModule,
  DxHtmlEditorTypes,
} from 'devextreme-angular/ui/html-editor';

import { DxTabPanelModule } from 'devextreme-angular';
import { SystemServicesService } from '../system-services.service';
import { DxTextBoxTypes } from 'devextreme-angular/ui/text-box';
import notify from 'devextreme/ui/notify';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';
type EditorOptions = DxTextBoxTypes.Properties;
@Component({
  selector: 'app-notificarion-settings',
  templateUrl: './notificarion-settings.component.html',
  styleUrls: ['./notificarion-settings.component.scss'],
  providers: [DataService],
})
export class NotificationSettingsComponent implements OnInit {
  @ViewChild(DxFormComponent, { static: false }) form: DxFormComponent;

  @ViewChild(DxValidatorComponent, { static: false })
  validator: DxValidatorComponent;

  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('editor') editor: DxHtmlEditorComponent;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  dataSource: any;

  valueContent: string;

  editorValueType: string = 'html';

  clickedTabName: string = 'E-mail'; // Set your initial tab

  showTabNavButtons = false;
  scrollByContent = false;
  rtlEnabled = false;
  orientation: any = 'horizontal';
  stylingMode: any = 'secondary';
  iconPosition: any = 'start';
  width = 'auto';
  animationEnabled: any = true;
  emailFormData: any;
  smsFormData: any;
  whatsappFormData: any;

  isPasswordVisible: boolean = false;
  isEmailVisible: boolean;
  isSMSVisible: boolean;
  iswhatsAppVisible: boolean;

  testMailpopupVisible: boolean = false;
  TestMailReceiverID: any = '';
  TestMailSubject: any = '';
  TestMailMessageBody: any = '';

  clickedEditRowData: any;
  isRowDataEditing: boolean = false;
  editpopupHeading: any;
  templateKeyWords: any;

  HtmleditorOptions: any;

  tabsWithIconAndText: any = [
    {
      id: 0,
      text: 'E-mail',
      icon: 'bi bi-envelope',
    },
    {
      id: 1,
      text: 'SMS',
      icon: 'bi bi-chat-square-text-fill',
    },
    {
      id: 2,
      text: 'WhatsApp',
      icon: 'bi bi-whatsapp',
    },
  ];

  formData = {
    EmailSenderID: '',
    EmailSenderName: '',
    EmailSenderPassword: '',
    EmailSMTPHost: '',
    EmailSMTPPort: '',
    EmailEnableSSL: false,
    EmailIsInactive: false,
    IsEmailVerified: false,
    SMSIsInactive:false,
    SMSProviderURL: '',
    SMSUserID: '',
    SMSPassword: '',
    SMSMobileNo: '',
    WhatsappSource: '',
    WhatsappNumber: '',
    WhatsappIsInactive:false,
  };

  defaultRowData: any = {
    NotificationType: '',
    SendEmail: false,
    EmailSubject: '',
    EmailMessage: '',
    SendSMS: false,
    SMSTemplate: '',
    SendWhatsapp: false,
    WhatsappTemplate: '',
    Notification: '',
  };
  htmlEditorInstance: any;
  currentPathName: any;
  initialized: boolean;
  menuPrevilage: any;

  saveButtonText: string = 'Save';
  isSaving: boolean = false;

  sendButtonText: string = 'Send';
  isSending: boolean = false;

  constructor(
    private service: SystemServicesService,
    private router: Router,
    private dataservice: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      this.menuPrevilage = this.dataservice.getMenuPrevilages(fullUrl);
    });
    this.getNotificationSettingsData();
    this.getNotificationSettingsTemplateList();
    this.updateVisibility();
  }

  addToEmailMessage(selectedValue: string) {
    if (selectedValue) {
      let currentMessage = this.clickedEditRowData.EmailMessage || '';
      const lastPIndex = currentMessage.lastIndexOf('</p>');
      if (lastPIndex !== -1) {
        currentMessage =
          currentMessage.substring(0, lastPIndex) +
          ` ${selectedValue}` +
          currentMessage.substring(lastPIndex);
      } else {
        currentMessage = `${currentMessage} ${selectedValue}`;
      }
      this.clickedEditRowData.EmailMessage = currentMessage;
      console.log(
        'Updated EmailMessage:',
        this.clickedEditRowData.EmailMessage
      );
    }
  }

  //=================Notification Settings Data===============
  getNotificationSettingsData() {
    this.service.getSecurityNotificationData().subscribe((response: any) => {
      if (response?.data?.[0]) {
        // Replace the entire formData object to force DevExtreme form to refresh
        this.formData = { ...response.data[0] };
      }
    });
  }

  //=========Notification Settings Template Data======
  getNotificationSettingsTemplateList() {
    this.service.getNotificationTemplateList().subscribe((response: any) => {
      response.data.forEach((item: any, index: number) => {
        item.serialNumber = index + 1;
      });
      this.dataSource = response.data;
      this.templateKeyWords = response.keywords[0].EmailValue.replace(
        /[]/g,
        ''
      ).split(',');
      this.HtmleditorOptions = {
        height: 200,
        toolbar: {
          items: [
            'undo',
            'redo',
            'separator',
            'bold',
            'italic',
            'underline',
            'separator',
            'color',
            'background',
            'separator',
            'clear',
            'separator',
            {
              name: 'Template Values',
              widget: 'dxSelectBox',
              options: {
                items: this.templateKeyWords,
                placeholder: 'Key Words',
                onValueChanged: (e) => this.addToEmailMessage(e.value),
              },
              location: 'before',
            },
          ],
        },
      };
    });
  }

  //=====================Tab Click event==============
  onTabClick(e: any) {
    this.clickedTabName = e.itemData.text;
    this.updateVisibility();
    console.log('clicked tab is :', this.clickedTabName);
  }
  updateVisibility() {
    this.isEmailVisible = this.clickedTabName === 'E-mail';
    this.isSMSVisible = this.clickedTabName === 'SMS';
    this.iswhatsAppVisible = this.clickedTabName === 'WhatsApp';
  }

  //===========================================Test mail starting===============================
  //===============Test Mail Button Click==========
  onClickTestMail() {
    this.testMailpopupVisible = true;
  }
  //==============test mail sending===============
  onTestMailSending() {
    //  const validationResult = this.validator.instance.validate();
    // if (!validationResult.isValid){
    //   return;
    // }

    const userID: any = JSON.parse(localStorage.getItem('logData')).UserID;
    const receiverid = this.TestMailReceiverID;
    const subject = this.TestMailSubject;
    const Message = this.TestMailMessageBody;

    this.isSending = true;
    this.sendButtonText = 'Sending...';

    this.service.sendTestMail(userID, receiverid, subject, Message).subscribe(
      (response: any) => {
        this.isSending = false;
        this.sendButtonText = 'Send';
        if (response.message?.includes('Email sent successfully')) {
          notify(
            {
              message: 'The test e-mail has been sent successfully',
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
          this.testMailpopupVisible = false;
          this.getNotificationSettingsData();
        } else {
          this.isSending = false;
          this.sendButtonText = 'Send';
          notify(
            {
              message: response.message || 'Failed to send email',
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
          this.getNotificationSettingsData();
        }
      },
      (err) => {
        this.isSending = false;
        this.sendButtonText = 'Send';
        notify(
          {
            message: err?.error?.message || 'Internal server error',
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    );
  }

  //===========Clear data on popup close===========
  cleardata() {
    this.TestMailReceiverID = '';
    this.TestMailSubject = '';
    this.TestMailMessageBody = '';
  }

  //===========================================Test mail ending===============================

  //==============================================================================
  //=============onClick notification editing==========
  onEditingStart(event: any) {
    this.clickedEditRowData = { ...this.defaultRowData };
    this.clickedEditRowData = event.data;
    this.editpopupHeading = `${this.clickedEditRowData.Notification} event`;
    event.cancel = true;
    this.isRowDataEditing = true;
  }

  //============update Notification template ============
  onClickSaveNotificationTemplate() {
    console.log(this.clickedEditRowData, 'clickedData');
    this.service
      .updateNotificationSettingTemplate(this.clickedEditRowData)
      .subscribe((response: any) => {
        if (response.flag == 1) {
          this.isRowDataEditing = false;
          notify(
            {
              message: response.message,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
          this.getNotificationSettingsTemplateList();
        } else {
          this.isRowDataEditing = false;
          notify(
            {
              message: response.message,
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
        }
      });
  }

  clearFormData() {
    this.getNotificationSettingsTemplateList();
    this.isRowDataEditing = false;
  }

  onRowUpdating(event: any) {}
  //================On Click Save Notification Settings============
  onClickSave() {
    const validationResult = this.validator.instance.validate();
    if (!validationResult.isValid) {
      console.log('Form is invalid');
      return;
    }

    this.isSaving = true;
    this.saveButtonText = 'Saving...';

    this.service.saveNotificationSettings(this.formData).subscribe(
      (response: any) => {
        this.isSaving = false;
        this.saveButtonText = 'Save';

        if (response) {
          notify(
            {
              message: 'Your notification settings updated successfully',
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );

          this.getNotificationSettingsData();
        }
      },
      (error) => {
        this.isSaving = false;
        this.saveButtonText = 'Save';

        notify(
          {
            message: error?.error?.message || 'Internal server error',
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    );
  }

  //============== Page refreshing==================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
}
@NgModule({
  imports: [
    CommonModule,
    DxTabsModule,
    DxTabPanelModule,
    DxFormModule,
    DxTextBoxModule,
    DxTextAreaModule,
    DxButtonModule,
    DxCheckBoxModule,
    DxPopupModule,
    DxValidatorModule,
    DxHtmlEditorModule,
    DxDataGridModule,
    DxValidationGroupModule,
  ],
  providers: [],
  exports: [],
  declarations: [NotificationSettingsComponent],
})
export class NotificationSettingsModule {}
