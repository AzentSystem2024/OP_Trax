import { Injectable } from '@angular/core';

export interface IAppConfig {
  API_BASE_URL: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: IAppConfig | null = null;

  load(): Promise<void> {
    // If window.__env exists, use it
    if ((window as any).__env) {
      this.config = (window as any).__env;
      return Promise.resolve();
    }

    // Otherwise fetch the JSON
    return fetch('/assets/config.json')
      .then((res) => res.json())
      .then((config: IAppConfig) => {
        this.config = config;
        (window as any).__env = config;
      });
  }

  get apiBaseUrl(): string {
    if (!this.config) {
      console.error('Config not loaded yet!');
      return '';
    }
    return this.config.API_BASE_URL;
  }
}
