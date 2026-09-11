import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
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
import validationEngine from 'devextreme/ui/validation_engine';
import { NotificationService } from "src/app/services/notification.service";

@Component({
  selector: 'app-adoc-class-edit-form',
  templateUrl: './adoc-class-edit-form.component.html',
  styleUrls: ['./adoc-class-edit-form.component.scss'],
})
export class AdocClassEditFormComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  
  @Input() formData: any = null;
  @Input() adocCategoryList: any[] = [];
  
  @Output() onSaved = new EventEmitter<any>();

  @ViewChild('editForm', { static: false }) editForm!: DxFormComponent;

  editData: any = {};

  constructor(private masterService: MasterReportService, private notificationService: NotificationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] && changes['formData'].currentValue) {
      this.editData = { ...this.formData };
    }
  }

  onPopupHiding() {
    this.visibleChange.emit(false);
  }

  onSave() {
    const result = validationEngine.validateGroup('adocClassEditValidation');
    if (!result.isValid) {
      this.notificationService.showNotification('Please fill all required fields', 'warning');
      return;
    }

    if (!this.editData.ClassName?.trim() || !this.editData.GroupID) {
      this.notificationService.showNotification('Please fill all required fields', 'warning');
      return;
    }

    let id = this.editData.ID;
    let Code = this.editData.ClassCode;
    let Name = this.editData.ClassName;
    let adocCategory = this.editData.GroupID;
    let IsInactive = this.editData.IsInactive;

    this.masterService
      .update_adocClass_data(id, Code, Name, adocCategory, IsInactive)
      .subscribe((data: any) => {
        if (data) {
          this.notificationService.showNotification(`data updated Successfully`, 'success');
          this.onSaved.emit();
          this.visible = false;
          this.visibleChange.emit(false);
        } else {
          this.notificationService.showNotification(`Your Data Not Saved`, 'error');
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
    DxNumberBoxModule
  ],
  declarations: [AdocClassEditFormComponent],
  exports: [AdocClassEditFormComponent],
})
export class AdocClassEditFormModule {}
