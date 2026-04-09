import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  /*
   * provideHttpClient() 是串接後端 API 的必要設定。
   * 加入後，ApiService 才能注入 HttpClient 發送 HTTP 請求。
   * ⚠ Demo 期間此設定不影響現有功能，屬預先佈局。
   */
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
  ]
};
