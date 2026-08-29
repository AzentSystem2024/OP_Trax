import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import notify from 'devextreme/ui/notify';
import { confirm, custom } from 'devextreme/ui/dialog';
import { SystemServicesService } from '../pages/SYSTEM PAGES/system-services.service';
import { SharedServiceService } from './shared-service.service';
import { ReuseStrategyService } from '../reuse-strategy.service';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {
  isUserLoggedIn: any;
  private timeoutId: any;
  inactivityTimeout: any = 15 * 60000;
  private apiInProgress = false;
  private isSessionExpiredShowing = false;
  isManualLogout = false;

  constructor(
    private authservice: AuthService,
    private ngZone: NgZone,
    private router: Router,
    private systemservice: SystemServicesService,
    private sharedService: SharedServiceService,
    private reuseStrategyService: ReuseStrategyService
  ) {
    this.setupStorageListener();
  }

  // Called by interceptor
  setApiInProgress(status: boolean) {
    this.apiInProgress = status;

    if (status) {
      this.resetTimer();
    }
  }

  startTheInactiveService() {
    this.isManualLogout = false;
    this.get_securityPolicy_List();
  }

  // Fetch session timeout duration
  get_securityPolicy_List() {
    const userid = sessionStorage.getItem('UserID');
    if (!userid) return;
    this.systemservice
      .get_securityPolicy_List(userid)
      .subscribe((response: any) => {
        if (response && response.data && response.data.length > 0) {
          const presentSecurityData = response.data[0];
          const minutes = Number(presentSecurityData?.SessionTimeoutMinutes);
          this.inactivityTimeout =
            minutes && minutes > 0 ? minutes * 60000 : 15 * 60000;
          this.isUserLoggedIn = true;
          this.startWatching();
          this.setupEvents();
        } else {
          this.inactivityTimeout = 15 * 60000;
          this.isUserLoggedIn = true;
          this.startWatching();
          this.setupEvents();
        }
      });
  }

  // Flip login state
  setUserlogginValue() {
    this.isUserLoggedIn = !this.isUserLoggedIn;
  }

  startWatching() {
    this.resetTimer();
  }

  stopWatching() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isUserLoggedIn = false;
  }

  // Handle expired token or superseded session (e.g. from force login)
  handleSessionExpired(customMessage?: string) {
    if (this.isSessionExpiredShowing || this.isManualLogout) {
      return;
    }

    if (
      this.router.url.includes('/auth/login') ||
      this.router.url.includes('/auth/')
    ) {
      return;
    }

    this.isSessionExpiredShowing = true;
    this.stopWatching();

    if (this.sharedService) {
      this.sharedService.triggerLoadComponent(false);
    }
    if (this.reuseStrategyService) {
      this.reuseStrategyService.clearHandlers();
    }

    // Clear storage immediately so page refresh or guard will see logged out state
    localStorage.removeItem('sidemenuItems');
    localStorage.removeItem('logData');
    localStorage.removeItem('Token');
    localStorage.clear();
    sessionStorage.clear();

    const message =
      customMessage ||
      'Your session has expired because you logged in from another device. Please log in again to continue.';

    this.ngZone.run(() => {
      const dialog = custom({
        title: 'Session Expired',
        message: message,
        buttons: [
          {
            text: 'OK',
            onClick: () => true,
          },
        ],
      });

      dialog.show().then(() => {
        this.isSessionExpiredShowing = false;
        this.router.navigate(['/auth/login']).then(() => {
          setTimeout(() => window.location.reload(), 250);
        });
      });
    });
  }

  // Auto logout
  logout() {
    if (this.isManualLogout) {
      return;
    }

    const doCleanupAndPrompt = () => {
      this.stopWatching();
      if (this.sharedService) {
        this.sharedService.triggerLoadComponent(false);
      }
      if (this.reuseStrategyService) {
        this.reuseStrategyService.clearHandlers();
      }

      localStorage.removeItem('sidemenuItems');
      localStorage.clear();
      sessionStorage.clear();

      const dialog = custom({
        title: 'Session Timeout',
        message: 'Your session has timed out. Please log in to continue.',
        buttons: [
          {
            text: 'OK',
            onClick: () => true,
          },
        ],
      });

      dialog.show().then(() => {
        this.router.navigate(['/auth/login']).then(() => {
          setTimeout(() => window.location.reload(), 250);
        });
      });
    };

    // Call logout API, but clean up regardless of success or error (e.g. if token already expired)
    this.authservice.logOut().subscribe({
      next: () => doCleanupAndPrompt(),
      error: () => doCleanupAndPrompt(),
    });
  }

  // Reset inactivity timer
  resetTimer() {
    if (this.isManualLogout) {
      return;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (this.isUserLoggedIn && !this.apiInProgress) {
        this.ngZone.run(() => this.logout());
      } else {
        this.resetTimer();
      }
    }, this.inactivityTimeout);
  }

  // User activity events
  setupEvents() {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, () => this.resetTimer());
    });
  }

  // Listen for storage events (e.g. force login or logout in another tab/window)
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (
        this.isManualLogout ||
        this.router.url.includes('/auth/login') ||
        this.router.url.includes('/auth/')
      ) {
        return;
      }

      const currentToken = sessionStorage.getItem('AuthToken');
      if (!currentToken) {
        return;
      }

      if (event.key === 'Token' || event.key === 'logData') {
        let newToken = event.newValue;
        if (newToken) {
          try {
            newToken = JSON.parse(newToken);
          } catch {}
        }

        if (newToken && currentToken !== newToken) {
          this.handleSessionExpired(
            'Your session has expired because this account was logged in on another window or device. Please log in again.'
          );
        } else if (!newToken && !localStorage.getItem('Token')) {
          this.handleSessionExpired(
            'You have logged out from another window. Please log in again.'
          );
        }
      } else if (event.key === null && !localStorage.getItem('Token')) {
        this.handleSessionExpired(
          'You have logged out from another window. Please log in again.'
        );
      }
    });
  }
}
