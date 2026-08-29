import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { InactivityService } from './inactivity.service';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(
    private authService: AuthService,
    private inactivityService: InactivityService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.startsWith('https://js.devexpress.com')) {
      return next.handle(req); // Skip authentication for these requests
    }

    const token = sessionStorage.getItem('AuthToken');
    let clonedReq = req;

    if (token) {
      clonedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    // Track requests
    this.activeRequests++;
    this.inactivityService.setApiInProgress(true);

    return next.handle(clonedReq).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          this.checkResponseBody(req, event.body);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleHttpError(req, error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.inactivityService.setApiInProgress(false);
        }
      })
    );
  }

  private isAuthOrPublicUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('user/login') ||
      lower.includes('user/logout') ||
      lower.includes('customerinfo/getinfo') ||
      lower.endsWith('/test') ||
      lower.includes('/test?') ||
      lower.includes('user/resendotp') ||
      lower.includes('user/validateotp')
    );
  }

  private handleHttpError(
    req: HttpRequest<any>,
    error: HttpErrorResponse
  ): void {
    if (
      this.isAuthOrPublicUrl(req.url) ||
      this.inactivityService.isManualLogout
    ) {
      return;
    }

    const currentToken = sessionStorage.getItem('AuthToken');
    if (!currentToken) {
      return;
    }

    if (error.status === 401 || error.status === 403) {
      const errorMsg =
        error.error?.message ||
        error.error?.Message ||
        'Your session has expired. You may have logged in on another device. Please log in again to continue.';

      this.inactivityService.handleSessionExpired(errorMsg);
    }
  }

  private checkResponseBody(req: HttpRequest<any>, body: any): void {
    if (
      !body ||
      typeof body !== 'object' ||
      this.isAuthOrPublicUrl(req.url) ||
      this.inactivityService.isManualLogout
    ) {
      return;
    }

    const currentToken = sessionStorage.getItem('AuthToken');
    if (!currentToken) {
      return;
    }

    const rawMessage = (body.message || body.Message || '').toString();
    const lowerMsg = rawMessage.toLowerCase();

    const isExplicitExpired =
      body.status === 401 ||
      body.statusCode === 401 ||
      lowerMsg.includes('token expired') ||
      lowerMsg.includes('session expired') ||
      lowerMsg.includes('token is invalid') ||
      lowerMsg.includes('invalid token') ||
      lowerMsg.includes('session is invalid') ||
      lowerMsg.includes('already logged in on another device');

    if (isExplicitExpired) {
      this.inactivityService.handleSessionExpired(
        rawMessage ||
          'Your session has expired because you have logged in from another device. Please log in again to continue.'
      );
    }
  }
}
