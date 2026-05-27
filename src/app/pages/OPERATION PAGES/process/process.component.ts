import {
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import notify from 'devextreme/ui/notify';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxDateRangeBoxModule,
  DxDropDownBoxComponent,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxLoadPanelModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { ReportService } from 'src/app/services/Report-data.service';
import { CommonModule } from '@angular/common';
import { FormPopupModule } from 'src/app/components';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';
import { OperationReportService } from '../operation-report.service';
import { confirm } from 'devextreme/ui/dialog';
import {
  ClinicalDataImportFormComponent,
  ClinicalDataImportFormModule,
} from '../../POP-UP_PAGES/clinical-data-import-form/clinical-data-import-form.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { CostingDataFormModule } from '../../POP-UP_PAGES/costing-data-form/costing-data-form.component';
import { InactivityService } from 'src/app/services/inactivity.service';
import { NotificationService } from 'src/app/services/notification.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-process',
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.scss'],
  providers: [ReportService, DataService, OperationReportService],
})
export class ProcessComponent {
  @ViewChild('validationGroup', { static: true })
  validationGroup: DxValidationGroupComponent;

  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(DxDropDownBoxComponent, { static: false })
  facilityDropDown!: DxDropDownBoxComponent;

  isAddFormPopupOpened: any = false;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [10, 20, 50, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;
  isFilterRowVisible: boolean = false;
  popupwidth: any = '90%';
  popupHeight: any = 'auto';
  facilityData: any;
  userID: any;
  financeData: any[] = [];
  financeDataSource: any;
  selectedFacilityID: any;
  selectedPeriodData: any[] = [];
  selectedData: any;
  ViewCostingDataPopup: boolean = false;
  isProcessing: boolean = false;
  isNewReprocessing:boolean = false;
  StatusID :any;

  dateRange = {
    startDate: null,
    endDate: null,
  };

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.operationService.getClinicalCostingList(this.userID).subscribe({
          next: (res: any) => resolve(res.data),
          error: ({ message }) => reject(message),
        });
      }),
  });

  addButtonOptions: any;

  applyButtonOptions = {
    text: 'Apply',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Apply',
    onClick: () => this.applyFilter(),
    elementAttr: { class: 'mt-2' },
  };

  currentPathName: any;
  initialized: boolean;
  isReprocess :boolean;

  selectedmonth: any = '';
  selectedYear: number | null = null;
  minDate: Date;
  maxDate: Date;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  CanApproveCostingData: boolean = false;
  CanUploadCostingData: boolean = false;
  CanVerifyCostingData: boolean = false;
  previlagelogData: any;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };
  processMessage: string = 'Processing...';

  showValidationPopup = false;
  validationIssues: any[] = [];
  continueAfterValidation = false;

  showProgressBar = false;
  currentBatchIndex = 0;
  totalBatches = 0;
  popupVisible:boolean =false;
  popupMessage = '';
  facilityHint = '';

  constructor(
    private service: ReportService,
    private router: Router,
    private dataService: DataService,
    private operationService: OperationReportService,
    private masterservice: MasterReportService,
    private route: ActivatedRoute,
    private inactivityService: InactivityService,
    private notificationService: NotificationService
  ) {
    this.minDate = new Date(2023, 0, 1);
    this.maxDate = new Date();
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
    this.userID = sessionStorage.getItem('UserID');
    this.getUserFacilityData();
    this.fetch_previlages();

    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });

    this.addButtonOptions = {
      icon: 'bi bi-plus-circle',
      text: 'New',
      type: 'default',
      stylingMode: 'contained',
      hint: 'New',
      onClick: () => this.openPopup(),
      disabled: !this.menuPrevilage.CanAdd,
      elementAttr: { class: 'add-button' },
    };
    // this.refresh()
  }

  fetch_previlages() {
    const logDataString = localStorage.getItem('logData'); // Get from localStorage
    if (logDataString) {
      this.previlagelogData = JSON.parse(logDataString);
    }
  }

  //================ Year value change ===================
  onYearChanged(e: any): void {
    this.selectedYear = e.value;
    this.selectedmonth = '';
    const currentYear = new Date().getFullYear();
    const today = new Date();
    if (this.selectedYear === currentYear) {
      // Set from date to the start of the year and to date to today
      this.dateRange.startDate = new Date(this.selectedYear, 0, 1); // January 1 of the current year
      this.dateRange.endDate = today; // Today's date
    } else {
      this.dateRange.startDate = new Date(this.selectedYear, 0, 1); // January 1
      this.dateRange.endDate = new Date(this.selectedYear, 11, 31); // December 31
    }
  }

  //================Month value change ===================
  onMonthValueChanged(e: any) {
    this.selectedmonth = e.value ?? '';

    const today = new Date();
    const currentYear = today.getFullYear();

    if (this.selectedmonth === '') {
      if (this.selectedYear === currentYear) {
        this.dateRange.startDate = new Date(currentYear, 0, 1);
        this.dateRange.endDate = today;
      } else {
        this.dateRange.startDate = new Date(this.selectedYear, 0, 1);
        this.dateRange.endDate = new Date(this.selectedYear, 11, 31);
      }
    } else {
      this.dateRange.startDate = new Date(
        this.selectedYear,
        this.selectedmonth,
        1
      );
      this.dateRange.endDate = new Date(
        this.selectedYear,
        this.selectedmonth + 1,
        0
      );
    }
  }

  disableDeleteButton = ({ row }) => {
    const StatusID = row?.data?.StatusID;
    return !(StatusID === 1 || StatusID ===0);
  };

  disableVerifyButton = ({ row }) => {
    const StatusID = row?.data?.StatusID;
    return !(StatusID === 1);
  };

  disableApproveButton = ({ row }) => {
    const StatusID = row?.data?.StatusID;
    return !(StatusID === 2);
  };

  isDetailsVisible = (e: any) => {
  // disable button when StatusID = 0
  return e.row.data.StatusID == 0;
};

