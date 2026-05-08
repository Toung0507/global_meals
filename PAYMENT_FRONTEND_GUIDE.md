# 前端 ECPay & LINE Pay 整合指南 - 支付按鈕和流程

> **支援版本：** Angular 17+  
> **後端基礎 URL：** `http://localhost:8080/lazybaobao`（本機）  
> **生產環境 URL：** `https://ngrok-url.ngrok-free.dev/lazybaobao`  

---

## 📋 概述

本指南說明如何在 Angular 前端實現：
1. **支付方式選擇**（現金、ECPay、LINE Pay）
2. **支付按鈕流程**（調用後端 `/goPay` 端點）
3. **支付成功/失敗處理**（接收後端重定向）

---

## 🎯 核心實現步驟

### Step 1：在 API Service 中添加支付端點

編輯 `src/app/shared/api.service.ts`：

```typescript
export class ApiService {
  // ... 現有代碼 ...

  /**
   * 前往支付頁面（ECPay 或 LINE Pay）
   */
  goToPay(orderDateId: string, id: string, way: string): void {
    const payUrl = `${this.baseUrl}/orders/goPay?orderDateId=${orderDateId}&id=${id}&way=${way}`;
    window.location.href = payUrl; // 直接重定向
  }
}
```

### Step 2：在支付組件中實現支付邏輯

編輯 `src/app/mobile-pay/mobile-pay.component.ts`：

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-mobile-pay',
  templateUrl: './mobile-pay.component.html',
  styleUrls: ['./mobile-pay.component.scss']
})
export class MobilePayComponent implements OnInit {

  orderDateId: string = ''; // 訂單日期，例如 20260505
  orderId: string = '';     // 訂單編號，例如 0001
  
  // 支付方式選項
  paymentMethods = [
    { label: '現場現金付款', value: 'CASH' },
    { label: '綠界信用卡', value: 'ECPAY' },
    { label: 'LINE Pay', value: 'LINEPAY' }
  ];
  
  selectedPaymentMethod: string = 'CASH';
  isProcessing: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 從路由參數或 session 中取得訂單資訊
    // 例如：this.orderDateId = history.state?.orderDateId || '20260505';
  }

  /**
   * 執行支付
   */
  proceedToPayment(): void {
    if (!this.orderDateId || !this.orderId) {
      alert('缺少訂單資訊');
      return;
    }

    this.isProcessing = true;

    try {
      switch (this.selectedPaymentMethod) {
        case 'CASH':
          // 現金支付：直接調用後端 pay API
          this.payCash();
          break;
        case 'ECPAY':
          // 綠界支付：跳轉至支付頁面
          this.apiService.goToPay(this.orderDateId, this.orderId, 'ECPAY');
          break;
        case 'LINEPAY':
          // LINE Pay：跳轉至支付頁面
          this.apiService.goToPay(this.orderDateId, this.orderId, 'LINEPAY');
          break;
        default:
          alert('不支持的支付方式');
      }
    } catch (error) {
      console.error('支付失敗：', error);
      alert('支付失敗，請重試');
      this.isProcessing = false;
    }
  }

  /**
   * 現金支付
   */
  payCash(): void {
    const payReq = {
      id: this.orderId,
      orderDateId: this.orderDateId,
      paymentMethod: 'CASH',
      transactionId: 'CASH_PAYMENT'
    };

    // 調用後端 pay API
    this.apiService.pay(payReq).subscribe(
      (response: any) => {
        if (response.code === 200) {
          alert('現金支付完成！');
          this.router.navigate(['/payment-result', { status: 'success' }]);
        } else {
          alert('支付失敗：' + response.message);
        }
        this.isProcessing = false;
      },
      (error) => {
        console.error('支付 API 錯誤：', error);
        alert('支付失敗，請重試');
        this.isProcessing = false;
      }
    );
  }
}
```

### Step 3：HTML 模板

編輯 `src/app/mobile-pay/mobile-pay.component.html`：

```html
<div class="payment-container">
  <h2>選擇支付方式</h2>

  <!-- 支付方式選擇 -->
  <div class="payment-methods">
    <div *ngFor="let method of paymentMethods" class="method-option">
      <input 
        type="radio" 
        [id]="method.value"
        [value]="method.value"
        [(ngModel)]="selectedPaymentMethod"
        [disabled]="isProcessing"
      >
      <label [for]="method.value">{{ method.label }}</label>
    </div>
  </div>

  <!-- 訂單摘要 -->
  <div class="order-summary">
    <h3>訂單摘要</h3>
    <p><strong>訂單編號：</strong> {{ orderDateId }}-{{ orderId }}</p>
    <p><strong>總金額：</strong> NT$ {{ totalAmount | number: '1.2-2' }}</p>
  </div>

  <!-- 支付按鈕 -->
  <button 
    class="payment-btn"
    (click)="proceedToPayment()"
    [disabled]="isProcessing || !selectedPaymentMethod"
  >
    <span *ngIf="!isProcessing">前往{{ getPaymentMethodLabel() }}支付</span>
    <span *ngIf="isProcessing">處理中...</span>
  </button>
