import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Token } from '@angular/compiler';
import { Injectable, Injector } from '@angular/core';
import { InactivityService } from './inactivity.service';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigService } from './config.service';

export interface IUser {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface IResponse {
  isOk: boolean;
  data?: IUser;
  message?: string;
}

const defaultPath = '/';
// const BaseURL = environment.PROJECTX_API_BASE_URL;

export const defaultUser: IUser = {
  email: '',
  name: '',
  avatarUrl: '',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedin = new BehaviorSubject<boolean>(false);
  private menuData = new BehaviorSubject<any>(null);

  SideMenu: any;
  private _user: IUser | null = defaultUser;
  UserData: any;
  private _lastAuthenticatedPath: string = defaultPath;

  constructor(
    private router: Router,
    private http: HttpClient,
    private config: ConfigService,
    private injector: Injector,
  ) {}

  private get BaseURL(): string {
    return this.config.apiBaseUrl;
  }

  get loginName(): string {
    return sessionStorage.getItem('loginName') || '';
  }

  set loginName(value: string) {
    sessionStorage.setItem('loginName', value);
  }

  // Existing logic: based on user object
  get loggedIn(): boolean {
    return !!this._user;
  }

  //  New logic: based on localStorage token (for guard)
  get isTokenValid(): boolean {
    try {
      const token = sessionStorage.getItem('AuthToken') || '';
      console.log('Checking token validity:', token);
      return !!token;
    } catch {
      return false;
    }
  }

  set lastAuthenticatedPath(value: string) {
    this._lastAuthenticatedPath = value;
  }

  setUserData(data: any) {
    this.UserData = data;
  }

  getUserData() {
    return this.UserData;
  }

  getIPAddress() {
    return this.http.get('https://api.ipify.org/?format=json');
  }

  testConnection() {
    return this.http.get<any>(`${this.BaseURL}test`, { observe: 'response' });
  }

  initializeProject(version: any) {
    const data = {
      ProductVersion: version,
    };
    return this.http.post(`${this.BaseURL}CustomerInfo/getinfo`, data);
  }

  logIn(username: any, password: any, forcelogin: any) {
    const API_URL = `${this.BaseURL}user/LOGIN`;
    const currentUTCDateTime = new Date().toISOString();
    const ReqBody = {
      LoginName: username,
      Password: password,
      LocalIP: '192.168.1.143',
      ComputerName: 'System1',
      DomainName: 'Domain1',
      ComputerUser: 'User1',
      InternetIP: '192.158.1.38',
      SystemTimeUTC: currentUTCDateTime,
      ForceLogin: forcelogin,
    };

    return this.http.post<any>(API_URL, ReqBody);
  }

  setupGoogleAuth(userId: number) {
    return this.http.get<any>(
      `${this.BaseURL}user/setup-google-auth?userId=${userId}`,
    );
  }

  verifyGoogleAuth(userId: number, code: string) {
    return this.http.post<any>(
      `${this.BaseURL}user/verify-google-auth?userId=${userId}&code=${code}`,
      {},
    );
  }

  resetGoogleAuth(userId: number) {
    return this.http.post<any>(
      `${this.BaseURL}user/reset-google-auth?userId=${userId}`,
      {},
    );
  }

  getMenuData() {
    return this.menuData.asObservable();
  }

  isLoggedIn() {
    return this.loggedin.asObservable();
  }

  async getUser() {
    try {
      return {
        isOk: true,
        data: this._user,
      };
    } catch {
      return {
        isOk: false,
        data: null,
      };
    }
  }

  async createAccount(email: string, password: string) {
    try {
      this.router.navigate(['/auth/create-account']);
      return {
        isOk: true,
      };
    } catch {
      return {
        isOk: false,
        message: 'Failed to create account',
      };
    }
  }

  async changePassword(email: string, recoveryCode: string) {
    try {
      return {
        isOk: true,
      };
    } catch {
      return {
        isOk: false,
        message: 'Failed to change password',
      };
    }
  }

  async resetPassword(email: string) {
    try {
      return {
        isOk: true,
      };
    } catch {
      return {
        isOk: false,
        message: 'Failed to reset password',
      };
    }
  }

  validateOtp(userId: any, otp: string, sessionId?: any, token?: string) {
    const API_URL = `${this.BaseURL}user/validateotp`;
    const ReqBody: any = {
      UserID: userId,
      Otp: otp,
      SessionID: sessionId,
    };
    const authToken = token || sessionStorage.getItem('AuthToken');
    const headers = authToken
      ? new HttpHeaders({ Authorization: `Bearer ${authToken}` })
      : undefined;

    return this.http.post<any>(API_URL, ReqBody, { headers });
  }

  resendOtp(userId: any, sessionId: any, token?: string) {
    const API_URL = `${this.BaseURL}user/Resendotp`;
    const ReqBody = {
      UserID: userId,
      SessionID: sessionId,
    };
    const authToken = token || sessionStorage.getItem('AuthToken');
    const headers = authToken
      ? new HttpHeaders({ Authorization: `Bearer ${authToken}` })
      : undefined;

    return this.http.post<any>(API_URL, ReqBody, { headers });
  }

  logOut() {
    const API_URL = `${this.BaseURL}user/logout`;
    const token = JSON.parse(localStorage.getItem('logData') || '{}')?.Token;
    const ReqBody = { Token: token };
    return this.http.post(API_URL, ReqBody);
  }

  handleSessionExpired(customMessage?: string) {
    const inactivityService = this.injector.get(InactivityService);
    inactivityService.handleSessionExpired(customMessage);
  }
}

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.authService.isTokenValid;

