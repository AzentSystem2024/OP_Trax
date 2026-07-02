import { Component, HostBinding, OnDestroy, HostListener } from '@angular/core';
import { environment } from '../environments/environment';
import {
  AppInfoService,
  AuthService,
  ScreenService,
  ThemeService,
} from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes)
      .filter((cl) => this.screen.sizes[cl])
      .join(' ');
  }

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private screen: ScreenService,
    public appInfo: AppInfoService,
  ) {
    themeService.setAppTheme();
  }

  isAuthenticated() {
    return this.authService.loggedIn;
  }

  ngOnDestroy(): void {
    this.screen.breakpointSubscription.unsubscribe();
  }

  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: Event) {
    event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Prevent F12
    if (event.key === 'F12') {
      event.preventDefault();
    }
    // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    if (
      event.ctrlKey &&
      event.shiftKey &&
      (event.key === 'I' ||
        event.key === 'i' ||
        event.key === 'J' ||
        event.key === 'j' ||
        event.key === 'C' ||
        event.key === 'c')
    ) {
      event.preventDefault();
    }
    if (event.ctrlKey && (event.key === 'U' || event.key === 'u')) {
      event.preventDefault();
    }
    // Prevent Ctrl+A, Ctrl+C, Ctrl+X (except in inputs)
    if (
      event.ctrlKey &&
      (event.key === 'A' ||
        event.key === 'a' ||
        event.key === 'C' ||
        event.key === 'c' ||
        event.key === 'X' ||
        event.key === 'x')
    ) {
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault();
      }
    }
    // Prevent Screenshots (PrintScreen, Win+Shift+S, Mac Cmd+Shift+3/4/5)
    if (
      event.key === 'PrintScreen' ||
      (event.metaKey &&
        event.shiftKey &&
        (event.key === 's' ||
          event.key === 'S' ||
          event.key === '3' ||
          event.key === '4' ||
          event.key === '5'))
    ) {
      event.preventDefault();
      navigator.clipboard.writeText(''); // Attempt to clear clipboard
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
      event.preventDefault();
    }
  }

  @HostListener('document:copy', ['$event'])
  onCopy(event: ClipboardEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  }
}