</div>
```

### Step 4：支付結果頁面

編輯 `src/app/payment-result/payment-result.component.ts`：

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.scss']
})
export class PaymentResultComponent implements OnInit {

  status: 'success' | 'failure' = 'success';
  message: string = '';
  orderNumber: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 取得路由參數
    this.route.params.subscribe(params => {
      this.status = params['status'] === 'success' ? 'success' : 'failure';
      this.message = params['message'] || 
        (this.status === 'success' ? '支付成功！' : '支付失敗，請重試');
      this.orderNumber = params['orderNumber'] || '';
    });
  }

  /**
   * 返回首頁
   */
  goHome(): void {
    this.router.navigate(['/customer-home']);
  }

  /**
   * 查詢訂單狀態
   */
  checkOrderStatus(): void {
    if (this.orderNumber) {
      this.router.navigate(['/order-detail', this.orderNumber]);
    }
  }
}
```

### Step 5：HTML 模板

編輯 `src/app/payment-result/payment-result.component.html`：

```html
<div class="payment-result-container" [class.success]="status === 'success'" [class.failure]="status === 'failure'">
  
  <!-- 成功圖示 -->
  <div *ngIf="status === 'success'" class="result-icon success">
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#4CAF50"/>
      <path d="M 30 50 L 45 65 L 75 35" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>
  </div>

  <!-- 失敗圖示 -->
  <div *ngIf="status === 'failure'" class="result-icon failure">
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#F44336"/>
      <path d="M 35 35 L 65 65 M 65 35 L 35 65" stroke="white" stroke-width="4" stroke-linecap="round"/>
    </svg>
  </div>

  <!-- 訊息 -->
  <h2>{{ message }}</h2>

  <!-- 訂單編號 -->
  <p *ngIf="orderNumber" class="order-number">
    訂單編號：<strong>{{ orderNumber }}</strong>
  </p>

  <!-- 操作按鈕 -->
  <div class="action-buttons">
    <button class="btn-primary" (click)="goHome()">返回首頁</button>
    <button *ngIf="status === 'success'" class="btn-secondary" (click)="checkOrderStatus()">
      查詢訂單狀態
    </button>
  </div>

  <!-- 支援信息 -->
  <div class="support-info">
    <p *ngIf="status === 'failure'">
      如果您的帳戶已被扣款但此頁面顯示失敗，請 <a href="#">聯絡客服</a>
    </p>
  </div>
</div>
```

---

## 🔗 後端支付流程詳解

### ECPay 流程圖

```
前端用戶
  ↓ 點擊「綠界支付」
用戶瀏覽器
  ↓ GET /orders/goPay?way=ECPAY
Spring Boot 後端
  ↓ EcpayService.getEcpayForm()
  → 讀取訂單
  → 生成簽章
  → 返回 HTML Form
用戶瀏覽器
  ↓ 自動提交 Form 至綠界
綠界支付頁面
  ↓ 用戶輸入信用卡資訊並確認
用戶瀏覽器
  ↓ 提交至綠界伺服器
綠界伺服器
  ↓ 驗證交易
  ↓ POST 回調至 https://your-ngrok-url/orders/payment/callback
Spring Boot 後端
  ↓ OrdersController.handlePaymentNotify()
  → 驗證簽章
  → 更新訂單狀態為 PAID
  → 回傳 "1|OK"
綠界伺服器
  ↓ 確認收到
用戶瀏覽器
  ↓ 重定向至 OrderResultURL（後端配置）
用戶看到成功頁面
```

### LINE Pay 流程圖