isResumeProcess = (e: any) => {
  // disable button when StatusID = 0
  return e.row.data.StatusID == 0;
};

  getDataGridList() {
    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.operationService.getClinicalCostingList(this.userID).subscribe({
            next: (res: any) => resolve(res.data),
            error: ({ message }) => reject(message),
          });
        }),
    });
  }

  getUserFacilityData() {
    this.masterservice
      .Get_User_Facility_List_Data(this.userID)
      .subscribe((res: any) => {
        this.facilityData = res.data;

        if (this.facilityData?.length == 1) {
          // Auto-select first facility
          this.selectedFacilityID = [this.facilityData[0].FacilityLicense];
        }
      });
  }

  onFacilityChanged(event: any) {
    this.selectedFacilityID = event.value;
    this.financeDataSource = [];
    this.dateRange = { startDate: null, endDate: null }; // Reset on facility change
  }
  // ========= load datagrid data =============
  fetchFinanceData() {
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-CA'); // returns yyyy-MM-dd in local time
    };

    const data = {
      FacilityID: this.selectedFacilityID.join(','),
      PeriodFrom: formatDate(this.dateRange.startDate),
      PeriodTo: formatDate(this.dateRange.endDate),
    };
    this.financeDataSource = new DataSource<any>({
  load: () =>
    new Promise((resolve, reject) => {
      this.operationService.getProcessFinanceData(data).subscribe({
        next: (res: any) => {

          // ⭐ ALWAYS assign to array
          this.financeData = res.data || [];

          // show no-data message
          if (this.financeData.length === 0) {
            notify(
              {
                message: 'No Data Found for given date range',
                position: { at: 'top right', my: 'top right' },
              },
              'error'
            );
          }

          resolve(this.financeData);
        },

        error: (err) => {
          notify(
            {
              message: 'Error loading finance data',
              position: { at: 'top right', my: 'top right' },
            },
            'error'
          );
          reject(err.message || 'Unknown error');
        },
      });
    }),
});

  }

  // ========= apply filter =============
  // applyFilter() {
  //   const validationResult = this.validationGroup.instance.validate();
  //   console.log(validationResult, 'validation Result');

  //   // Check if the form is valid before proceeding
  //   if (!validationResult.isValid) {
  //     return; // Stop execution if form is not valid; error messages will be shown next to the fields
  //   }
  //   console.log(this.selectedFacilityID, this.dateRange.endDate)

  //   if (this.selectedFacilityID && this.dateRange.endDate) {
  //     this.fetchFinanceData();
  //   }
  // }

  applyFilter() {
  const validationResult = this.validationGroup.instance.validate();
  if (!validationResult.isValid) {
    return;
  }

  const selectedFacility = this.selectedFacilityID.join(','); // in case it's an array
  const selectedFrom = new Date(this.dateRange.startDate);
  const selectedTo = new Date(this.dateRange.endDate);

  // Get the currently loaded items
  this.dataSource.load().then((data: any[]) => {
    const hasOverlap = data.some((item) => {
      if (item.FacilityID !== selectedFacility) return false;

      const itemFrom = new Date(item.PeriodFrom);
      const itemTo = new Date(item.PeriodTo);

      return selectedFrom <= itemTo && selectedTo >= itemFrom;
    });

    if (hasOverlap && this.isNewReprocessing ==false) {
      // Open popup instead of notify
      this.popupMessage = 'Costing already processed for this facility during the selected period';
      this.popupVisible = true;
      return; // Stop execution
    }

    // No overlap, proceed
    this.fetchFinanceData();
  });
}



  // ===== Process Finance Data =====
  async onProcessData() {
    if (!this.isValid()) return;

    const formatDate = (date: Date): string => date.toLocaleDateString('en-CA');
    const payload :any = {
      FacilityID: this.selectedFacilityID.join(','),
      PeriodFrom: formatDate(this.dateRange.startDate),
      PeriodTo: formatDate(this.dateRange.endDate),
      UserID: this.userID,
    };

    // === Use simple loader for validation ===
    this.isProcessing = true;
    this.processMessage = 'Validating data...';
    this.inactivityService.setApiInProgress(true);

    try {
      const validateRes: any = await firstValueFrom(
        this.operationService.Validate_process_Data(payload)
      );

      if (validateRes.flag !== '1') {
        this.notificationService.showNotification(
          validateRes.message || 'Validation failed.',
          'error'
        );
        return;
      }

      // If issues found → show popup
      if (Array.isArray(validateRes.data) && validateRes.data.length > 0) {
        this.isProcessing = false;
        this.validationIssues = validateRes.data;
        this.showValidationPopup = true;
        return; // stop here, will resume after confirm
      }

      // No issues found → continue process
      payload.IsReprocess = this.isNewReprocessing;
      await this.executeProcessFlow(payload);
    } catch (err) {
      this.notificationService.showNotification('Validation error.', 'error');
    } finally {
      this.inactivityService.setApiInProgress(false);
    }
  }

  // ===== Cancel Process =====
  onCancelValidationPopup() {
    this.showValidationPopup = false;
    this.validationIssues = [];
    this.isProcessing = false;
    // this.notificationService.showNotification('Process cancelled by user.', 'warning');
  }

  // ===== Confirm Validation issues =====
  async onConfirmValidationPopup() {
    this.showValidationPopup = false;
    this.isProcessing = true;
    this.processMessage = 'Starting process...';
    const formatDate = (date: Date): string => date.toLocaleDateString('en-CA');
    const payload = {
      FacilityID: this.selectedFacilityID.join(','),
      PeriodFrom: formatDate(this.dateRange.startDate),
      PeriodTo: formatDate(this.dateRange.endDate),
      UserID: this.userID,
      IsReprocess : this.isNewReprocessing
    };

    await this.executeProcessFlow(payload);
  }

  // ===== Begin → Batch → Finish =====
  async executeProcessFlow(payload: any) {
    try {
      // === Step 1: Begin process ===
      this.isProcessing = true;
      this.processMessage = 'Starting process...';

      const beginRes: any = await firstValueFrom(
        this.operationService.Begin_process_Data(payload)
      );

      if (!beginRes?.data?.length) {
        this.notificationService.showNotification(
          beginRes.message || 'No batches found to process.',
          'error'
        );
        this.isProcessing = false;
        return;
      }

      const batchList = beginRes.data;
      const total = batchList.length;
      let count = 0;

      // === Step 2: Hide simple loader and show detailed batch loader ===
      this.isProcessing = false;
      this.showProgressBar = true;
      this.currentBatchIndex = 0;
      this.totalBatches = total;

      // === Step 3: Loop through batches ===
      for (const item of batchList) {
        count++;
        this.currentBatchIndex = count;

        const batchPayload = {
          ProcessID: item.ProcessID,
          BatchID: item.BatchID,
        };

        await firstValueFrom(
          this.operationService.Process_process_Data(batchPayload)
        );
      }

      // === Step 4: Hide batch loader, show old loader again for finalizing ===
      this.showProgressBar = false;
      this.isProcessing = true;
      this.processMessage = 'Finalizing...';

      const finishPayload = { ProcessID: batchList[0].ProcessID };
      const finishRes: any = await firstValueFrom(
        this.operationService.Finish_process_Data(finishPayload)
      );

      if (finishRes.flag === '1') {
        this.notificationService.showNotification(
          'Process completed successfully!',
          'success'
        );
        this.processMessage = 'Finalizing...';
      } else {
        this.notificationService.showNotification(
          finishRes.message || 'Failed to finalize process.',
          'error'
        );
        this.processMessage = 'Finalization failed.';
      }
    } catch (err) {
      this.notificationService.showNotification(
        'Error occurred during batch process.',
        'error'
      );
    } finally {
      // === Step 5: Clean up ===
      setTimeout(() => {
        this.isProcessing = false;
        this.isNewReprocessing = false;
        this.showProgressBar = false;
        this.currentBatchIndex = 0;
        this.totalBatches = 0;
        this.processMessage = 'Processing...';
        this.CloseForm();
      }, 1500);
    }
  }

  // ==============
  viewDetails = (e) => {
    this.selectedData = e.row.key;
    const ID = this.selectedData.ID;
    this.isReprocess = this.selectedData.IsReprocess;
    setTimeout(() => this.ViewCostingDataPopup = true, 0);
  };

  isReprocessVisible(rowData: any): boolean {
    console.log(rowData,"rowData")
  return rowData.row.data.ProductionUpload !==  'Uploaded';
}

