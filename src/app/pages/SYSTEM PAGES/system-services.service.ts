import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from 'src/app/services/config.service';



const Token = JSON.parse(localStorage.getItem('Token'));
@Injectable({
  providedIn: 'root',
})
export class SystemServicesService {
  constructor(private http: HttpClient,private config: ConfigService) {}

  private get BASE_URL(): string {
    return this.config.apiBaseUrl;
  }
  //======Facility Drop down data=====================
  Get_GropDown(dropDownField: any) {
    const Url = `${this.BASE_URL}dropdown`;
    const reqBody = { name: dropDownField };
    return this.http.post(Url, reqBody);
  }
  //===================================Security Policy===================================
  get_securityPolicy_List(userid: any) {
    const Url = `${this.BASE_URL}securitysettings/list`;
    return this.http.post(Url, { UserID: userid });
  }
  //========================Insert OR Update security policy list==========================
  save_security_Policy_Data(data: any) {
    const Url = `${this.BASE_URL}securitysettings/save`;
    const reqBody = data;
    return this.http.post(Url, reqBody);
  }

  //===============================Post office credentials===============================
  //========Facility credentials verify ========
  verify_PostOfficeCredencial() {
    const UserId = sessionStorage.getItem('UserID');
    const Url = `${this.BASE_URL}facilitycredentials/verifyuserfacilities`;
    const reqBody = {
      UserId: UserId,
    };
    return this.http.post(Url, reqBody);
  }
  //===========List===========
  get_PostOfficeCredencial_List() {
    const Url = `${this.BASE_URL}facilitycredentials/list`;
    const reqBody = {
      list: [],
    };
    return this.http.post(Url, reqBody);
  }
  //=====Add or update data========
  update_PostOfficeCredencial_Data(
    FacilityID: any,
    PostOfficeID: any,
    LoginName: any,
    Password: any
  ) {
    const url = `${this.BASE_URL}facilitycredentials/update`;
    const reqBody = {
      FacilityID: FacilityID,
      PostOfficeID: PostOfficeID,
      LoginName: LoginName,
      Password: Password,
    };
    return this.http.post(url, reqBody);
  }

  //=====Add or update data========
  verify_update_PostOfficeCredencial_Data(
    FacilityLicense: any,
    PostOfficeID: any,
    LoginName: any,
    Password: any
  ) {
    const UserId = sessionStorage.getItem('UserID');
    const url = `${this.BASE_URL}facilitycredentials/verifyfacility`;
    const reqBody = {
      UserId: UserId,
      FacilityLicense: FacilityLicense,
      PostOfficeID: PostOfficeID,
      LoginName: LoginName,
      Password: Password,
    };
    return this.http.post(url, reqBody);
  }

  // ------------------------------------------License Info---------------------------------------------------
  list_license_info_data(isLoading: boolean = false) {
    const data={
      isManualRefresh:isLoading
    }
    const url = `${this.BASE_URL}facility/licensefacilityInfo`;
    return this.http.post(url, data);
  }

  //=============================Security Notification ===================================================
  //==============lising data===========
  getSecurityNotificationData() {
    const url = `${this.BASE_URL}notificationsettings/list`;
    return this.http.post(url, {});
  }

  //========save notification data=======
  saveNotificationSettings(formdata: any) {
    const url = `${this.BASE_URL}notificationsettings/save`;
    const reqBody = formdata;
    return this.http.post(url, reqBody);
  }
  //========save notification template data=======
  getNotificationTemplateList() {
    const url = `${this.BASE_URL}notificationsettings/templatelist`;
    return this.http.post(url, {});
  }

  //=========update a notificatin template ========
  updateNotificationSettingTemplate(formdata: any) {
    const url = `${this.BASE_URL}notificationsettings/updatenotification`;
    const reqBody = formdata;
    return this.http.post(url, reqBody);
  }
  //=============send a test mail==================
  sendTestMail(userid: any, receiverid: any, subject: any, message: any) {
    const url = `${this.BASE_URL}changepassword/formail`;
    const reqBody = {
      userid: userid,
      EmailID: receiverid,
      subject: subject,
      mesasge: message,
    };
    return this.http.post(url, reqBody);
  }
}
