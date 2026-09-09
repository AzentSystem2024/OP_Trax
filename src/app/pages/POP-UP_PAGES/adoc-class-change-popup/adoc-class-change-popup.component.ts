import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import {
  DxFormModule,
  DxPopupModule,
  DxButtonModule,
  DxTextBoxModule,
  DxSelectBoxModule,
  DxCheckBoxModule,
  DxNumberBoxModule,
  DxFormComponent,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { OperationReportService } from 'src/app/pages/OPERATION PAGES/operation-report.service';
import notify from 'devextreme/ui/notify';
import validationEngine from 'devextreme/ui/validation_engine';

@Component({
  selector: 'app-adoc-class-change-popup',
  templateUrl: './adoc-class-change-popup.component.html',
  styleUrls: ['./adoc-class-change-popup.component.scss'],
})
export class AdocClassChangePopupComponent implements OnChanges, OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() formData: any = null;
  @Input() adocCategoryList: any[] = [];
  @Input() claimActivityUID: number = 0;
  adocClassList: any[] = [];

  @Output() onSaved = new EventEmitter<any>();

  @ViewChild('editForm', { static: false }) editForm!: DxFormComponent;

  editData: any = {};

  constructor(
    private masterService: MasterReportService, 
    private dataService: DataService,
    private operationService: OperationReportService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dataService.Get_GropDown('ADOC_CLASS').subscribe((res: any) => {
      if (res) {
        this.adocClassList = res;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] && changes['formData'].currentValue) {
      this.editData = { ...this.formData };
    }
  }

  onPopupHiding() {
    this.visibleChange.emit(false);
  }

  onAdocClassChanged = (e: any) => {
    const adocClassID = e.value;
    console.log("adocClassID",adocClassID);
    if (adocClassID) {
      this.masterService.Select_adocClass_Row_Data(adocClassID).subscribe({
        next: (res: any) => {
          if (res && res.flag === '1' && res.data && res.data.length > 0) {
            this.editData = { ...res.data[0] };
          } else if (res && res.data && !Array.isArray(res.data)) {
            this.editData = { ...res.data };
          } else {
            notify('ADOC Classification details not found.', 'error', 2000);
          }
        },
        error: () => {
          notify('Failed to load ADOC Classification details.', 'error', 2000);
        }
      });
    }
  }

  onSave() {
    const result = validationEngine.validateGroup('adocClassChangeValidation');
    if (!result.isValid) {
      notify(
        {
          message: 'Please fill all required fields',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'warning',
      );
      return;
    }

    if (!this.editData.ClassName?.trim() || !this.editData.GroupID) {
      notify(
        {
          message: 'Please fill all required fields',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'warning',
      );
      return;
    }

    const logData = this.authService?.getUserData() || JSON.parse(localStorage.getItem('logData') || '{}');
    const userId = logData?.UserID || logData?.UserId || sessionStorage.getItem('UserID') || 0;
    const sessionId = logData?.SessionID || logData?.SessionId || 0;

    const payload = {
      UserID: Number(userId),
      SessionID: Number(sessionId),
      ClaimActivityUID: this.claimActivityUID,
      NewADOCClassID: this.editData.ID,
      OldADOCClassID: this.formData?.ID
    };

    this.operationService
      .updateADOCClass(payload)
      .subscribe((res: any) => {
        if (res && res.flag === '1') {
          notify(
            {
              message: res.message || `Data updated successfully`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success',
          );
          this.onSaved.emit();
          this.visible = false;
          this.visibleChange.emit(false);
        } else {
          notify(
            {
              message: res?.message || `Your Data Not Saved`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error',
          );
        }
      });
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxFormModule,
    DxPopupModule,
    DxButtonModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    DxCheckBoxModule,
    DxNumberBoxModule,
  ],
  declarations: [AdocClassChangePopupComponent],
  exports: [AdocClassChangePopupComponent],
})
export class AdocClassChangePopupModule {}