    const isAuthForm = [
      'login',
      'reset-password',
      'create-account',
      'change-password/:recoveryCode',
      'two-step-verification',
    ].includes(route.routeConfig?.path || defaultPath);

    if (!isLoggedIn && !isAuthForm) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (isLoggedIn && isAuthForm) {
      this.router.navigate(['/Home'], { replaceUrl: true });
      return false;
    }

    if (isLoggedIn && !isAuthForm) {
      const requestedPath = (route.routeConfig?.path || '')
        .toLowerCase()
        .replace(/^\/+/, '')
        .trim();

      const logData =
        this.authService.getUserData() ||
        JSON.parse(localStorage.getItem('logData') || '{}');
      const userRoleId = Number(
        logData?.UserRoleID ??
          logData?.userRoleID ??
          logData?.UserRoleId ??
          logData?.userRoleId
      );

      // If user is restricted (userRoleId === 2), enforce strict page access
      if (userRoleId === 2) {
        if (requestedPath === 'analytics-dashboard') {
          this.router.navigate(['/Home'], { replaceUrl: true });
          return false;
        }

        const alwaysAllowed = ['home', 'change-password', 'about', ''];
        if (!alwaysAllowed.includes(requestedPath)) {
          const rawMenu = localStorage.getItem('sidemenuItems');
          const menuItems: any[] = rawMenu ? JSON.parse(rawMenu) : [];
          const assignedPaths = this.extractAssignedPaths(menuItems);

          if (!assignedPaths.includes(requestedPath)) {
            this.router.navigate(['/Home'], { replaceUrl: true });
            return false;
          }
        }
      }

      this.authService.lastAuthenticatedPath =
        route.routeConfig?.path || defaultPath;
    }

    return true;
  }

  private extractAssignedPaths(items: any[]): string[] {
    let paths: string[] = [];
    if (!Array.isArray(items)) return paths;
    for (const item of items) {
      if (item?.path) {
        paths.push(String(item.path).toLowerCase().replace(/^\/+/, '').trim());
      }
      if (Array.isArray(item?.items) && item.items.length > 0) {
        paths = paths.concat(this.extractAssignedPaths(item.items));
      }
    }
    return paths;
  }
}
