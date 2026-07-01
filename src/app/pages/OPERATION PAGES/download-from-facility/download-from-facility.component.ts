import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxLoadPanelModule,
  DxToolbarModule,
  DxValidatorComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { DxSelectBoxModule } from 'devextreme-angular';
import { DxDateBoxModule } from 'devextreme-angular';
import { DxNumberBoxModule } from 'devextreme-angular';
import { DxButtonModule } from 'devextreme-angular';
import { DxProgressBarModule } from 'devextreme-angular';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { DxToastModule } from 'devextreme-angular';
import { Subscription, forkJoin } from 'rxjs';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { SystemServicesService } from '../../SYSTEM PAGES/system-services.service';
import { FormPopupModule } from 'src/app/components';
import { InactivityService } from 'src/app/services/inactivity.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ReportService } from 'src/app/services/Report-data.service';

@Component({
  selector: 'app-download-from-facility',
  templateUrl: './download-from-facility.component.html',
  styleUrl: './download-from-facility.component.scss',
  providers: [ReportService],
})
export class DownloadFromFacilityComponent implements OnInit, OnDestroy {
  @ViewChild('facilityValidator', { static: false })
  facilityValidator!: DxValidatorComponent;

  toolbarItems = [
    {
      text: 'Download Claims',
      location: 'before',
      class: 'grid-header',
    },
  ];

  FacilitydropdownItems: any;
  FacilityValue: any;

  facilityDownloadedCount: number = 0;

  monthDataSource: { name: string; value: any }[];
  years: number[] = [];
  selectedmonth: any = '';
  selectedYear: number | null = null;

  startDate: Date = new Date();
  endDate: Date = new Date();
  minDate: Date;
  maxDate: Date;

  isLoading: boolean = false;
  showProgressBar: boolean = false;
  seconds: any;

  facilityButtonVisibility: boolean = true;
  lastClaimSyncTime: any;

  disableButtons = false;
  intervalId: any;

  facility_Liecence_Info_Data: any;
  private serviceSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  isCancelled: boolean = false;
  currentRequest?: Subscription;
  currentProcessingDate: any;

  constructor(
    private dataService: DataService,
    private service: ReportService,
    private router: Router,
    private systemservice: SystemServicesService,
    private inactivityService: InactivityService,
    private notificationService: NotificationService,
  ) {
    this.get_Facility_List_Data();
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
  }

