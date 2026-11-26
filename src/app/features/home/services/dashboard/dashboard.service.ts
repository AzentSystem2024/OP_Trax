import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConfigService } from 'src/app/services/config.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
  ) {}

  private get BaseURL(): string {
    return this.config.apiBaseUrl;
  }

  fetch_chart_data_List(payload: any): Observable<any> {
    const url = `${this.BaseURL}Dashboard/getDashboardData`;
    return this.http.post(url, payload);
  }

  fetchChartData(payload: any): Observable<any> {
    return this.fetch_chart_data_List(payload);
  }

  Get_GropDown(dropDownField: any): Observable<any> {
    const url = `${this.BaseURL}dropdown`;
    return this.http.post(url, { name: dropDownField });
  }

  get_Last_SyncDate_Details(facilityid: any): Observable<any> {
    const url = `${this.BaseURL}Facility/getLastTransactionDate`;
    return this.http.post(url, { FacilityID: facilityid });
  }

  get_UserWise_FacilityList_Data(): Observable<any> {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BaseURL}facility/facilitydetails`;
    return this.http.post(url, { UserID: userid });
  }

  getMenuPrevilages(path: string): any {
    try {
      const menuItems = JSON.parse(
        localStorage.getItem('sidemenuItems') || '[]',
      );
      const menuItem = menuItems.find((item: any) => item.path === path);

      if (menuItem) {
        return {
          CanAdd: !!menuItem.CanAdd,
          CanEdit: !!menuItem.CanEdit,
          CanDelete: !!menuItem.CanDelete,
          CanExport: !!menuItem.CanExport,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
