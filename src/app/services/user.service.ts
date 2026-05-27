import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable()
export class UserService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  private get BaseURL(): string {
    return this.config.apiBaseUrl;
  }
  //====================Create User========================
  getOtp(data: any): Observable<any> {
    const url = `${this.BaseURL}changepassword/forpassword`;
    return this.http.post(url, data);
  }
}
