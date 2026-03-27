/*
 * =====================================================
 * 檔案名稱：customer-loading.component.ts
 * 位置說明：src/app/shared/customer-loading/customer-loading.component.ts
 * 用途說明：切換到客戶入口時顯示的 Loading 過場動畫元件（v4 分割卡片版本）
 * 設計風格：暖橘奶油配色（setting.md 客戶端方案）
 * 版面說明：
 *   左側橘色漸層面板 → 品牌 Logo + 中文名稱 + 英文名稱 + 標語徽章
 *   右側純白面板     → Lottie 食物動畫 + CSS 進度條 + 跳動點點
 * 動畫說明：
 *   GSAP           → 遮罩淡入 + 卡片從下方彈出（彈性效果）
 *   dotlottie-wc   → 右側食物主題 .lottie 動畫（LottieFiles 官方 Web Component，CDN 載入）
 *   CSS @keyframes → 進度條填滿（1.4 秒）+ 點點上下跳動
 * Angular 知識點：
 *   AfterViewInit → DOM 渲染完成後才能操作真實的 DOM 元素
 *   @ViewChild    → 取得 HTML 模板中標記了 #變數名 的 DOM 元素
 *   ElementRef    → 包裝 DOM 元素的 Angular 型別，用 .nativeElement 取得原生元素
 * =====================================================
 */

import { Component, ElementRef, ViewChild, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

/* GSAP 動畫引擎 */
import { gsap } from 'gsap';

@Component({
  selector: 'app-customer-loading',      /* HTML 標籤：<app-customer-loading> */
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],     /* 允許使用 <dotlottie-wc> 等非 Angular 的 Web Component 標籤 */
  imports: [],
  templateUrl: './customer-loading.component.html',
  styleUrls: ['./customer-loading.component.scss']
})
export class CustomerLoadingComponent implements AfterViewInit {

  /* 取得全螢幕遮罩的 DOM 元素（GSAP 淡入用） */
  @ViewChild('overlay') overlay!: ElementRef;

  /* 取得分割卡片的 DOM 元素（GSAP 彈出用） */
  @ViewChild('card') card!: ElementRef;


  /*
   * ngAfterViewInit：DOM 渲染完畢後執行
   * 在這裡才能安全地操作 DOM（@ViewChild 的元素才會有值）
   * ① GSAP 遮罩與卡片入場動畫
   * ② lottie-web 初始化播放動畫
   */
  ngAfterViewInit(): void {

    /* ① GSAP：遮罩在 0.4 秒內從透明淡入到完全不透明 */
    gsap.from(this.overlay.nativeElement, {
      duration: 0.4,
      opacity: 0,
      ease: 'power2.out'
    });

    /*
     * GSAP：卡片從下方 40px 位置彈出
     * elastic.out(1, 0.5)：模擬彈力球，落下後有自然回彈感
     * scale: 0.92 → 同時有微縮放放大的效果
     * delay: 0.1  → 比遮罩晚 0.1 秒出現，視覺層次更分明
     */
    gsap.from(this.card.nativeElement, {
      duration: 0.7,
      opacity: 0,
      y: 40,
      scale: 0.92,
      ease: 'elastic.out(1, 0.5)',
      delay: 0.1
    });

    /*
     * Lottie 動畫由 HTML 的 <dotlottie-wc> Web Component 負責播放，
     * 不需要在 TypeScript 這裡做任何初始化。
     */

  }

}