```
前端用戶
  ↓ 點擊「LINE Pay」
用戶瀏覽器
  ↓ GET /orders/goPay?way=LINEPAY
Spring Boot 後端
  ↓ LinePayService.getLinePayLink()
  → 讀取訂單
  → POST 至 LINE Pay API（發起支付）
  → 計算簽章並設定 Header
LINE Pay 伺服器
  ↓ 驗證請求
  ↓ 回傳支付連結（webPaymentUrl）
Spring Boot 後端
  ↓ 返回 RedirectView(paymentUrl)
用戶瀏覽器
  ↓ HTTP 302 重定向至 LINE Pay
LINE Pay 支付頁面
  ↓ 用戶掃 QR Code 或在手機 LINE 確認
用戶的手機 (LINE App)
  ↓ 完成支付確認
LINE Pay 伺服器
  ↓ 重定向至 confirmUrl
  ↓ GET https://your-ngrok-url/orders/linepay/confirm?transactionId=xxx&...
Spring Boot 後端
  ↓ OrdersController.linePayConfirm()
  → LinePayService.confirmPayment()
    → POST Confirm API 至 LINE Pay
    → LINE Pay 回傳成功碼（0000）
  → OrdersService.pay()
    → 更新訂單狀態為 PAID
  → 返回 RedirectView 至前端成功頁面
用戶瀏覽器
  ↓ 重定向至成功頁面
用戶看到成功頁面
```

---

## 🛠️ API 服務更新

編輯 `src/app/shared/api.service.ts` 以支援支付 API：

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:8080/lazybaobao';

  constructor(private http: HttpClient) { }

  /**
   * 支付（現金、綠界、LINE Pay）
   */
  pay(req: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders/pay`, req);
  }

  /**
   * 前往支付頁面（ECPay 或 LINE Pay）
   * 直接重定向，不需要 Observable
   */
  goToPay(orderDateId: string, id: string, way: string): void {
    const payUrl = `${this.baseUrl}/orders/goPay?orderDateId=${orderDateId}&id=${id}&way=${way}`;
    window.location.href = payUrl;
  }

  /**
   * 建立訂單
   */
  createOrder(req: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders/create_orders`, req);
  }

  /**
   * 取得訂單狀態
   */
  getOrderStatus(id: string, orderDateId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/order_status`, {
      params: { id, orderDateId }
    });
  }
}
```

---

## 🌐 環境變數設定

編輯 `src/environments/environment.ts`（開發環境）：

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/lazybaobao',
  // 支付相關配置（由後端提供）
  payment: {
    ecpay: {
      testMode: true,
      returnUrl: 'http://localhost:4200/payment-result?status=success'
    },
    linepay: {
      testMode: true,
      cancelUrl: 'http://localhost:4200/payment-result?status=failure'
    }
  }
};
```

編輯 `src/environments/environment.prod.ts`（生產環境）：

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/lazybaobao',
  payment: {
    ecpay: {
      testMode: false,
      returnUrl: 'https://your-domain.com/payment-result?status=success'
    },
    linepay: {
      testMode: false,
      cancelUrl: 'https://your-domain.com/payment-result?status=failure'
    }
  }
};
```

---

## 📱 支付流程測試

### 測試 ECPay

```bash
# 1. 創建訂單
POST /lazybaobao/orders/create_orders
Body: { ... 訂單資訊 ... }
Response: { id: "0001", orderDateId: "20260505" }

# 2. 導航至支付頁面
GET /lazybaobao/orders/goPay?orderDateId=20260505&id=0001&way=ECPAY

# 3. 應看到綠界支付頁面，可在測試環境使用信用卡號：
# 卡號：4111111111111111
# 有效月年：01/25
# CVV：123

# 4. 支付成功後，綠界回調後端，後端重定向至 OrderResultURL
```

### 測試 LINE Pay

```bash
# 1. 建立訂單（同上）

# 2. 導航至支付頁面
GET /lazybaobao/orders/goPay?orderDateId=20260505&id=0001&way=LINEPAY

# 3. 應重定向至 LINE Pay 支付頁面，顯示 QR Code

# 4. 使用 LINE Pay 測試帳號掃 QR Code 完成支付

# 5. LINE Pay 回調後端，後端重定向至前端成功頁面
```

---

## 🔒 安全注意事項

### 不要在前端暴露敏感訊息

- ❌ **不要**把商店編號、Hash Key、Secret 等放在前端代碼
- ✅ **應該**由後端管理所有敏感配置
- ✅ 前端只需調用後端的 `/goPay` 端點

### HTTPS 和 ngrok

- 開發環境使用 ngrok 時，注意 URL 可能包含隨機字符
- 每次重啟 ngrok 都要更新後端配置
- 生產環境必須使用 HTTPS

### Cookie 和 CORS

- 後端 WebConfig 已配置允許跨域請求
- 支援 ngrok 自由域名（`*.ngrok-free.dev`）
- 允許攜帶憑證（Session）

---

## 📚 相關文件

- [後端整合指南](./PAYMENT_INTEGRATION_GUIDE.md)
- [後端驗證清單](./PAYMENT_VERIFICATION_CHECKLIST.md)
- [API 完整規劃](./API_完整串接規劃.md)

---

**✅ 前端支付流程整合完成！**