onReprocessButtonClick = (e: any) => {
  const result = confirm(
    'Are you sure you want to reprocess this record?',
    'Confirm Reprocess'
  );

  result.then((dialogResult) => {
    if (dialogResult) {
      this.isNewReprocessing = true;

      setTimeout(() => (this.isAddFormPopupOpened = true), 0);

      // Set values
      this.selectedFacilityID = [e.row.data.FacilityID];
      this.dateRange.startDate = e.row.data.PeriodFrom;
      this.dateRange.endDate = e.row.data.PeriodTo;

      const periodFrom = new Date(e.row.data.PeriodFrom);
      this.selectedYear = periodFrom.getFullYear();

      // ✅ Run applyFilter() after Angular detects the changes
      setTimeout(() => {
        console.log('Before applying filter:', this.selectedFacilityID, this.dateRange);
        this.applyFilter();
      }, 200);
    }
  });
};



  // handle click events
  rowData_Deleting = (e) => {
    const ProcessID = e.row.key.ID;

    confirm(
      'Are you sure you want to delete this record?',
      'Confirm Deletion'
    ).then((dialogResult) => {
      if (dialogResult) {
        this.operationService.delete_Costing_Data(ProcessID).subscribe(
          (res: any) => {
            if (res.flag == '1') {
              notify({
                message: 'Deleted successfully!',
                position: { at: 'top right', my: 'top right' },
                type: 'success',
                displayTime: 3000,
              });
              this.getDataGridList();
            } else {
              notify({
                message: `Delete failed: ${res.message}`,
                position: { at: 'top right', my: 'top right' },
                type: 'error',
                displayTime: 3000,
              });
            }
          },
          (error) => {
            notify({
              message:
                'An error occurred while deleting. Please try again later.',
              position: { at: 'top right', my: 'top right' },
              type: 'error',
              displayTime: 3000,
            });
          }
        );
      }
    });
  };

  verifyRow_Data = (e) => {
    const ProcessID = e.row.key.ID;

    confirm(
      'Are you sure you want to verify this record?',
      'Confirm Verification'
    ).then((dialogResult) => {
      if (dialogResult) {
        this.operationService.verify_Costing_Data(ProcessID).subscribe(
          (res: any) => {
            if (res.flag == '1') {
              notify({
                message: 'Verified successfully!',
                position: { at: 'top right', my: 'top right' },
                type: 'success',
                displayTime: 3000,
              });
              this.getDataGridList();
            } else {
              notify({
                message: `Verification failed: ${res.message}`,
                position: { at: 'top right', my: 'top right' },
                type: 'error',
                displayTime: 3000,
              });
            }
          },
          (error) => {
            notify({
              message:
                'An error occurred while verifying. Please try again later.',
              position: { at: 'top right', my: 'top right' },
              type: 'error',
              displayTime: 3000,
            });
          }
        );
      }
    });
  };

  approveRow_Data = (e) => {
    const ProcessID = e.row.key.ID;

    confirm(
      'Are you sure you want to approve this record?',
      'Confirm Approval'
    ).then((dialogResult) => {
      if (dialogResult) {
        this.operationService.approve_Costing_Data(ProcessID).subscribe(
          (res: any) => {
            if (res.flag == '1') {
              notify({
                message: 'Approved successfully!',
                position: { at: 'top right', my: 'top right' },
                type: 'success',
                displayTime: 3000,
              });
              this.getDataGridList();
            } else {
              notify({
                message: `Approval failed: ${res.message}`,
                position: { at: 'top right', my: 'top right' },
                type: 'error',
                displayTime: 3000,
              });
            }
          },
          (error) => {
            notify({
              message:
                'An error occurred while approving. Please try again later.',
              position: { at: 'top right', my: 'top right' },
              type: 'error',
              displayTime: 3000,
            });
          }
        );
      }
    });
  };


  resume_Process = (e) => {
  const ProcessID = e.row.key.ID;

  confirm(
    'Do you want to resume this process from the last saved batch?',
    'Resume Process'
  ).then(async (dialogResult) => {

    if (!dialogResult) return;

    const payload = { 
      ProcessID: ProcessID
    };

    this.operationService.resume_Process_Data(payload).subscribe(
      async (res: any) => {

        if (res.flag !== '1') {
          notify({
            message: res.message,
            position: { at: 'top right', my: 'top right' },
            type: 'error'
          });
          return;
        }

        if (!res.data || res.data.length === 0) {
          notify({
            message: 'No pending batches found to resume.',
            position: { at: 'top right', my: 'top right' },
            type: 'warning'
          });
          return;
        }

        // Resume using returned pending batches only
        const batchList = res.data;

        // Total progress = ALL finance data
        const total = res.TotalFinanceData;

        // Already completed batches
        const completed = total - res.PendingProcessData;

        // Setup progress bar
        this.totalBatches = total;
        this.currentBatchIndex = completed;
        this.showProgressBar = true;
        this.isProcessing = false;

        // Resume execution from pending batches
        for (const batch of batchList) {
          this.currentBatchIndex++;

          const batchPayload = {
            ProcessID: batch.ProcessID,
            BatchID: batch.BatchID
          };

          await firstValueFrom(
            this.operationService.Process_process_Data(batchPayload)
          );
        }

        // Finalize after resume
        this.processMessage = 'Finalizing process...';
        this.showProgressBar = false;
        this.isProcessing = true;

        const finishPayload = { ProcessID };
        const finishRes: any = await firstValueFrom(
          this.operationService.Finish_process_Data(finishPayload)
        );

        if (finishRes.flag === '1') {
          notify({
            message: 'Process completed successfully!',
            position: { at: 'top right', my: 'top right' },
            type: 'success'
          });
          this.isProcessing = false;
        }
        else {
          notify({
            message: finishRes.message || 'Finalization failed.',
            position: { at: 'top right', my: 'top right' },
            type: 'error'
          });
        }

        // ✅ Cleanup
        // this.resetProcessUI();
        this.getDataGridList();
      },
      () => {
        notify({
          message: 'Resume process failed.',
          position: { at: 'top right', my: 'top right' },
          type: 'error'
        });
      }
    );
  });
};


  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'clinical_process';
    this.service.exportDataGrid(event, fileName);
  }

  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  isValid() {
    return this.validationGroup.instance.validate().isValid;
  }

  openPopup() {
    // this.operationService.process_Data_Clear().subscribe((res: any) => {
    //   if (res) {
    //     this.isAddFormPopupOpened = true;
    //   }
    // });

    this.isAddFormPopupOpened = true;
  }
  CloseForm() {
    this.isAddFormPopupOpened = false;
    this.isNewReprocessing = false;
    this.financeData = [];

    this.selectedFacilityID = [];
    this.selectedYear = null;
    this.selectedmonth = null;
    this.dateRange = {
      startDate: null,
      endDate: null,
    };

    this.financeDataSource = [];

    if (this.validationGroup?.instance) {
      this.validationGroup.instance.reset();
    }
    if (this.dataGrid?.instance) {
      this.dataGrid.instance.refresh();
    }
  }

  // =================Remove clinical costing=========================
  onRowRemoving(event: any) {
    event.cancel = true;
    var SelectedRow = event.key;
    this.operationService
      .removeClinicalCostingData(SelectedRow.ID)
      .subscribe(() => {
        try {
          notify(
            {
              message: 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );

          // window.location.reload();
        } catch (error) {
          notify(
            {
              message: 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
        event.component.refresh();
        this.dataGrid.instance.refresh();
      });
  }


  facilityDisplayExpr = (item: any) => {
  if (!item) {
    return '';
  }
  return `${item.FacilityLicense} - ${item.FacilityName}`;
};

  onFacilitySelected(e: any) {
    // 🔹 CLOSE DROPDOWN
    setTimeout(() => {
      this.facilityDropDown.instance.close();
    });
  }
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
    FormPopupModule,
    ClinicalDataImportFormModule,
    DxPopupModule,
    DxDateRangeBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxDateRangeBoxModule,
    CostingDataFormModule,
    DxDateBoxModule,
    DxLoadPanelModule,
    DxDropDownBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [ProcessComponent],
})
export class ProcessModule {}
