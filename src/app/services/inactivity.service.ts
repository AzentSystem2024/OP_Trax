import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import notify from 'devextreme/ui/notify';
import { confirm, custom } from 'devextreme/ui/dialog';
import { SystemServicesService } from '../pages/SYSTEM PAGES/system-services.service';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {
  isUserLoggedIn: any;
  private timeoutId: any;
  inactivityTimeout: any;
  private apiInProgress = false;

  constructor(
    private authservice: AuthService,
    private ngZone: NgZone,
    private router: Router,
    private systemservice: SystemServicesService
  ) {}

  // Called by interceptor
  setApiInProgress(status: boolean) {
    this.apiInProgress = status;

    if (status) {
      this.resetTimer();
    }
  }

  startTheInactiveService() {
    this.get_securityPolicy_List();
  }

  // Fetch session timeout duration
  get_securityPolicy_List() {
    const userid = sessionStorage.getItem('UserID');
    this.systemservice
      .get_securityPolicy_List(userid)
      .subscribe((response: any) => {
        if (response) {
          const presentSecurityData = response.data[0];
          this.inactivityTimeout =
            presentSecurityData.SessionTimeoutMinutes * 60000;
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

  // Auto logout
  logout() {

  // Call logout API only once
  this.authservice.logOut().subscribe(() => {

    // Clear storage immediately so refresh logs out
    localStorage.removeItem('sidemenuItems');
    localStorage.clear();
    sessionStorage.clear();
    this.setUserlogginValue();

    // Show popup AFTER clearing
    const dialog = custom({
      title: 'Session Timeout',
      message: 'Your session has timed out. Please log in to continue.',
      buttons: [
        {
          text: 'OK',
          onClick: () => {
            // No second logout API call needed
            this.router.navigate(['/auth/login']).then(() => {
              setTimeout(() => window.location.reload(), 250);
            });
          }
        }
      ]
    });

    dialog.show();
  });
}


  // Reset inactivity timer
  resetTimer() {
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
}
