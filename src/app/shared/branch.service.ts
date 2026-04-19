import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type CountryCode = 'TW' | 'JP' | 'KR';

export interface CountryConfig {
  code: CountryCode;
  name: string;           /* 中文名稱 */
  nameLocal: string;      /* 在地語言名稱 */
  currency: string;       /* 貨幣符號 */
  primaryColor: string;
  hoverColor: string;
  bgColor: string;
  fontFamily: string;
  discountLimit: number;  /* 每筆訂單最高折扣金額（當地幣別） */
  dialCode: string;       /* 國際電話區碼，例 +886 */
}

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  TW: {
    code: 'TW',
    name: '台灣',
    nameLocal: '台灣',
    currency: 'NT$',
    primaryColor: '#D95C1A',
    hoverColor: '#A84210',
    bgColor: '#FFFAF3',
    fontFamily: "'Noto Sans TC', sans-serif",
    discountLimit: 200,
    dialCode: '+886',
  },
  JP: {
    code: 'JP',
    name: '日本',
    nameLocal: '日本',
    currency: '¥',
    primaryColor: '#B5451A',
    hoverColor: '#8C3212',
    bgColor: '#FAF7F2',
    fontFamily: "'Noto Sans JP', 'Noto Sans TC', sans-serif",
    discountLimit: 1000,
    dialCode: '+81',
  },
  KR: {
    code: 'KR',
    name: '韓國',
    nameLocal: '한국',
    currency: '₩',
    primaryColor: '#D94F2B',
    hoverColor: '#B03A1C',
    bgColor: '#FFF8F5',
    fontFamily: "'Noto Sans KR', 'Noto Sans TC', sans-serif",
    discountLimit: 10000,
    dialCode: '+82',
  },
};

@Injectable({ providedIn: 'root' })
export class BranchService {
  private doc = inject(DOCUMENT);

  private _country: CountryCode = (() => {
    try {
      const saved = localStorage.getItem('selectedCountry');
      return (saved === 'TW' || saved === 'JP' || saved === 'KR') ? saved : 'TW';
    } catch { return 'TW'; }
  })();

  get country(): CountryCode { return this._country; }
  get config(): CountryConfig { return COUNTRY_CONFIGS[this._country]; }
  get allCountries(): CountryConfig[] { return Object.values(COUNTRY_CONFIGS); }

  setCountry(code: CountryCode): void {
    this._country = code;
    try { localStorage.setItem('selectedCountry', code); } catch {}
    this.applyTheme(code);
  }

  applyTheme(code: CountryCode): void {
    const cfg = COUNTRY_CONFIGS[code];
    const root = this.doc.documentElement;
    root.style.setProperty('--brand-primary', cfg.primaryColor);
    root.style.setProperty('--brand-hover', cfg.hoverColor);
    root.style.setProperty('--brand-bg', cfg.bgColor);
    root.style.setProperty('--brand-currency', cfg.currency);
  }

  /* 在 App 啟動時呼叫一次，套用已儲存的主題 */
  init(): void {
    this.applyTheme(this._country);
  }
}
