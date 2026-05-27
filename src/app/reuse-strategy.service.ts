import { Injectable } from '@angular/core';
import { DetachedRouteHandle } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ReuseStrategyService {
  private handlers: { [key: string]: DetachedRouteHandle } = {};
  private reuseWhitelist: Set<string> = new Set();

  storeHandler(routePath: string, handle: DetachedRouteHandle): void {
    this.handlers[routePath] = handle;
  }

  getHandler(routePath: string): DetachedRouteHandle | null {
    return this.handlers[routePath] || null;
  }

  hasHandler(routePath: string): boolean {
    return !!this.handlers[routePath];
  }

  removeHandler(routePath: string): void {
    delete this.handlers[routePath];
  }

  clearHandlers(): void {
    this.handlers = {};
  }

  isReuseAllowed(path: string): boolean {
    return this.reuseWhitelist.has(path);
  }

  updateReuseWhitelist(tabs: any[]): void {
    this.reuseWhitelist = new Set(tabs.map((tab) => tab.path));
  }
}
