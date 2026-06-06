import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { ConfigService } from './config.service';

const Token = JSON.parse(localStorage.getItem('Token') || '{}');
const version = '0.01';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private config: ConfigService,
  ) {}

  private get BaseURL(): string {
    return this.config.apiBaseUrl;
  }

  get_version() {
    return version;
  }

  fetch_customer_name() {
    const logDataString = localStorage.getItem('logData'); // Get from localStorage
    if (logDataString) {
      const logData = JSON.parse(logDataString);
      return {
        customerName: logData.CustomerName || '',
        version: version,
      };
    }
  }

  // =============== get dashboard chart data list ===============
  fetch_chart_data_List(payload: any) {
    const url = `${this.BaseURL}Dashboard/getDashboardData`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  //=================DAte format changing to needed format========
  formatDateTime(date: string): string {
    return formatDate(new Date(date), 'dd-MMM-yyyy hh:mm a', 'en-US');
  }

  //===============Fetch claim details drill down values===========
  set_pageLoading_And_Closing_Log(Action: any, PageName: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = PageName;
    const TOKEN = JSON.parse(localStorage.getItem('logData') || '{}').Token;
    const url = `${this.BaseURL}user/useractivity`;
    const reqBody = {
      USER_ID: userid,
      TITLE: currentPathName,
      ACTION: Action,
      TOKEN: TOKEN,
    };
    return this.http.post(url, reqBody);
  }

  //==================dashboard facility sync details data==========
  get_Last_SyncDate_Details(facilityid: any) {
    const url = `${this.BaseURL}Facility/getLastTransactionDate`;
    const reqBody = {
      FacilityID: facilityid,
    };
    return this.http.post(url, reqBody);
  }

  //==================dashboard facility sync details data==========
  get_UserWise_FacilityList_Data() {
    const userid = sessionStorage.getItem('UserID');
    console.log(userid)
    const url = `${this.BaseURL}facility/facilitydetails`;
    const reqBody = {
      UserID: userid,
    };
    return this.http.post(url, reqBody);
  }

  import_Local_folder_Claim_data(
    facilityID: any,
    fileName: any,
    fileData: any,
  ) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/importclaim`;
    const reqBody = {
      userID: userid,
      facilityID: facilityID,
      fileName: fileName,
      fileData: fileData,
    };
    return this.http.post(url, reqBody);
  }

  import_Local_folder_Remittance_data(
    facilityID: any,
    fileName: any,
    fileData: any,
  ) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/importremittance`;
    const reqBody = {
      userID: userid,
      facilityID: facilityID,
      fileName: fileName,
      fileData: fileData,
    };
    return this.http.post(url, reqBody);
  }

  get_Claim_SyncData_Details(facilityID: any, DateFrom: any, DateTo: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/synchclaim`;
    const reqBody = {
      UserID: userid,
      DateFrom: DateFrom,
      DateTo: DateTo,
      FacilityID: facilityID,
    };
    return this.http.post(url, reqBody);
  }

  get_Remittance_SyncData_Details(facilityID: any, DateFrom: any, DateTo: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/synchremittance`;
    const reqBody = {
      UserID: userid,
      DateFrom: DateFrom,
      DateTo: DateTo,
      FacilityID: facilityID,
    };
    return this.http.post(url, reqBody);
  }

  get_Process_ReportData_Details(facilityID: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/process`;
    const reqBody = {
      UserID: userid,
      DateFrom: '',
      DateTo: '',
      FacilityID: facilityID,
    };
    return this.http.post(url, reqBody);
  }

  get_Download_Log_DataView(fromDate: any, endDate: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}downloadsettings/loglist`;
    const reqBody = {
      DATE_FROM: fromDate,
      DATE_TO: endDate,
    };
    return this.http.post(url, reqBody);
  }

  //==================Auto  download settings data List==========
  get_AutoDownload_Instance_Settings() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}downloadsettings/list`;

    return this.http.post(url, {});
  }

  //==================Auto  download settings data List==========
  autoDownload_Instance_Settings_insert(data: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}downloadsettings/insert`;
    const reqBody = data;
    return this.http.post(url, reqBody);
  }

  getServiceSynchStatus(): Observable<{ Flag: number; Message: string }> {
    console.trace('getServiceSynchStatus called');
    const url = `${this.BaseURL}downloadsettings/ServiceSynch`;
    return this.http.post<{ Flag: number; Message: string }>(url, {}); // Empty object for POST body
  }

  //==================Email schedule data List==========
  get_email_Log_data() {
    const url = `${this.BaseURL}emailscheduler/list`;
    const reqBody = {};
    return this.http.post(url, reqBody);
  }

  //================Insert email alert data============
  insert_Email_alert_Data(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}emailscheduler/insert`;
    const reqBody = {
      UserID: userid,
      ReportID: formData.reportID,
      SearchOn: formData.searchOn,
      DatePeriod: formData.datePeriod,
      EncounterType: formData.encounterType,
      FacilityID: formData.facilities,
      EmailUserID: formData.userEmailID,
    };
    return this.http.post(url, reqBody);
  }

  //================Insert email alert data============
  update_Email_alert_Data(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}emailscheduler/update`;
    const reqBody = {
      UserID: userid,
      ID: formData.ID,
      ReportID: formData.ReportIDList.join(','),
      SearchOn: formData.SearchOn,
      DatePeriod: formData.DatePeriod,
      EncounterType: formData.EncounterType,
      FacilityID: formData.FacilityIDList.join(','),
      EmailUserID: formData.EmailUserIDList.join(','),
    };
    return this.http.post(url, reqBody);
  }

  // ==================================================================================
  //              ==================== ACCOUNTS SERVICE ====================
  // ==================================================================================

  Get_User_Facility_List_Data() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/getAllUserFacility?userID=${userid}`;
    return this.http.post(url, {});
  }

  Get_GropDown(dropDownField: any) {
    const Url = `${this.BaseURL}dropdown`;
    const reqBody = { name: dropDownField };
    return this.http.post(Url, reqBody);
  }

  Get_Account_HeadDepartment() {
    const Url = `${this.BaseURL}accountHead/getDepartment`;
    return this.http.post(Url, {});
  }

  getAccountGroupHeadList(): Observable<any> {
    return this.http.post(`${this.BaseURL}listGroupHead/list`, {});
  }

  getGroupingList(): Observable<any> {
    return this.http.post(`${this.BaseURL}grouplist/list`, {});
  }

  insertAccountHead(items: any) {
    const data = items;
    return this.http.post(`${this.BaseURL}accountHead/Insert`, data);
  }

  insertAccountGroup(items: any) {
    const data = items;
    return this.http.post(`${this.BaseURL}accountGroup/Insert`, data);
  }

  selectAccountHead(id: number) {
    return this.http.post<any>(`${this.BaseURL}accountHead/select/${id}`, {});
  }

  updateAccountHead(items: any) {
    const data = items;
    return this.http.post(`${this.BaseURL}accountHead/update`, data);
  }

  deleteAccountHeadlData(id: number) {
    return this.http.post<any>(`${this.BaseURL}accountHead/delete/ ` + id, {});
  }

  getMenuPrevilages(path: string) {
    try {
      const menuItems = JSON.parse(
        localStorage.getItem('sidemenuItems') || '[]',
      );
      const menuItem = menuItems.find((item: any) => item.path === path);

      if (menuItem) {
        const previlages = {
          CanAdd: !!menuItem.CanAdd,
          CanEdit: !!menuItem.CanEdit,
          CanDelete: !!menuItem.CanDelete,
        };
        return previlages;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // ================ list of ledger group ==============
  get_Ledger_Group_List(): Observable<any> {
    return this.http.post(`${this.BaseURL}accountHead/ledgerGrouplist`, {});
  }

  // ========== insert of ledger group =========
  insert_Ledger_Group(payload: any) {
    const data = payload;
    return this.http.post(`${this.BaseURL}accountHead/ledgerGroupInsert`, data);
  }

  // ============ update ledger group =========
  update_Ledger_Group(payload: any) {
    const data = payload;
    return this.http.post(`${this.BaseURL}accountHead/ledgerGroupUpdate`, data);
  }

  //========== fetch data using id ============
  select_Ledger_Group(id: number) {
    return this.http.post<any>(
      `${this.BaseURL}accountHead/ledgerGroupselect/${id}`,
      {},
    );
  }

  // ============= delete ledger group ============
  delete_Ledger_Group(id: number) {
    return this.http.post<any>(
      `${this.BaseURL}accountHead/ledgerGroupdelete/${id}`,
      {},
    );
  }

  // ========== insert of ledger group =========
  atteched_Ledger_list(payload: any) {
    const data = payload;
    return this.http.post(`${this.BaseURL}accountHead/LedgersList`, data);
  }

  // ============= delete ledger group ============
  delete_Atteched_Ledger_Data(id: number) {
    return this.http.post<any>(
      `${this.BaseURL}accountHead/deleteLedgerAttachedData/${id}`,
      {},
    );
  }

  // ============== get facility download data ============
  get_facility_download_Data(inputdata: any) {
    const url = `${this.BaseURL}ClinicalCostingProcess/viewCostingXml`;
    const reqBody = inputdata;
    return this.http.post(url, reqBody);
  }

  // =============== get facility file data ==============
  get_facility_File_Data(inputdata: any) {
    const url = `${this.BaseURL}ClinicalCostingProcess/viewXml`;
    const reqBody = inputdata;
    return this.http.post(url, reqBody);
  }
}
