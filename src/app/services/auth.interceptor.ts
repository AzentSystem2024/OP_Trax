import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, Observable } from 'rxjs';
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

    // Temporarily avoid passing token (keep code for future use)
    if (token) {
      clonedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    // Track requests
    this.activeRequests++;
    this.inactivityService.setApiInProgress(true);

    return next.handle(clonedReq).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.inactivityService.setApiInProgress(false);
        }
      })
    );
  }
}