  ngOnInit() {
    this.minDate = new Date(2000, 1, 1);
    this.maxDate = new Date();
    this.updateMonthYearFromDates(); // Set initial year and month based on default dates
    this.fetchServiceStatus();
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.clearNotificationInterval();
      } else if (
        event instanceof NavigationEnd &&
        this.isCurrentPage(event.urlAfterRedirects)
      ) {
        // Restore notifications when returning to this page

        this.restoreNotificationOnNavigation();
      }
    });
  }

  isCurrentPage(url: string): boolean {
    return url === '/Synchronize-Data-Pages';
  }

  //=========================Fetch facility list===================
  get_Facility_List_Data() {
    this.isLoading = true;

    forkJoin({
      facilities: this.dataService.get_UserWise_FacilityList_Data(),
      licenses: this.systemservice.list_license_info_data(),
    }).subscribe({
      next: (response: any) => {
        if (response.facilities) {
          this.FacilitydropdownItems = response.facilities.facilityDetails;
        }
        if (response.licenses) {
          this.facility_Liecence_Info_Data = response.licenses.data;
        }

        if (this.FacilitydropdownItems?.length == 1) {
          // Auto-select first facility. This will trigger onValueChanged -> fetch_last_sync_times()
          this.FacilityValue = this.FacilitydropdownItems[0].FacilityID;
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching initial data', error);
        this.isLoading = false;
      },
    });
  }

  //==================get last sync time===========================
  fetch_last_sync_times() {
    const facilityid = this.FacilityValue;
    if (!facilityid) return;
    this.isLoading = true;
    this.dataService.get_Last_SyncDate_Details(facilityid).subscribe(
      (response: any) => {
        this.lastClaimSyncTime = response.TransactionDate;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching last sync time', error);
        this.isLoading = false;
      },
    );
  }

  //================ Year value change ===================
  onYearChanged(e: any): void {
    if (!e.event) return; // Prevent programmatic changes from overriding dates
    this.selectedYear = e.value;
    this.selectedmonth = '';
    const currentYear = new Date().getFullYear();
    const today = new Date();
    if (this.selectedYear === currentYear) {
      // Set from date to the start of the year and to date to today
      this.startDate = new Date(this.selectedYear, 0, 1); // January 1 of the current year
      this.endDate = today; // Today's date
    } else if (this.selectedYear !== null) {
      this.startDate = new Date(this.selectedYear, 0, 1); // January 1
      this.endDate = new Date(this.selectedYear, 11, 31); // December 31
    }
  }

  //================Month value change ===================
  onMonthValueChanged(e: any) {
    if (!e.event) return; // Prevent programmatic changes from overriding dates
    this.selectedmonth = e.value ?? '';

    const today = new Date();
    const currentYear = today.getFullYear();

    if (this.selectedmonth === '') {
      if (this.selectedYear === currentYear) {
        this.startDate = new Date(currentYear, 0, 1);
        this.endDate = today;
      } else if (this.selectedYear !== null) {
        this.startDate = new Date(this.selectedYear, 0, 1);
        this.endDate = new Date(this.selectedYear, 11, 31);
      }
    } else {
      if (this.selectedYear !== null) {
        this.startDate = new Date(this.selectedYear, this.selectedmonth, 1);
        this.endDate = new Date(this.selectedYear, this.selectedmonth + 1, 0);
      }
    }
  }

  //============ facility drop down value change event =============
  onFacilityExpiryCheck = (): boolean => {
    let isFacilityExists = this.facility_Liecence_Info_Data.find(
      (facility) => facility.ID === this.FacilityValue,
    );
    if (isFacilityExists) {
      let currentDate = new Date();
      let expiryDate = new Date(isFacilityExists.Expiry_Date);

      if (expiryDate < currentDate) {
        notify(
          {
            message: `Your selected facility has expired.`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
        return false; // Facility is expired
      } else {
        return true; // Facility is valid
      }
    }
    return false; // Facility not found (invalid selection)
  };

  // ===== Click event of Facility Sync =====
  handleClaimButtonClick() {
    const validationResult = this.facilityValidator.instance.validate();
    if (!validationResult.isValid) {
      this.notificationService.showNotification(
        `Select a facility value and try again..`,
        'error',
      );
      return;
    }

    const isFacilityValid = this.onFacilityExpiryCheck();
    if (!isFacilityValid) {
      this.notificationService.showNotification(
        `Selected facility is expired..`,
        'error',
      );
      return;
    }

    this.facilityButtonVisibility = false;
    this.facilityDownloadedCount = 0;
    this.isCancelled = false;
    this.currentRequest = undefined;

    const facilityID = this.FacilityValue;
    const fromDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const totalDays =
      Math.floor(
        (endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (totalDays <= 0) {
      this.notificationService.showNotification(
        `Invalid date range selected.`,
        'error',
      );
      this.facilityButtonVisibility = true;
      return;
    }

    this.seconds = 0;
    this.showProgressBar = true;

    // Mark API process as active
    this.inactivityService.setApiInProgress(true);

    // Track the current processing date
    this.currentProcessingDate = fromDate;

    const callApiForDate = (currentDate: Date) => {
      if (this.isCancelled) {
        this.finishDownload(`Download cancelled by user.`, 'warning');
        this.inactivityService.setApiInProgress(false);
        return;
      }

      const formattedDate = this.convertDateToYYYYMMDD(currentDate);
      this.currentProcessingDate = currentDate;

      this.currentRequest = this.dataService
        .get_Claim_SyncData_Details(facilityID, formattedDate, formattedDate)
        .subscribe(
          (response: any) => {
            if (this.isCancelled) {
              this.finishDownload(`Download cancelled by user.`, 'warning');
              this.inactivityService.setApiInProgress(false);
              return;
            }

            if (response.flag === 1) {
              this.facilityDownloadedCount += response.count;
              this.seconds++;

              if (this.seconds >= totalDays) {
                this.finishDownload(`Claim Sync completed!`, 'success');
                this.inactivityService.setApiInProgress(false);
              } else {
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                callApiForDate(nextDate);
              }
            } else {
              this.finishDownload(
                response.message || `Error syncing data for ${formattedDate}`,
                'error',
              );
              this.inactivityService.setApiInProgress(false);
            }
          },
          (error) => {
            if (this.isCancelled) {
              this.finishDownload(`Download cancelled by user.`, 'warning');
              this.inactivityService.setApiInProgress(false);
              return;
            }

            console.error(`Error on ${formattedDate}:`, error);
            this.finishDownload(
              error.error?.message ||
                error.message ||
                `Error syncing data for ${formattedDate}`,
              'error',
            );
            this.inactivityService.setApiInProgress(false);
          },
        );
    };

    callApiForDate(fromDate);
  }

  // ===== Cancel button handler =====
  cancelDownload() {
    if (!this.isCancelled) {
      this.isCancelled = true;
      this.notificationService.showNotification(
        `⏳ Download will stop after the current request is completed...`,
        'warning',
      );
    }
  }

  // ===== Helper for cleanup & notifications =====
  finishDownload(message: string, type: 'success' | 'error' | 'warning') {
    this.showProgressBar = false;
    this.facilityButtonVisibility = true;
    this.fetch_last_sync_times();
    if (message) {
      this.notificationService.showNotification(message, type);
    }
  }

  // === date change event =====
  onStartDateChange(event: any) {
    if (!event.event) return; // Prevent programmatic changes from causing loops
    const selectedStartDate = event.value;
    if (this.endDate && selectedStartDate > this.endDate) {
      this.endDate = selectedStartDate;
    }
    this.updateMonthYearFromDates();
  }

  // Event handler for changes in End Date
  onEndDateChange(event: any) {
    if (!event.event) return; // Prevent programmatic changes from causing loops
    const selectedEndDate = event.value;
    if (this.startDate && selectedEndDate < this.startDate) {
      this.startDate = selectedEndDate;
    }
    this.updateMonthYearFromDates();
  }

  // Sync Year and Month dropdowns based on Start and End dates
  updateMonthYearFromDates() {
    if (!this.startDate || !this.endDate) return;
    const startYear = this.startDate.getFullYear();
    const endYear = this.endDate.getFullYear();
    const startMonth = this.startDate.getMonth();
    const endMonth = this.endDate.getMonth();

    if (startYear === endYear) {
      this.selectedYear = startYear;
      if (startMonth === endMonth) {
        this.selectedmonth = startMonth;
      } else {
        this.selectedmonth = '';
      }
    } else {
      this.selectedYear = null;
      this.selectedmonth = '';
    }
  }
  //=================Convert the date format==================
  convertDateToYYYYMMDD(inputDate: Date): string {
    const date = new Date(inputDate);
    // Get year, month, and date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fetchServiceStatus() {
    this.serviceSubscription = this.dataService
      .getServiceSynchStatus()
      .subscribe((response: any) => {
        console.log(response, 'SERVICESTATUS');
        // If Flag is 1, enable notifications for this page
        if (response.Flag === 1) {
          // this.disableButtons = true;
          // Notify immediately
          notify(
            {
              message: response.Message,
              position: {
                at: 'top right',
                my: 'top right',
              },
            },
            'success',
          );
          // // Clear any existing interval to avoid duplication
          // if (this.intervalId) {
          //   clearInterval(this.intervalId);
          // }
          // // Start a new interval to display the message every 30 seconds
          // this.intervalId = setInterval(() => {
          //   notify(
          //     {
          //       message: response.Message,
          //       position: {
          //         at: 'top right',
          //         my: 'top right',
          //       },
          //     },
          //     'success'
          //   );
          // }, 5000);
        } else {
          // If Flag is not 1, clear the interval
          this.clearNotificationInterval();
          this.disableButtons = false;
        }
      });
  }

  restoreNotificationOnNavigation(): void {
    console.log('Restoring notifications for SpecificPageComponent');
    this.fetchServiceStatus();
  }

  clearNotificationInterval(): void {
    if (this.intervalId) {
      console.log('Clearing interval:', this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy called for SpecificPageComponent');
    // Clear the interval and unsubscribe from all subscriptions
    this.clearNotificationInterval();

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      console.log('Unsubscribed from serviceSubscription');
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('Unsubscribed from routerSubscription');
    }

    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }
    this.inactivityService.setApiInProgress(false);
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxToolbarModule,
    DxSelectBoxModule,
    DxDateBoxModule,
    DxNumberBoxModule,
    DxButtonModule,
    DxProgressBarModule,
    DxLoadPanelModule,
    DxValidatorModule,
    DxToastModule,
    FormPopupModule,
    DxDataGridModule,
  ],
  providers: [],
  exports: [],
  declarations: [DownloadFromFacilityComponent],
})
export class DownloadFromFacilityModule {}
