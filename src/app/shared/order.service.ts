/*
 * =====================================================
 * 檔案名稱：order.service.ts
 * 位置說明：src/app/shared/order.service.ts
 * 用途說明：跨元件共享的即時訂單狀態服務
 * 功能說明：
 *   - 維護全部進行中訂單（Signal 驅動）
 *   - 提供依狀態分組的 computed 訂閱
 *   - customer-home 下單 → POS 看板即時同步
 *   - POS 更新狀態 → customer-home 追蹤即時同步
 * =====================================================
 */

import { Injectable, signal, computed } from '@angular/core';

/* ── 訂單狀態型別 ───────────────────────────────────── */
export type OrderStatus =
  | 'pending-cash'
  | 'waiting'
  | 'cooking'
  | 'ready'
  | 'done'
  | 'cancelled'
  | 'paid';

/* ── 即時訂單型別 ───────────────────────────────────── */
export interface LiveOrder {
  id: string;
  number: string;
  status: OrderStatus;
  estimatedMinutes: number;
  items: string[];
  total: number;
  createdAt: string;
  payMethod: string;
  source: 'pos' | 'customer';
  customerName?: string;
  orderType?: string; /* '內用' | '外帶'，POS 下單時帶入 */
  note?: string; /* 備註，選填 */
  isCash?: boolean; // ← 新增，供追蹤頁判斷顯示 3 或 4 步
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  /* ── 全部訂單（含歷史） ─────────────────────────── */
  private _orders = signal<LiveOrder[]>([
    /* 預設假資料：模擬分店目前進行中訂單 */
    {
      id: 'LBB-INIT-049',
      number: '20260424-0049',
      status: 'waiting',
      estimatedMinutes: 10,
      items: ['招牌滷肉飯 × 1', '黑糖珍珠奶茶 × 2'],
      total: 270,
      createdAt: '13:45',
      payMethod: '現金',
      source: 'pos',
    },
    {
      id: 'LBB-INIT-050',
      number: '20260424-0050',
      status: 'waiting',
      estimatedMinutes: 8,
      items: ['蚵仔麵線 × 1', '招牌滷蛋 × 2'],
      total: 130,
      createdAt: '13:52',
      payMethod: '信用卡',
      source: 'pos',
    },
    {
      id: 'LBB-INIT-047',
      number: '20260424-0047',
      status: 'cooking',
      estimatedMinutes: 8,
      items: ['古早味排骨飯 × 2', '仙草奶茶 × 1'],
      total: 355,
      createdAt: '13:38',
      payMethod: '行動支付',
      source: 'pos',
    },
    {
      id: 'LBB-INIT-046',
      number: '20260424-0046',
      status: 'done',
      estimatedMinutes: 0,
      items: ['三杯雞飯 × 1', '仙草奶茶 × 1'],
      total: 215,
      createdAt: '13:20',
      payMethod: '現金',
      source: 'pos',
    },
    {
      id: 'LBB-INIT-045',
      number: '20260424-0045',
      status: 'done',
      estimatedMinutes: 0,
      items: ['蚵仔煎 × 2', '黑糖珍珠奶茶 × 1'],
      total: 235,
      createdAt: '13:05',
      payMethod: '現金',
      source: 'pos',
    },
  ]);

  /* ── 跨 Tab 同步（BroadcastChannel） ───────────── */
  private _bc = new BroadcastChannel('lbb-order-sync');

  constructor() {
    this._bc.onmessage = ({ data }) => {
      if (data?.type === 'ADD_ORDER') {
        const order: LiveOrder = data.order;
        this._orders.update((list) =>
          list.find((o) => o.id === order.id) ? list : [order, ...list],
        );
      } else if (data?.type === 'UPDATE_STATUS') {
        this._orders.update((list) =>
          list.map((o) =>
            o.id === data.id ? { ...o, status: data.status as OrderStatus } : o,
          ),
        );
      }
    };
  }

  /* ── 唯讀訂單串流 ───────────────────────────────── */
  readonly orders = this._orders.asReadonly();

  /* ── 依狀態分組（供看板使用） ───────────────────── */
  pendingCash = computed(() =>
    this._orders().filter((o) => o.status === 'pending-cash'),
  );
  waiting = computed(() =>
    this._orders().filter((o) => o.status === 'waiting'),
  );
  cooking = computed(() =>
    this._orders().filter((o) => o.status === 'cooking'),
  );
  ready = computed(() => this._orders().filter((o) => o.status === 'ready'));
  done = computed(() => this._orders().filter((o) => o.status === 'done'));
  paid = computed(() => this._orders().filter((o) => o.status === 'paid'));

  /* ── 最新一筆客戶端訂單（供追蹤頁） ────────────── */
  latestCustomerOrder = computed<LiveOrder | null>(() => {
    const list = this._orders().filter((o) => o.source === 'customer');
    return list.length > 0 ? list[0] : null;
  });

  /* ── 新增訂單 ───────────────────────────────────── */
  addOrder(order: LiveOrder): void {
    this._orders.update((list) => [order, ...list]);
    this._bc.postMessage({ type: 'ADD_ORDER', order });
  }

  /* ── 更新訂單狀態 ───────────────────────────────── */
  updateStatus(id: string, status: OrderStatus): void {
    this._orders.update((list) =>
      list.map((o) => (o.id === id ? { ...o, status } : o)),
    );
    this._bc.postMessage({ type: 'UPDATE_STATUS', id, status });
  }

  updatePayMethod(id: string, payMethod: string): void {
    this._orders.update((list) =>
      list.map((o) => (o.id === id ? { ...o, payMethod } : o)),
    );
  }

  updatePayMethodAndCash(id: string, payMethod: string, isCash: boolean): void {
    this._orders.update((list) =>
      list.map((o) => (o.id === id ? { ...o, payMethod, isCash } : o)),
    );
  }

  updateItems(id: string, items: string[]): void {
    this._orders.update((list) =>
      list.map((o) => (o.id === id ? { ...o, items } : o)),
    );
  }

  removeOrder(id: string): void {
    this._orders.update((list) => list.filter((o) => o.id !== id));
  }

  /* ── 產生下一個訂單號（格式：YYYYMMDD-XXXX）──────── */
  generateOrderNumber(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

    const nums = this._orders().map((o) => {
      const m = o.number.match(/\d{8}-(\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 50;
    return `${dateStr}-${String(max + 1).padStart(4, '0')}`;
  }

  /* ── 產生訂單 ID ────────────────────────────────── */
  generateOrderId(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    return `LBB-${dateStr}-${String(Date.now()).slice(-4)}`;
  }
}
