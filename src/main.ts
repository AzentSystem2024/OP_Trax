import themes from 'devextreme/ui/themes';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { config } from 'devextreme/common';
const licenseKey =
  'ewogICJmb3JtYXQiOiAxLAogICJjdXN0b21lcklkIjogImZmNzk3MGZkLWFhZTEtNDA0Ny04NjZjLTBiNTJjZDBiMTYwMiIsCiAgIm1heFZlcnNpb25BbGxvd2VkIjogMjQyCn0=.M/05hOpeaOk7Qme/AUGPz6hJfNjpNxzc+z4JoUFTC5ZIuGy4+KFYtpwc0jW0IptZL+o4+IMs1xt2cspaRMkVYAZtiuc4vGXfXYpmlxXPnG4ghgoJPHUn+OtZZf5YlFLj21lOYQ==';
config({
  licenseKey,
});

if (environment.production) {
  enableProdMode();
}

const configFile = environment.production
  ? '/assets/config.prod.json'
  : '/assets/config.dev.json';

fetch(configFile)
  .then((res) => res.json())
  .then((config) => {
    (window as any).__env = config;

    themes.initialized(() => {
      platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .catch((err) => console.error(err));
    });
  })
  .catch((err) => console.error('Config load failed', err));
