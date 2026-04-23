/*
 * =====================================================
 * 檔案名稱：customer-home.component.ts
 * 位置說明：src/app/customer-home/customer-home.component.ts
 * 用途說明：客戶端登入後的主頁框架（Shell）
 * 功能說明：
 *   - 底部導覽列（主頁 / 菜單 / 結帳 / 追蹤 / 訂單管理）
 *   - 登入保護守衛（未登入者自動跳回登入頁）
 *   - 購物車狀態管理（供菜單、結帳頁共用）
 *   - 頁籤切換狀態管理
 *   - 下單後透過 OrderService 即時推送至 POS 看板
 * =====================================================
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
// import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { LoadingService } from '../shared/loading.service';
import { OrderService, OrderStatus } from '../shared/order.service';
import { firstValueFrom } from 'rxjs';
import {
  ApiService,
  GetOrdersVo,
  CartSyncReq,
  CreateOrdersReq,
  PayReq,
  CartRemoveReq,
  CartClearReq,
  PromotionDetailVo,
} from '../shared/api.service';
import { DEMO_BASE_URL } from '../shared/demo.config';
import {
  BranchService,
  CountryCode,
  CountryConfig,
} from '../shared/branch.service';

/* ── 購物車品項型別 ─────────────────────────────────── */
export interface CartItem {
  id: number;
  name: string;
  nameEn: string;
  nameJP?: string;
  nameKR?: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  note?: string;
}

/* ── 菜單品項型別 ─────────────────────────────────────── */
export interface MenuItem {
  id: number;
  name: string;
  nameEn: string;
  nameJP?: string;
  nameKR?: string;
  price: number;
  image: string;
  category: string;
  categoryEn: string;
  description: string;
  descriptionJP?: string;
  descriptionKR?: string;
  isHot?: boolean;
  isNew?: boolean;
  stock: number;
}

/* ── 訂單追蹤型別 ─────────────────────────────────────── */
export interface TrackingOrder {
  id: string;
  number: string;
  status: 'pending-cash' | 'waiting' | 'cooking' | 'ready' | 'done' | 'cancelled';
  estimatedMinutes: number;
  items: string[];
  total: number;
  createdAt: string;
}

/* ── 頁籤型別 ──────────────────────────────────────────── */
export type TabId =
  | 'home'
  | 'menu'
  | 'checkout'
  | 'payment'
  | 'tracker'
  | 'orders'
  | 'promotions';

/* ── 頁籤定義型別 ──────────────────────────────────────── */
interface NavTab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss'],
})
export class CustomerHomeComponent implements OnInit, OnDestroy {
  /* ── 當前頁籤 ───────────────────────────────────────── */
  activeTab = signal<TabId>('home');

  /* ── 首頁輪播 ───────────────────────────────────────── */
  heroSlideIndex = signal(0);
  readonly HERO_SLIDE_COUNT = 3;
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private heroPaused = false;

  /* ── 促銷橫幅輪播 ────────────────────────────────────── */
  promoBannerIndex = signal(0);
  private promoBannerTimer: ReturnType<typeof setInterval> | null = null;

  prevHeroSlide(): void {
    this.heroSlideIndex.update(
      (i) => (i - 1 + this.HERO_SLIDE_COUNT) % this.HERO_SLIDE_COUNT,
    );
  }

  nextHeroSlide(): void {
    this.heroSlideIndex.update((i) => (i + 1) % this.HERO_SLIDE_COUNT);
  }

  goToHeroSlide(index: number): void {
    this.heroSlideIndex.set(index);
  }

  pauseCarousel(): void {
    this.heroPaused = true;
  }

  resumeCarousel(): void {
    this.heroPaused = false;
  }

  /* ── 購物車 ─────────────────────────────────────────── */
  cartItems = signal<CartItem[]>([]);
  currentCartId = signal<number | null>(null);

  cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  /* ── 訪客判斷 ──────────────────────────────────────── */
  isGuest = computed(() => !!this.authService.currentUser?.isGuest);

  /* ── 身分識別格式化 ────────────────────────────── */
  userRoleLabel = computed(() => {
    const user = this.authService.currentUser;
    if (!user) return '';
    const l = this.branchService.lang();
    if (user.isGuest) return l.guestLabel;
    return l.memberLabel;
  });

  formattedName = computed(() => {
    const user = this.authService.currentUser;
    const l = this.branchService.lang();
    if (!user) return l.notLoggedIn;
    if (user.isGuest && user.phone) {
      return `${l.guestLabel}「${user.phone}」`;
    }
    return user.name || l.noName;
  });

  /* ── 多語翻譯對照表（依中文名稱 key，供 API 回傳後合併用）── */
  private static readonly MENU_I18N: Record<
    string,
    Pick<
      MenuItem,
      'nameEn' | 'nameJP' | 'nameKR' | 'descriptionJP' | 'descriptionKR'
    >
  > = {
    招牌滷肉飯: {
      nameEn: 'Braised Pork Rice',
      nameJP: '魯肉飯（台湾風豚角煮丼）',
      nameKR: '루러우판（대만식 돼지고기 덮밥）',
      descriptionJP:
        '豚バラ肉をじっくり煮込んだ濃厚タレ、半熟煮卵とさっぱりキムチ添え',
      descriptionKR:
        '천천히 조린 삼겹살, 진한 간장 소스, 반숙 달걀과 아삭한 겉절이 곁들임',
    },
    古早味排骨飯: {
      nameEn: 'Pork Chop Rice',
      nameJP: '台湾風ポークカツ丼（懐かし風）',
      nameKR: '전통식 돼지갈비 덮밥',
      descriptionJP: '台湾式の揚げポークチョップ、大根の煮物と白ご飯',
      descriptionKR: '대만식 튀긴 돼지갈비, 무 조림과 흰 쌀밥',
    },
    牛排: {
      nameEn: 'Beef Steak',
      nameJP: 'ビーフステーキ',
      nameKR: '비프 스테이크',
      descriptionJP:
        'オーストラリア産牛肉、炭火焼きで旨みを閉じ込め、季節野菜とソース添え',
      descriptionKR:
        '호주산 소고기, 직화구이로 육즙 봉인, 제철 채소와 소스 곁들임',
    },
    三杯雞: {
      nameEn: 'Three Cup Chicken',
      nameJP: '三杯鶏（台湾風醤油バジル煮）',
      nameKR: '삼배계（대만식 간장 바질 닭요리）',
      descriptionJP: 'ごま油・醤油・紹興酒で炒め煮、バジルの香り豊か',
      descriptionKR: '참기름·간장·쌀술 삼배 조리, 바질 향이 가득',
    },
    蚵仔煎: {
      nameEn: 'Oyster Pancake',
      nameJP: '牡蠣オムレツ（台湾風）',
      nameKR: '대만식 굴전',
      descriptionJP:
        '新鮮な牡蠣を使ったさつまいも粉のパンケーキ、特製甘辛ソースがけ',
      descriptionKR:
        '신선한 굴을 넣은 고구마 전분 전, 특제 매콤달콤 소스 곁들임',
    },
    蚵仔麵線: {
      nameEn: 'Oyster Vermicelli',
      nameJP: '牡蠣そうめん（台湾風とろみ麺）',
      nameKR: '굴 국수（대만식 걸쭉한 면）',
      descriptionJP:
        '新鮮な牡蠣と細麺のスープ、甘辛ソースで味付けした夜市の定番',
      descriptionKR:
        '신선한 굴과 가는 국수의 조화, 매콤달콤 소스의 야시장 명물',
    },
    阿三陽春麵: {
      nameEn: 'Traditional Noodle',
      nameJP: 'アサン陽春麺（台湾式あっさり麺）',
      nameKR: '아산 양춘면（담백한 대만식 국수）',
      descriptionJP: '昔ながら製法のクリアスープ、手打ち麺のもちもち食感',
      descriptionKR: '전통 방식으로 우린 맑은 육수, 수제 면의 탱글탱글한 식감',
    },
    黑糖珍珠奶茶: {
      nameEn: 'Brown Sugar Boba',
      nameJP: '黒糖タピオカミルクティー',
      nameKR: '흑당 버블 밀크티',
      descriptionJP: '出来たてタピオカ、手作り黒糖タイガーストライプ',
      descriptionKR: '갓 삶은 타피오카, 수제 흑당 호랑이 무늬',
    },
    仙草奶茶: {
      nameEn: 'Grass Jelly Milk Tea',
      nameJP: '仙草ミルクティー',
      nameKR: '선초 밀크티',
      descriptionJP:
        '台湾産仙草ゼリー入り、濃厚ミルクティーとの絶妙な組み合わせ',
      descriptionKR: '대만산 선초 젤리, 진한 밀크티와의 절묘한 조합',
    },
  };

  /* ── 菜單品項（API 載入後動態填充；MOCK_MODE 下使用靜態 Demo 資料）── */
  menuItems = signal<MenuItem[]>([
    {
      id: 1,
      name: '招牌滷肉飯',
      ...CustomerHomeComponent.MENU_I18N['招牌滷肉飯'],
      price: 120,
      image: '',
      category: '飯食',
      categoryEn: 'Rice',
      description: '慢燉豬五花，滷汁濃醇入味，配半熟滷蛋與爽脆泡菜',
      stock: 20,
    },
    {
      id: 2,
      name: '古早味排骨飯',
      ...CustomerHomeComponent.MENU_I18N['古早味排骨飯'],
      price: 145,
      image: '',
      category: '飯食',
      categoryEn: 'Rice',
      description: '台式醃製炸排骨，滷汁菜頭配白飯',
      stock: 15,
    },
    {
      id: 8,
      name: '牛排',
      ...CustomerHomeComponent.MENU_I18N['牛排'],
      price: 130,
      image: '',
      category: '飯食',
      categoryEn: 'Rice',
      description: '精選澳洲牛肉，炭烤鎖汁，附時蔬與醬汁',
      stock: 10,
    },
    {
      id: 9,
      name: '三杯雞',
      ...CustomerHomeComponent.MENU_I18N['三杯雞'],
      price: 150,
      image: '',
      category: '飯食',
      categoryEn: 'Rice',
      description: '麻油、醬油、米酒三杯燒製，九層塔香氣四溢',
      stock: 15,
    },
    {
      id: 3,
      name: '蚵仔煎',
      ...CustomerHomeComponent.MENU_I18N['蚵仔煎'],
      price: 80,
      image: '',
      category: '小吃',
      categoryEn: 'Snacks',
      description: '鮮蚵地瓜粉煎餅，淋上特製甜辣醬',
      stock: 18,
    },
    {
      id: 7,
      name: '蚵仔麵線',
      ...CustomerHomeComponent.MENU_I18N['蚵仔麵線'],
      price: 70,
      image: '',
      category: '小吃',
      categoryEn: 'Snacks',
      description: '鮮蚵燴入麵線，甜辣醬提味，道地夜市風味',
      stock: 20,
    },
    {
      id: 4,
      name: '阿三陽春麵',
      ...CustomerHomeComponent.MENU_I18N['阿三陽春麵'],
      price: 120,
      image: '',
      category: '麵食',
      categoryEn: 'Noodles',
      description: '古法熬製清湯底，手工製麵條彈牙有嚼勁',
      stock: 15,
    },
    {
      id: 5,
      name: '黑糖珍珠奶茶',
      ...CustomerHomeComponent.MENU_I18N['黑糖珍珠奶茶'],
      price: 75,
      image: '',
      category: '飲品',
      categoryEn: 'Drinks',
      description: '現煮珍珠，手工黑糖虎紋',
      stock: 50,
    },
    {
      id: 6,
      name: '仙草奶茶',
      ...CustomerHomeComponent.MENU_I18N['仙草奶茶'],
      price: 65,
      image: '',
      category: '飲品',
      categoryEn: 'Drinks',
      description: '台灣本產仙草凍，搭配濃醇鮮奶茶',
      stock: 30,
    },
  ]);

  /** 從 menuItems 衍生的分類清單（去重，保持插入順序） */
  menuCategories = computed<string[]>(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const item of this.menuItems()) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        cats.push(item.category);
      }
    }
    return cats;
  });

  /** 取得指定分類中通過搜尋/篩選的品項 */
  getItemsByCategory(cat: string): MenuItem[] {
    return this.menuItems().filter(
      (item) =>
        item.category === cat && this.isMenuItemShown(item.name, item.category),
    );
  }

  /** 分類標題文字（含 emoji） */
  getCategoryLabel(cat: string): string {
    const cc = this.branchService.country;
    const MAP_TW: Record<string, string> = {
      飯食: '🍱 飯食料理',
      小吃: '🦪 台灣小吃',
      麵食: '🍜 麵食',
      飲品: '🧋 特調飲品',
    };
    const MAP_JP: Record<string, string> = {
      飯食: '🍱 ご飯料理',
      小吃: '🦪 台湾スナック',
      麵食: '🍜 麺料理',
      飲品: '🧋 ドリンク',
    };
    const MAP_KR: Record<string, string> = {
      飯食: '🍱 밥 요리',
      小吃: '🦪 대만 간식',
      麵食: '🍜 면 요리',
      飲品: '🧋 음료',
    };
    if (cc === 'JP') return MAP_JP[cat] ?? `🍽 ${cat}`;
    if (cc === 'KR') return MAP_KR[cat] ?? `🍽 ${cat}`;
    return MAP_TW[cat] ?? `🍽 ${cat}`;
  }

  /** CSS 背景圖 class（MOCK 模式下依名稱對應；真實模式下由 image 欄位帶入） */
  getMenuImageClass(item: MenuItem): string {
    if (item.image) return '';
    const MAP: Record<string, string> = {
      招牌滷肉飯: 'mi-braised-pork',
      古早味排骨飯: 'mi-pork-chop',
      蚵仔煎: 'mi-oyster-pancake',
      阿三陽春麵: 'mi-beef',
      黑糖珍珠奶茶: 'mi-bbt',
      仙草奶茶: 'mi-grass-jelly',
      蚵仔麵線: 'mi-oyster-noodle',
      牛排: 'mi-steak',
      三杯雞: 'mi-3cup-chicken',
    };
    return MAP[item.name] ?? '';
  }

  /* ── 菜單：分類篩選 & 搜尋 ────────────────────────── */
  activeMenuCategory = signal<string>('all');
  menuSearchQuery = signal<string>('');

  setMenuCategory(cat: string): void {
    this.activeMenuCategory.set(cat);
  }

  onMenuSearch(event: Event): void {
    this.menuSearchQuery.set((event.target as HTMLInputElement).value);
  }

  /** 回傳該品項是否應顯示（分類 + 名稱模糊搜尋） */
  isMenuItemShown(name: string, category: string): boolean {
    const cat = this.activeMenuCategory();
    const q = this.menuSearchQuery().trim().toLowerCase();
    const catMatch = cat === 'all' || cat === category;
    const nameMatch = q === '' || name.toLowerCase().includes(q);
    return catMatch && nameMatch;
  }

  /** 回傳整個分類區塊是否應顯示（只要有任一品項符合篩選即顯示） */
  isSectionShown(
    sectionItems: Array<{ name: string; category: string }>,
  ): boolean {
    return sectionItems.some((item) =>
      this.isMenuItemShown(item.name, item.category),
    );
  }

  /* ── 側邊欄：個人資料抽屜狀態 ────────────────────── */
  isProfileExpanded = signal(false);
  isEditingProfile = signal(false);

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  /* ── 結帳：付款方式選擇 ────────────────────────────── */
  paymentMethod = signal<'credit' | 'mobile' | 'cash'>('cash');

  /* ── 訂單備註（暫停使用，以電話號碼欄取代）────────────── */
  orderNote = signal('');

  /* ── 電話號碼（結帳用）─────────────────────────────────
   * 會員：ngOnInit 自動填入 currentUser.phone
   * 訪客：空白，為必填欄位（提交前需驗證）
   * ────────────────────────────────────────────────── */
  phoneNumber = signal('');

  /** 訪客時電話為必填；會員時有預設值但可修改（均不能為空） */
  isPhoneValid = computed(() => this.phoneNumber().trim().length > 0);

  /* ── 信用卡表單 ─────────────────────────────────────────
   * Demo 假卡：4532 1234 5678 9012 / 12/28 / CVV:123
   * ─────────────────────────────────────────────────── */
  cardNumber = signal('');
  cardExpiry = signal('');
  cardCvv = signal('');
  cardHolder = signal('');
  cardFlipped = signal(false); /* true = 顯示卡背面（CVV 輸入中） */

  /** 四欄均完整才視為有效 */
  isCreditCardValid = computed(() => {
    const num = this.cardNumber().replace(/\s/g, '');
    return (
      num.length === 16 &&
      /^\d{2}\/\d{2}$/.test(this.cardExpiry()) &&
      this.cardCvv().replace(/\D/g, '').length >= 3 &&
      this.cardHolder().trim().length > 0
    );
  });

  /** 格式化卡號：每 4 碼加空格 */
  onCardNumberInput(val: string): void {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    this.cardNumber.set(clean.match(/.{1,4}/g)?.join(' ') ?? clean);
  }

  /** 格式化到期日：第 3 碼前自動插入斜線 */
  onCardExpiryInput(val: string): void {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    this.cardExpiry.set(
      clean.length >= 3 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean,
    );
  }

  onCardCvvFocus(): void {
    this.cardFlipped.set(true);
  }
  onCardCvvBlur(): void {
    this.cardFlipped.set(false);
  }
  onCvvInput(value: string): void {
    this.cardCvv.set(value.replace(/\D/g, '').slice(0, 4));
  }

  /* ── 行動支付 QR Modal ──────────────────────────────── */
  showMobilePayModal = signal(false);
  mobilePayCompleted = signal(false);
  private mobilePayTimer: ReturnType<typeof setTimeout> | null = null;

  openMobilePayModal(): void {
    this.showMobilePayModal.set(true);
    this.mobilePayCompleted.set(false);
  }

  /** 使用者在 Modal 按下「確認付款」→ 顯示成功動畫 → 自動送出訂單 */
  completeMobilePayment(): void {
    this.mobilePayCompleted.set(true);
    this.mobilePayTimer = setTimeout(() => {
      this.showMobilePayModal.set(false);
      this._doPlaceOrder();
      this.isPlacingOrder.set(false);
    }, 2200);
  }

  closeMobilePayModal(): void {
    this.showMobilePayModal.set(false);
    this.mobilePayCompleted.set(false);
    if (this.mobilePayTimer) {
      clearTimeout(this.mobilePayTimer);
      this.mobilePayTimer = null;
    }
  }

  /* ── 下單中狀態（true 時按鈕顯示 spinner，防止重複送出） */
  isPlacingOrder = signal(false);

  setPaymentMethod(method: 'credit' | 'mobile' | 'cash'): void {
    this.paymentMethod.set(method);
  }

  toggleProfile(): void {
    if (this.isGuest()) return;
    this.isProfileExpanded.update((v) => !v);
    if (!this.isProfileExpanded()) {
      this.isEditingProfile.set(false);
      this.showPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update((v) => !v);
    if (!this.isEditingProfile()) {
      this.showPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /* ── 今日優惠橫向滾動 ───────────────────────────────── */
  scrollDeals(el: HTMLElement): void {
    /* 每次滾動一張卡片寬度（240px 卡片 + 12px gap） */
    el.scrollBy({ left: 252, behavior: 'smooth' });
  }

  scrollDealsLeft(el: HTMLElement): void {
    el.scrollBy({ left: -252, behavior: 'smooth' });
  }

  scrollToFeatured(): void {
    this.setTab('home');
    // 等 Angular 渲染完 home tab 後再捲動
    setTimeout(() => {
      const el = document.getElementById('featured-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  /* ── 活動優惠選擇（每個活動有獨立贈品清單）─────────── */
  PROMO_ACTIVITIES = [
    {
      name: '新會員首單禮',
      nameJP: '新規会員初回注文特典',
      nameKR: '신규 회원 첫 주문 선물',
      minSpend: 150,
      gifts: ['招牌豆漿 × 1', '仙草奶茶 × 1'],
      giftsJP: ['看板豆乳 × 1', '仙草ミルクティー × 1'],
      giftsKR: ['시그니처 두유 × 1', '선초 밀크티 × 1'],
    },
    {
      name: '週末滿額禮',
      nameJP: '週末お買い上げ特典',
      nameKR: '주말 구매 달성 선물',
      minSpend: 300,
      gifts: ['古早味豆腐塊 × 2', '特製泡菜 × 1', '滷蛋 × 2'],
      giftsJP: ['昔ながらの豆腐 × 2', '特製キムチ × 1', '煮卵 × 2'],
      giftsKR: ['전통 두부 × 2', '특제 김치 × 1', '조림 계란 × 2'],
    },
    {
      name: '消費達人大禮包',
      nameJP: 'グルメ達人特大ギフトセット',
      nameKR: '소비 달인 대형 선물 세트',
      minSpend: 500,
      gifts: ['仙草奶茶 × 1 + 滷蛋 × 2', '特製泡菜 × 1 + 古早味豆腐塊 × 2'],
      giftsJP: [
        '仙草ミルクティー × 1 + 煮卵 × 2',
        '特製キムチ × 1 + 昔ながらの豆腐 × 2',
      ],
      giftsKR: [
        '선초 밀크티 × 1 + 조림 계란 × 2',
        '특제 김치 × 1 + 전통 두부 × 2',
      ],
    },
  ];

  /* 活動專區展示資料（含完整圖片、日期、文案） */
  PROMO_DISPLAY = [
    /* ── 全球活動 1：新會員首單禮 ── */
    {
      name: '新會員首單禮',
      nameJP: '新規会員様限定・初回ご注文特典',
      nameKR: '신규 회원 한정！첫 주문 웰컴 혜택',
      tag: '新會員限定',
      tagType: 'new',
      colorScheme: 'forest',
      image: '/assets/主頁輪播圖1.jpg',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      minSpend: 150,
      gifts: ['招牌豆漿 × 1', '仙草奶茶 × 1'],
      giftsJP: ['看板豆乳 × 1', '仙草ミルクティー × 1'],
      giftsKR: ['시그니처 두유 × 1', '선초 밀크티 × 1'],
      description:
        '首次在懶飽飽下單的新會員，單筆消費滿 $150 即可獲得精選贈品！台灣在地風味與跨國美食任您探索，這份專屬歡迎禮是我們最誠摯的招待。',
      descriptionJP:
        '懶飽飽でのはじめてのご注文で、指定金額以上お買い上げいただいた新規会員様に厳選ギフトを1点プレゼント！台湾グルメからグローバル料理まで、ウェルカムギフトとともに最高のひとときをお楽しみください。',
      descriptionKR:
        '懶飽飽에서 처음 주문하시는 신규 회원님께 지정 금액 이상 구매 시 엄선된 선물을 1개 증정합니다！대만 현지 맛부터 글로벌 퀴진까지, 이 웰컴 선물로 특별한 첫 경험을 시작해 보세요。',
      highlights: [
        '首次消費即享',
        '任選一項贈品',
        '限首筆訂單使用',
        '可與折扣券並用',
      ],
      highlightsJP: [
        '初回ご注文でプレゼント進呈',
        '1つのギフトをお選びいただけます',
        '初回注文のみ適用',
        '割引クーポンとの併用OK',
      ],
      highlightsKR: [
        '첫 주문 시 즉시 증정',
        '선물 1개 선택 가능',
        '첫 번째 주문에만 적용',
        '할인 쿠폰과 중복 가능',
      ],
    },
    /* ── 全球活動 2：週末滿額禮 ── */
    {
      name: '週末滿額禮',
      nameJP: '週末限定！お買い上げプレゼント',
      nameKR: '주말 한정！구매 금액 달성 혜택',
      tag: '期間限定',
      tagType: 'promo',
      colorScheme: 'burgundy',
      image: '/assets/主頁輪播圖2.jpg',
      startDate: '2026-04-05',
      endDate: '2026-05-31',
      minSpend: 300,
      gifts: ['古早味豆腐塊 × 2', '特製泡菜 × 1', '滷蛋 × 2'],
      giftsJP: ['懐かしの豆腐ブロック × 2', '特製キムチ × 1', '煮卵 × 2'],
      giftsKR: ['전통식 두부블럭 × 2', '특제 김치 × 1', '조린 계란 × 2'],
      description:
        '每逢週末，單筆消費滿 $300 即可選一份豐盛贈品！懶飽飽為您準備最道地的台灣小吃作為感謝，讓每個週末都更加美味。',
      descriptionJP:
        '毎週末、指定金額以上お買い上げで豪華プレゼントをひとつお選びいただけます！ご家族との食事にも、自分へのご褒美にも、懶飽飽の本格台湾グルメとともに素敵な週末を。',
      descriptionKR:
        '매주 주말, 지정 금액 이상 구매 시 풍성한 선물 1개를 선택하세요！가족 식사나 나만의 보상에, 懶飽飽가 최고의 대만 음식으로 주말을 더욱 맛있게 만들어 드립니다。',
      highlights: [
        '僅限週六、日適用',
        '消費滿 $300',
        '三款贈品任選一',
        '每筆訂單限贈一次',
      ],
      highlightsJP: [
        '毎週土・日のみ適用',
        '指定金額以上のご購入',
        '3種のギフトからお選び',
        '1注文につき1回限り',
      ],
      highlightsKR: [
        '매주 토·일요일만 적용',
        '지정 금액 이상 구매',
        '3종 선물 중 1개 선택',
        '주문당 1회 한정',
      ],
    },
    /* ── 全球活動 3：消費達人大禮包 ── */
    {
      name: '消費達人大禮包',
      nameJP: 'グルメ達人限定！特大ダブルギフトセット',
      nameKR: '소비 달인 한정！더블 대형 선물 세트',
      tag: '限時豪禮',
      tagType: 'premium',
      colorScheme: 'navy',
      image: '/assets/主頁輪播圖3.jpg',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      minSpend: 500,
      gifts: ['仙草奶茶 × 1 + 滷蛋 × 2', '特製泡菜 × 1 + 古早味豆腐塊 × 2'],
      giftsJP: [
        '仙草ミルクティー × 1 + 煮卵 × 2',
        '特製キムチ × 1 + 懐かしの豆腐 × 2',
      ],
      giftsKR: [
        '선초 밀크티 × 1 + 조린 계란 × 2',
        '특제 김치 × 1 + 전통식 두부 × 2',
      ],
      description:
        '單筆消費滿 $500，立享豪華雙重組合贈品！懶飽飽為美食達人精心準備超值回饋，豐盛組合讓您一次享受多種在地風味，本月限定不容錯過。',
      descriptionJP:
        '指定金額以上お買い上げで、豪華ダブル特典セットをすぐにプレゼント！美食家のための超お得な感謝ギフト、豊富な組み合わせで台湾本場の味を一度に楽しめます。今月限定、お見逃しなく！',
      descriptionKR:
        '지정 금액 이상 구매 시 즉시 더블 선물 세트 증정！미식가를 위한 초대박 감사 선물로, 다양한 현지의 맛을 한 번에 즐기세요. 이달 한정 특별 혜택입니다！',
      highlights: [
        '本月限定活動',
        '消費滿 $500',
        '兩款組合禮任選一',
        '可搭配折扣券使用',
      ],
      highlightsJP: [
        '今月限定キャンペーン',
        '指定金額以上のご購入',
        '2種の組み合わせギフトからお選び',
        '割引クーポンとの併用OK',
      ],
      highlightsKR: [
        '이달 한정 이벤트',
        '지정 금액 이상 구매',
        '2종 콤보 선물 중 1개 선택',
        '할인 쿠폰 중복 사용 가능',
      ],
    },
  ];

  /* 活動專區詳情 Modal */
  promoDetailIndex = signal<number | null>(null);

  openPromoDetail(index: number): void {
    this.promoDetailIndex.set(index);
  }

  closePromoDetail(): void {
    this.promoDetailIndex.set(null);
  }

  get selectedPromoDetail() {
    const i = this.promoDetailIndex();
    return i !== null ? this.PROMO_DISPLAY[i] : null;
  }

  /** 根據目前語言取得品項名稱 */
  getLocalizedName(item: {
    name: string;
    nameJP?: string;
    nameKR?: string;
  }): string {
    const cc = this.branchService.country;
    if (cc === 'JP') return item.nameJP ?? item.name;
    if (cc === 'KR') return item.nameKR ?? item.name;
    return item.name;
  }

  /** 根據目前語言取得品項描述 */
  getLocalizedDesc(item: {
    description: string;
    descriptionJP?: string;
    descriptionKR?: string;
  }): string {
    const cc = this.branchService.country;
    if (cc === 'JP') return item.descriptionJP ?? item.description;
    if (cc === 'KR') return item.descriptionKR ?? item.description;
    return item.description;
  }

  /** 根據目前語言取得活動贈品清單 */
  getLocalizedGifts(promo: {
    gifts: string[];
    giftsJP?: string[];
    giftsKR?: string[];
  }): string[] {
    const cc = this.branchService.country;
    if (cc === 'JP') return promo.giftsJP ?? promo.gifts;
    if (cc === 'KR') return promo.giftsKR ?? promo.gifts;
    return promo.gifts;
  }

  /** 根據目前語言取得活動亮點清單 */
  getLocalizedHighlights(promo: {
    highlights: string[];
    highlightsJP?: string[];
    highlightsKR?: string[];
  }): string[] {
    const cc = this.branchService.country;
    if (cc === 'JP') return promo.highlightsJP ?? promo.highlights;
    if (cc === 'KR') return promo.highlightsKR ?? promo.highlights;
    return promo.highlights;
  }

  /** 根據中文名稱查找 menuItems 並取得本地化名稱 */
  getLocalizedMenuName(chineseName: string): string {
    const item = this.menuItems().find((i) => i.name === chineseName);
    return item ? this.getLocalizedName(item) : chineseName;
  }

  /** 根據中文名稱查找 menuItems 並取得本地化描述 */
  getLocalizedMenuDesc(chineseName: string): string {
    const item = this.menuItems().find((i) => i.name === chineseName);
    return item ? this.getLocalizedDesc(item) : '';
  }

  /** 根據目前語言取得訂單品項文字 */
  getLocalizedOrderItems(order: {
    items: string;
    itemsJP?: string;
    itemsKR?: string;
  }): string {
    const cc = this.branchService.country;
    if (cc === 'JP') return order.itemsJP ?? order.items;
    if (cc === 'KR') return order.itemsKR ?? order.items;
    return order.items;
  }

  /* 已選活動名稱（'' = 未選, '不參加活動優惠' = 放棄） */
  selectedPromoName = signal<string>('');
  /* 已選活動內的贈品 */
  selectedPromoGift = signal<string>('');
  /* 結帳頁綠色贈品面板是否展開 */
  promoGiftPanelOpen = signal(false);
  /* 菜單頁各活動進度條的展開狀態（key = 活動名稱） */
  promoProgressExpanded = signal<Record<string, boolean>>({});
  /* 菜單頁：整個活動抽屜是否展開 */
  promoDrawerOpen = signal<boolean>(false);

  /* 根據目前小計，篩出已達門檻的活動 */
  unlockedPromos = computed(() =>
    this.PROMO_ACTIVITIES.filter((p) => this.cartTotal() >= p.minSpend),
  );

  /* 目前選中的活動物件 */
  get selectedPromoActivity() {
    return (
      this.PROMO_ACTIVITIES.find((p) => p.name === this.selectedPromoName()) ??
      null
    );
  }

  /** 已選贈品的本地化顯示名稱 */
  selectedPromoGiftLocalized = computed(() => {
    const gift = this.selectedPromoGift();
    if (!gift) return '';
    const activity = this.PROMO_ACTIVITIES.find(
      (p) => p.name === this.selectedPromoName(),
    );
    if (!activity) return gift;
    const idx = activity.gifts.indexOf(gift);
    if (idx === -1) return gift;
    const localized = this.getLocalizedGifts(activity);
    return localized[idx] ?? gift;
  });

  /* 菜單頁：整個活動抽屜展開/收折 */
  togglePromoDrawer(): void {
    this.promoDrawerOpen.update((v) => !v);
  }

  /* 菜單頁：切換特定活動進度條的展開/收折（抽屜內部） */
  togglePromoProgressBar(name: string): void {
    this.promoProgressExpanded.update((v) => ({ ...v, [name]: !v[name] }));
  }

  isPromoBarExpanded(name: string): boolean {
    return this.promoProgressExpanded()[name] ?? false;
  }

  /* 菜單頁：已達門檻的活動數量 */
  get promoCompletedCount(): number {
    return this.PROMO_ACTIVITIES.filter((p) => this.cartTotal() >= p.minSpend)
      .length;
  }

  /* 結帳頁：切換綠色贈品面板 */
  togglePromoGiftPanel(): void {
    this.promoGiftPanelOpen.update((v) => !v);
  }

  selectPromo(name: string): void {
    this.selectedPromoName.set(name);
    this.selectedPromoGift.set(''); /* 切換活動時重置贈品選擇 */
    this.promoGiftPanelOpen.set(true); /* 自動展開贈品面板 */
  }

  selectPromoGift(gift: string): void {
    this.selectedPromoGift.set(gift);
    this.promoGiftPanelOpen.set(false); /* 選完自動收折 */
  }

  /* ── 訂單預覽彈出視窗 ─────────────────────────────────── */
  showOrderPreview = signal(false);

  openOrderPreview(): void {
    if (this.cartItems().length === 0) return;
    /* 訪客必須填入電話號碼才能送出 */
    if (!this.isPhoneValid()) return;
    this.showOrderPreview.set(true);
  }

  closeOrderPreview(): void {
    this.showOrderPreview.set(false);
  }

  goToPayment(): void {
    this.showOrderPreview.set(false);
    this.setTab('payment');
  }

  /* 取消本次訂單：清空購物車並回到首頁 */
  cancelCurrentOrder(): void {
    this.clearCart();
    this.selectedPromoName.set('');
    this.selectedPromoGift.set('');
    this.promoGiftPanelOpen.set(false);
    this.useDiscountCoupon.set(false);
    /* 重置信用卡表單 */
    this.cardNumber.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
    this.cardHolder.set('');
    this.cardFlipped.set(false);
    /* 重置行動支付 Modal */
    this.closeMobilePayModal();
    localStorage.removeItem('lbb_tracking_order');
    this.setTab('home');
  }

  /* ── 折扣兌換券 ─────────────────────────────────────── */
  useDiscountCoupon = signal(false);

  toggleDiscountCoupon(): void {
    this.useDiscountCoupon.update((v) => !v);
  }

  /* ── 側邊欄：進度與折扣邏輯 (模擬 Database) ────────── */
  memberOrderCount = signal(9);

  ordersUntilDiscount = computed(() => {
    const total = this.memberOrderCount();
    const remainder = total % 10;
    if (remainder === 0 && total > 0) return 0;
    return 10 - remainder;
  });

  hasDiscountReady = computed(() => {
    return this.memberOrderCount() > 0 && this.memberOrderCount() % 10 === 0;
  });

  /* 8折後總計（使用折扣券時才生效） */
  discountedTotal = computed(() => {
    if (this.useDiscountCoupon()) {
      return Math.round(this.cartTotal() * 0.8);
    }
    return this.cartTotal();
  });

  /* 折扣省下金額 */
  discountAmount = computed(() => {
    return this.cartTotal() - this.discountedTotal();
  });

  /* 行動支付 QR Code URL（手機掃碼後開啟的付款確認頁） */
  mobilePayUrl = computed(() => {
    const items = this.cartItems().map((i) => ({
      name: i.name,
      qty: i.quantity,
      price: i.price,
    }));
    const params = new URLSearchParams({
      store: '懶飽飽 Lazy BaoBao',
      amount: this.discountedTotal().toString(),
      items: JSON.stringify(items),
      'ngrok-skip-browser-warning': 'true',
    });
    return `${DEMO_BASE_URL}/mobile-pay?${params.toString()}`;
  });

  /* ── 即時追蹤訂單（從 OrderService 取得最新客戶訂單） ── */
  trackingOrder = computed<TrackingOrder | null>(() => {
    const o = this.orderService.latestCustomerOrder();
    if (!o) return null;
    return {
      id: o.id,
      number: o.number,
      status: o.status,
      estimatedMinutes: o.estimatedMinutes,
      items: o.items,
      total: o.total,
      createdAt: o.createdAt,
    };
  });

  /* ── 底部導覽列定義（語言響應式） ────────────────── */
  navTabs = computed<NavTab[]>(() => {
    const l = this.branchService.lang();
    const ALL: NavTab[] = [
      { id: 'home', label: l.navHome, icon: 'home' },
      { id: 'menu', label: l.navMenu, icon: 'menu' },
      { id: 'checkout', label: l.navCart, icon: 'checkout' },
      { id: 'tracker', label: l.navTracker, icon: 'tracker' },
      { id: 'orders', label: l.navOrders, icon: 'orders' },
      { id: 'promotions', label: l.navPromos, icon: 'promotions' },
    ];
    return this.isGuest() ? ALL.filter((t) => t.id !== 'orders') : ALL;
  });

  /* ── 訂單管理資料 ──────────────────────────────────── */
  activeOrderTab = signal<'completed' | 'cancelled' | 'refunded'>('completed');

  /* ── 退款申請 Modal ─────────────────────────────────── */
  refundModalOpen = signal(false);
  refundTargetOrder = signal<{ id: string; total: number } | null>(null);
  refundSubmitted = signal(false);

  refundChecked = signal<Record<string, boolean>>({
    r1: false,
    r2: false,
    r3: false,
    r4: false,
    r5: false,
    r6: false,
    r7: false,
  });

  refundReasons = computed(() => {
    const l = this.branchService.lang();
    const c = this.refundChecked();
    return [
      { id: 'r1', label: l.refundR1, checked: c['r1'] },
      { id: 'r2', label: l.refundR2, checked: c['r2'] },
      { id: 'r3', label: l.refundR3, checked: c['r3'] },
      { id: 'r4', label: l.refundR4, checked: c['r4'] },
      { id: 'r5', label: l.refundR5, checked: c['r5'] },
      { id: 'r6', label: l.refundR6, checked: c['r6'] },
      { id: 'r7', label: l.refundR7, checked: c['r7'] },
    ];
  });
  refundOtherText = signal('');

  hasRefundSelection = computed(
    () =>
      Object.values(this.refundChecked()).some((v) => v) ||
      this.refundOtherText().trim().length > 0,
  );

  /* ── 取消追蹤中訂單（方案 A：tracker tab）────────── */
  cancelConfirmOpen = signal(false);

  openCancelConfirm(): void {
    this.cancelConfirmOpen.set(true);
  }

  closeCancelConfirm(): void {
    this.cancelConfirmOpen.set(false);
  }

  confirmCancelOrder(): void {
    const dbId = this._activeOrderDbId;
    if (!dbId) { this.cancelConfirmOpen.set(false); return; }
    this.apiService.updateOrderStatus({
      id: dbId.id,
      orderDateId: dbId.orderDateId,
      status: 'CANCELLED',
    }).subscribe({
      next: () => {
        this.orderService.removeOrder(dbId.id);
        this._activeOrderDbId = null;
        this.cancelConfirmOpen.set(false);
      },
      error: () => {
        this.cancelConfirmOpen.set(false);
        alert('取消失敗，請稍後再試');
      },
    });
  }

  openRefundModal(order: { id: string; total: number }): void {
    this.refundTargetOrder.set(order);
    this.refundChecked.set({
      r1: false,
      r2: false,
      r3: false,
      r4: false,
      r5: false,
      r6: false,
      r7: false,
    });
    this.refundOtherText.set('');
    this.refundSubmitted.set(false);
    this.refundModalOpen.set(true);
  }

  closeRefundModal(): void {
    this.refundModalOpen.set(false);
    this.refundTargetOrder.set(null);
  }

  toggleRefundReason(id: string): void {
    this.refundChecked.update((c) => ({ ...c, [id]: !c[id] }));
  }

  updateRefundOther(value: string): void {
    this.refundOtherText.set(value);
  }

  submitRefund(): void {
    if (!this.hasRefundSelection()) return;
    const order = this.refundTargetOrder();
    if (!order) return;

    // 從 id 解析出 orderDateId（格式 LBB-YYYYMMDD-XXXX）
    const parts = order.id.split('-');
    const orderDateId = parts[1] ?? '';

    this.apiService
      .updateOrderStatus({
        id: order.id,
        orderDateId,
        status: 'REFUNDED',
      })
      .subscribe({
        next: () => {
          // 本地狀態更新
          this.orderHistoryList.set(
            this.orderHistoryList().map((o) =>
              o.id === order.id ? { ...o, status: 'refunded' as const } : o,
            ),
          );
          this.refundSubmitted.set(true);
          setTimeout(() => this.closeRefundModal(), 2000);
        },
        error: () => {
          // API 失敗仍顯示成功（Demo 用）
          this.refundSubmitted.set(true);
          setTimeout(() => this.closeRefundModal(), 2000);
        },
      });
  }

  orderHistoryList = signal([
    {
      id: 'LBB-20260115-001',
      date: '2026-01-15',
      items: '紅燒牛肉麵 × 1、滷蛋 × 2',
      itemsJP: '紅焼き牛肉麺 × 1、煮卵 × 2',
      itemsKR: '홍사오 소고기 국수 × 1、반숙 달걀 × 2',
      total: 185,
      status: 'completed',
    },
    {
      id: 'LBB-20260210-002',
      date: '2026-02-10',
      items: '三杯雞飯 × 1、味噌湯 × 1',
      itemsJP: '三杯チキンライス × 1、味噌スープ × 1',
      itemsKR: '산배이 닭고기 덮밥 × 1、된장국 × 1',
      total: 150,
      status: 'completed',
    },
    {
      id: 'LBB-20260301-003',
      date: '2026-03-01',
      items: '咖哩雞飯 × 1、珍珠奶茶 × 2、小菜 × 1',
      itemsJP: 'カレーチキンライス × 1、タピオカミルクティー × 2、小皿料理 × 1',
      itemsKR: '카레 치킨 라이스 × 1、버블밀크티 × 2、사이드 메뉴 × 1',
      total: 320,
      status: 'completed',
    },
    {
      id: 'LBB-20260318-004',
      date: '2026-03-18',
      items: '麻辣燙 × 1、白飯 × 1',
      itemsJP: '麻辣湯（マーラータン）× 1、白ご飯 × 1',
      itemsKR: '마라탕 × 1、흰밥 × 1',
      total: 175,
      status: 'completed',
    },
    {
      id: 'LBB-20260325-005',
      date: '2026-03-25',
      items: '越南河粉 × 1、春捲 × 3',
      itemsJP: 'ベトナムフォー × 1、生春巻き × 3',
      itemsKR: '베트남 쌀국수（フォー）× 1、스프링롤 × 3',
      total: 210,
      status: 'completed',
    },
    {
      id: 'LBB-20260401-006',
      date: '2026-04-01',
      items: '印度咖哩飯 × 2、饢餅 × 1、優格飲 × 2',
      itemsJP: 'インドカレーライス × 2、ナン × 1、ラッシー × 2',
      itemsKR: '인도 카레 라이스 × 2、난 × 1、라씨 × 2',
      total: 395,
      status: 'completed',
    },
    {
      id: 'LBB-20260308-007',
      date: '2026-03-08',
      items: '鐵板燒套餐 × 2、冬瓜茶 × 2',
      itemsJP: '鉄板焼きセット × 2、冬瓜茶 × 2',
      itemsKR: '철판구이 세트 × 2、동과차 × 2',
      total: 480,
      status: 'cancelled',
    },
    {
      id: 'LBB-20260220-008',
      date: '2026-02-20',
      items: '紅油抄手 × 2',
      itemsJP: '紅油水餃子（ホンユーチャオショウ）× 2',
      itemsKR: '훙유 완탕（홍유초우서우）× 2',
      total: 120,
      status: 'refunded',
    },
  ]);

  completedCount = computed(
    () =>
      this.orderHistoryList().filter((o) => o.status === 'completed').length,
  );
  cancelledCount = computed(
    () =>
      this.orderHistoryList().filter((o) => o.status === 'cancelled').length,
  );
  refundedCount = computed(
    () => this.orderHistoryList().filter((o) => o.status === 'refunded').length,
  );

  filteredOrders = computed(() => {
    return this.orderHistoryList().filter(
      (o) => o.status === this.activeOrderTab(),
    );
  });

  /* ── 國家切換 ──────────────────────────────────────── */
  allCountries = signal<CountryConfig[]>([]);
  activeCountry = signal<CountryCode>('TW');

  /** 語言字典快捷 getter（供 HTML 直接使用） */
  get lang() {
    return this.branchService.lang();
  }

  constructor(
    private router: Router,
    public authService: AuthService,
    private loadingService: LoadingService,
    public orderService: OrderService,
    private apiService: ApiService,
    public branchService: BranchService,
  ) {}

  selectCountry(code: CountryCode): void {
    this.branchService.setCountry(code);
    this.activeCountry.set(code);
  }

  ngOnInit(): void {
    if (!this.authService.currentUser) {
      this.authService.loginAsGuest('');
    }
    this.branchService.init();
    this.allCountries.set(this.branchService.allCountries);
    this.activeCountry.set(this.branchService.country);
    /* 啟動首頁輪播自動播放（5 秒換一張） */
    this.heroTimer = setInterval(() => {
      if (!this.heroPaused) {
        this.heroSlideIndex.update((i) => (i + 1) % this.HERO_SLIDE_COUNT);
      }
    }, 5000);

    /* 啟動促銷橫幅自動輪播（3 秒換一則活動） */
    this.promoBannerTimer = setInterval(() => {
      this.promoBannerIndex.update(
        (i) => (i + 1) % this.PROMO_ACTIVITIES.length,
      );
    }, 3000);

    /* 會員自動填入電話號碼（訪客保持空白，為必填） */
    const user = this.authService.currentUser;
    if (user && !user.isGuest && user.phone) {
      this.phoneNumber.set(user.phone);
    }

    /* 載入促銷活動（API 成功則覆蓋靜態 Demo 資料，只顯示 active 的活動） */
    this.loadPromotions();

    // 從 localStorage 重建追蹤中訂單
    const savedTracking = localStorage.getItem('lbb_tracking_order');
    if (savedTracking) {
      try {
        const t = JSON.parse(savedTracking);
        // 先用存檔資料還原到 OrderService
        this.orderService.addOrder({
          id: t.orderId,
          number: t.number,
          status: t.status,
          estimatedMinutes: t.estimatedMinutes,
          items: t.items,
          total: t.total,
          createdAt: t.createdAt,
          payMethod: t.payMethod,
          source: 'customer',
        });
        // 啟動輪詢取得最新狀態
        if (t.orderDateId) {
          this._activeOrderDbId = { id: t.orderId, orderDateId: t.orderDateId };
          this.statusPollInterval = setInterval(() => {
            if (!this._activeOrderDbId) return;
            this.apiService
              .getOrderStatus(
                this._activeOrderDbId.id,
                this._activeOrderDbId.orderDateId,
              )
              .subscribe({
                next: (res) => {
                  if (res?.code !== 200) return;
                  const statusMap: Record<string, OrderStatus> = {
                    PENDING_CASH: 'pending-cash',
                    WAITING: 'waiting',
                    COOKING: 'cooking',
                    READY: 'done',
                  };
                  const newStatus = statusMap[res.message] ?? 'waiting';
                  this.orderService.updateStatus(t.orderId, newStatus);
                  // 完成或取消時清除 localStorage 並停止輪詢
                  if (newStatus === 'done') {
                    localStorage.removeItem('lbb_tracking_order');
                    if (this.statusPollInterval)
                      clearInterval(this.statusPollInterval);
                    this.statusPollInterval = null;
                  }
                },
                error: () => {},
              });
          }, 5000);
        }
      } catch {
        localStorage.removeItem('lbb_tracking_order');
      }
    }

    /* 載入菜單商品（API 載入後動態填充；API 失敗則保留靜態 Demo 資料） */
    const areaId = 4;
    this.apiService.getActiveProducts(areaId).subscribe({
      next: (res) => {
        if (res?.products?.length) {
          this.menuItems.set(
            res.products.map((p) => {
              const i18n = CustomerHomeComponent.MENU_I18N[p.name] ?? {};
              return {
                id: p.id,
                name: p.name,
                nameEn: i18n.nameEn ?? p.name,
                nameJP: i18n.nameJP,
                nameKR: i18n.nameKR,
                price: p.basePrice,
                image: '',
                category: p.category,
                categoryEn: p.category,
                description: p.description ?? '',
                descriptionJP: i18n.descriptionJP,
                descriptionKR: i18n.descriptionKR,
                stock: p.stockQuantity,
              };
            }),
          );
        }
      },
      error: () => console.warn('[Customer] 菜單 API 連線失敗，使用 Demo 資料'),
    });

    /* 載入真實歷史訂單（僅會員，訪客跳過）
     * ⚠ 需後端 MembersController 建立後，memberId 才會對應真實資料庫 ID
     * 目前 AuthService 的 mock 帳號 id=1 為訪客預設，登入後 id 若有值則嘗試取得 */
    const userForOrders = this.authService.currentUser;
    if (!userForOrders?.isGuest && userForOrders?.id && userForOrders.id > 0) {
      this.apiService.getAllOrders({ memberId: userForOrders.id }).subscribe({
        next: (res) => {
          if (res?.getOrderVoList?.length) {
            this.orderHistoryList.set(
              res.getOrderVoList.map((o: GetOrdersVo) => ({
                id: o.id,
                date: o.completedAt?.slice(0, 10) ?? '',
                items: (o.getOrdersDetailVoList ?? [])
                  .map((d) => `${d.productName} × ${d.quantity}`)
                  .join('、'),
                itemsJP: '',
                itemsKR: '',
                total: +o.totalAmount,
                status:
                  o.status === 'COMPLETED'
                    ? ('completed' as const)
                    : o.status === 'CANCELLED'
                      ? ('cancelled' as const)
                      : o.status === 'REFUNDED'
                        ? ('refunded' as const)
                        : ('completed' as const),
              })),
            );
          }
          /* 若後端回空清單，保留 mock 歷史訂單供 Demo 使用 */
        },
        error: () =>
          console.warn('[Customer] 訂單歷史 API 連線失敗，使用 Demo 資料'),
      });
    }
  }

  /* 客戶端廚房狀態輪詢計時器 */
  private statusPollInterval: ReturnType<typeof setInterval> | null = null;
  /* 目前追蹤中訂單的 DB 識別碼 */
  private _activeOrderDbId: { id: string; orderDateId: string } | null = null;

  ngOnDestroy(): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.promoBannerTimer) clearInterval(this.promoBannerTimer);
    if (this.mobilePayTimer) clearTimeout(this.mobilePayTimer);
    if (this.statusPollInterval) clearInterval(this.statusPollInterval);
  }

  /* ── 切換頁籤 ─────────────────────────────────────── */
  setTab(tab: TabId): void {
    if (tab === 'orders' && this.isGuest()) {
      return;
    }
    this.activeTab.set(tab);
  }

  /* ── 加入購物車 ──────────────────────────────────── */
  addToCart(item: MenuItem): void {
    const current = this.cartItems();
    const existing = current.find((c) => c.id === item.id);
    const newQty = existing ? existing.quantity + 1 : 1;
    if (existing) {
      this.cartItems.set(
        current.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      this.cartItems.set([
        ...current,
        {
          id: item.id,
          name: item.name,
          nameEn: item.nameEn,
          nameJP: item.nameJP,
          nameKR: item.nameKR,
          price: item.price,
          quantity: 1,
          image: item.image,
          category: item.category,
        },
      ]);
    }
    if (navigator.vibrate) navigator.vibrate(30);
    this._syncCartItemToBackend(item.id, newQty);
  }

  private loadPromotions(): void {
    const BANNER_IMAGES = [
      '/assets/主頁輪播圖1.jpg',
      '/assets/主頁輪播圖2.jpg',
      '/assets/主頁輪播圖3.jpg',
    ];
    // 國碼 → globalAreaId 對應（依 global_area 表 branch_id）
    const areaIdMap: Record<string, number> = { TW: 4, JP: 5, KR: 2 };
    const globalAreaId = areaIdMap[this.branchService.country] ?? 1;

    this.apiService.getPromotionsList(globalAreaId).subscribe({
      next: (res) => {
        const active = (res?.data ?? []).filter(
          (p: PromotionDetailVo) => p.active && p.gifts && p.gifts.length > 0,
        );
        if (!active.length) return;

        // 根據目前分店語言選取正確的活動名稱
        const cc = this.branchService.country;
        const localName = (p: PromotionDetailVo) => {
          if (cc === 'JP') return p.nameJP || p.name;
          if (cc === 'KR') return p.nameKR || p.name;
          return p.name;
        };

        this.PROMO_ACTIVITIES = active.map((p: PromotionDetailVo) => {
          const minSpend = p.gifts.length
            ? Math.min(...p.gifts.map((g) => g.fullAmount))
            : 0;
          const giftNames = p.gifts.map(
            (g) => `${g.productName} × ${g.quantity === -1 ? 1 : g.quantity}`,
          );
          const lName = localName(p);
          return {
            name: lName,
            nameJP: p.nameJP || lName,
            nameKR: p.nameKR || lName,
            minSpend,
            gifts: giftNames,
            giftsJP: giftNames,
            giftsKR: giftNames,
          };
        });

        this.PROMO_DISPLAY = active.map((p: PromotionDetailVo, i: number) => {
          const minSpend = p.gifts.length
            ? Math.min(...p.gifts.map((g) => g.fullAmount))
            : 0;
          const giftNames = p.gifts.map(
            (g) => `${g.productName} × ${g.quantity === -1 ? 1 : g.quantity}`,
          );
          const TAG_TYPES = ['new', 'promo', 'premium'] as const;
          const COLOR_SCHEMES = [
            'forest',
            'burgundy',
            'navy',
            'bronze',
            'plum',
            'slate',
          ] as const;
          const id = Math.abs(p.id ?? i);
          const tagIdx = id % TAG_TYPES.length;
          const colorIdx = id % COLOR_SCHEMES.length;
          const lName = localName(p);
          return {
            name: p.name,
            nameJP: p.nameJP || p.name,
            nameKR: p.nameKR || p.name,
            tag: '期間限定',
            tagType: TAG_TYPES[tagIdx],
            colorScheme: COLOR_SCHEMES[colorIdx],
            image: BANNER_IMAGES[tagIdx % BANNER_IMAGES.length],
            startDate: p.startTime,
            endDate: p.endTime,
            minSpend,
            gifts: giftNames,
            giftsJP: giftNames,
            giftsKR: giftNames,
            description:
              p.description ||
              `消費滿 $${minSpend} 即可獲得贈品，把握活動期間限定好禮！`,
            descriptionJP:
              p.description ||
              `$${minSpend}以上のご購入でプレゼント！期間限定をお見逃しなく。`,
            descriptionKR:
              p.description ||
              `$${minSpend} 이상 구매 시 선물 증정！기간 한정 혜택을 놓치지 마세요。`,
            highlights: [
              `消費滿 $${minSpend}`,
              '可選贈品',
              `${p.startTime} ～ ${p.endTime}`,
            ],
            highlightsJP: [
              `$${minSpend}以上のご購入`,
              'プレゼントをお選びください',
              `${p.startTime} ～ ${p.endTime}`,
            ],
            highlightsKR: [
              `$${minSpend} 이상 구매`,
              '선물 선택 가능',
              `${p.startTime} ～ ${p.endTime}`,
            ],
          };
        });
      },
      error: () => {
        /* API 失敗時保留靜態 Demo 資料 */
      },
    });
  }

  private _syncQueue: Promise<void> = Promise.resolve();

  private _syncCartItemToBackend(productId: number, quantity: number): void {
    this._syncQueue = this._syncQueue
      .then(async () => {
        const user = this.authService.currentUser;
        const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
        const req: CartSyncReq = {
          cartId: this.currentCartId(),
          globalAreaId: 4,
          productId,
          quantity,
          operationType: 'CUSTOMER',
          memberId,
        };
        const res = await firstValueFrom(this.apiService.syncCart(req));
        if (res.cartId && res.cartId > 0) {
          this.currentCartId.set(res.cartId);
        }
      })
      .catch((err) => console.warn('[Cart] sync 失敗', err));
  }

  /* ── 更新購物車數量 ──────────────────────────────── */
  updateCartQuantity(id: number, delta: number): void {
    const current = this.cartItems();
    const item = current.find((c) => c.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.cartItems.set(current.filter((c) => c.id !== id));
      const cartId = this.currentCartId();
      if (cartId !== null) {
        const user = this.authService.currentUser;
        const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
        this.apiService
          .removeCartItem({ cartId, productId: id, memberId })
          .subscribe({
            error: (err) => console.warn('[Cart] remove_item 失敗', err),
          });
      }
    } else {
      this.cartItems.set(
        current.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)),
      );
      this._syncCartItemToBackend(id, newQty);
    }
  }

  /* ── 從購物車移除 ─────────────────────────────────── */
  removeFromCart(id: number): void {
    const cartId = this.currentCartId();
    if (cartId !== null) {
      const user = this.authService.currentUser;
      const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
      this.apiService
        .removeCartItem({ cartId, productId: id, memberId })
        .subscribe({
          error: (err) => console.warn('[Cart] remove_item 失敗', err),
        });
    }
    this.cartItems.set(this.cartItems().filter((c) => c.id !== id));
  }

  /* ── 清空購物車（同步後端，用於取消訂單）──────────── */
  clearCart(): void {
    const cartId = this.currentCartId();
    if (cartId !== null) {
      const user = this.authService.currentUser;
      const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
      this.apiService.clearCart({ cartId, memberId }).subscribe({
        error: (err) => console.warn('[Cart] clear_cart 失敗', err),
      });
      this.currentCartId.set(null);
    }
    this.cartItems.set([]);
  }

  /* ── 訂單成功後重置本地購物車（不刪後端明細，保留訂單歷史）── */
  private resetLocalCart(): void {
    this.cartItems.set([]);
    this.currentCartId.set(null);
  }

  /* ── 前往結帳 ─────────────────────────────────────── */
  goToCheckout(): void {
    this.activeTab.set('checkout');
  }

  /* ── 送出訂單（完整流程）────────────────────────────
   * 1. 顯示「處理中」spinner（isPlacingOrder = true）
   * 2. 模擬後端處理延遲 1.2 秒
   * 3. 建立 LiveOrder 並推送至 OrderService（POS 看板即時同步）
   * 4. 新增至本地歷史訂單清單
   * 5. 清空購物車
   * 6. 導向訂單追蹤頁
   * ────────────────────────────────────────────────── */
  placeOrder(): void {
    if (this.cartItems().length === 0) return;
    if (this.isPlacingOrder()) return; /* 防重複送出 */
    /* 信用卡付款必須完整填寫卡片資料才能送出 */
    if (this.paymentMethod() === 'credit' && !this.isCreditCardValid()) return;

    this.isPlacingOrder.set(true);

    setTimeout(() => {
      this._doPlaceOrder();
      this.isPlacingOrder.set(false);
    }, 1200);
  }

  private _doPlaceOrder(): void {
    this._doPlaceOrderAsync().catch((err) => {
      console.error('[Order] 下單失敗', err);
      this.isPlacingOrder.set(false);
      const msg: string = err?.error?.message ?? err?.message ?? '';
      if (msg.includes('逾時') || msg.includes('登入')) {
        alert('登入連線已逾時，請重新登入後再結帳');
        this.authService.logout();
        this.router.navigate(['/customer-login']);
      } else {
        alert('結帳失敗，請稍後再試');
      }
    });
  }

  private async _doPlaceOrderAsync(): Promise<void> {
    const items = this.cartItems();
    const user = this.authService.currentUser;
    const memberId = user?.isGuest ? 1 : (user?.id ?? 1);
    const phone = this.phoneNumber();
    const isCash = this.paymentMethod() === 'cash';

    /* ── Step 1：取得後端購物車 ID
     * eager sync 已完成 → 直接用；否則 fallback 逐筆同步 */
    let cartId = this.currentCartId();
    if (cartId === null) {
      for (const item of items) {
        const syncReq: CartSyncReq = {
          cartId,
          globalAreaId: 4,
          productId: item.id,
          quantity: item.quantity,
          operationType: 'CUSTOMER',
          memberId,
        };
        const cartRes = await firstValueFrom(this.apiService.syncCart(syncReq));
        cartId = cartRes.cartId;
      }
      if (!cartId) throw new Error('購物車同步失敗');
      this.currentCartId.set(cartId);
    }

    /* ── Step 2：建立訂單
     * 現金傳 paymentMethod:'CASH' → 後端建立 PENDING_CASH（不立即付款）
     * 其他付款方式不傳 → 後端建立 UNPAID */
    const orderReq: CreateOrdersReq = {
      orderCartId: String(cartId),
      globalAreaId: 4,
      memberId,
      phone,
      subtotalBeforeTax: this.cartTotal(),
      taxAmount: 0,
      totalAmount: this.cartTotal(),
      orderCartDetailsList: items.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
        isGift: false,
      })),
      ...(isCash ? { paymentMethod: 'CASH' } : {}),
    };
    const orderRes = await firstValueFrom(
      this.apiService.createOrder(orderReq),
    );

    /* ── 現金：直接進入待付款追蹤（不呼叫 pay()） ── */
    if (isCash) {
      this._afterOrderSuccess(
        orderRes.id,
        orderRes.orderDateId,
        'pending-cash',
      );
      return;
    }

    /* ── Step 3：非現金付款（→ COMPLETED） ── */
    const payMethodMap: Record<string, string> = {
      credit: 'CREDIT_CARD',
      mobile: 'MOBILE_PAY',
    };
    const payReq: PayReq = {
      id: orderRes.id,
      orderDateId: orderRes.orderDateId,
      paymentMethod: payMethodMap[this.paymentMethod()] ?? 'CREDIT_CARD',
      transactionId: `DEMO_TXN_${Date.now()}`,
      totalAmount: orderRes.totalAmount,
    };
    await firstValueFrom(this.apiService.pay(payReq));

    /* ── 成功後更新本地狀態 ── */
    this._afterOrderSuccess(orderRes.id, orderRes.orderDateId, 'waiting');
  }

  private _afterOrderSuccess(
    orderId: string,
    orderDateId: string = '',
    initialStatus: 'pending-cash' | 'waiting' = 'waiting',
  ): void {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orderNum = `A-${orderId}`;

    const itemTexts = this.cartItems().map((i) => `${i.name} × ${i.quantity}`);
    const promoGift = this.selectedPromoGift();
    const promoName = this.selectedPromoName();
    if (promoGift && promoName && promoName !== '不參加活動優惠') {
      itemTexts.push(`${promoName} - ${promoGift}`);
    }
    const totalQty = this.cartItems().reduce((s, i) => s + i.quantity, 0);
    const estMin = Math.max(5, Math.ceil(totalQty * 2));

    const payLabels: Record<string, string> = {
      credit: '信用卡',
      mobile: '行動支付',
      cash: '現金',
    };
    const payLabel = payLabels[this.paymentMethod()] ?? '現金';

    /* 推送至 POS 看板（本機 in-memory，同視窗時即時同步） */
    this.orderService.addOrder({
      id: orderId,
      number: orderNum,
      status: initialStatus,
      estimatedMinutes: estMin,
      items: itemTexts,
      total: this.cartTotal(),
      createdAt: timeStr,
      payMethod: payLabel,
      source: 'customer',
      customerName: this.authService.currentUser?.name,
    });

    // 寫入 localStorage，頁面重整後可重建追蹤狀態
    localStorage.setItem(
      'lbb_tracking_order',
      JSON.stringify({
        orderId,
        orderDateId,
        number: orderNum,
        status: initialStatus,
        estimatedMinutes: estMin,
        items: itemTexts,
        total: this.cartTotal(),
        createdAt: timeStr,
        payMethod: payLabel,
      }),
    );

    /* 儲存 DB 訂單識別碼，啟動廚房狀態輪詢（跨裝置同步） */
    if (orderDateId) {
      this._activeOrderDbId = { id: orderId, orderDateId };
      if (this.statusPollInterval) clearInterval(this.statusPollInterval);
      this.statusPollInterval = setInterval(() => {
        if (!this._activeOrderDbId) return;
        this.apiService
          .getOrderStatus(
            this._activeOrderDbId.id,
            this._activeOrderDbId.orderDateId,
          )
          .subscribe({
            next: (res) => {
              if (res?.code !== 200) return;
              const statusMap: Record<string, OrderStatus> = {
                PENDING_CASH: 'pending-cash',
                WAITING: 'waiting',
                COOKING: 'cooking',
                READY: 'done',
              };
              const newStatus = statusMap[res.message] ?? 'waiting';
              const current = this.orderService
                .orders()
                .find((o) => o.id === orderId);
              if (current && current.status !== newStatus) {
                this.orderService.updateStatus(orderId, newStatus);
              }
              /* 已完成則停止輪詢 */
              if (newStatus === 'done') {
                if (this.statusPollInterval)
                  clearInterval(this.statusPollInterval);
                this.statusPollInterval = null;
              }
            },
            error: () => {
              /* 靜默失敗 */
            },
          });
      }, 5000);
    }

    /* 加入本地歷史訂單 */
    this.orderHistoryList.set([
      {
        id: orderId,
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        items: itemTexts.join('、'),
        itemsJP: '',
        itemsKR: '',
        total: this.discountedTotal(),
        status: 'completed',
      },
      ...this.orderHistoryList(),
    ]);

    this.resetLocalCart();
    this.orderNote.set('');

    if (this.useDiscountCoupon()) {
      this.memberOrderCount.set(1);
      this.useDiscountCoupon.set(false);
    } else {
      this.memberOrderCount.update((c) => Math.min(c + 1, 10));
    }

    this.selectedPromoName.set('');
    this.selectedPromoGift.set('');
    this.promoGiftPanelOpen.set(false);
    this.isPlacingOrder.set(false);
    this.setTab('tracker');
  }

  /* ── 取得頭像文字 ────────────────────────────────── */
  getAvatarLetter(): string {
    const user = this.authService.currentUser;
    if (!user) return '?';
    if (user.isGuest) return 'G';
    return user.name?.charAt(0) ?? '?';
  }

  /* ── 登出 ─────────────────────────────────────────── */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/customer-login']);
  }

  /* ── Session 過期：導向重新登入 ──────────────────── */
  goToLogin(): void {
    this.authService.clearSessionExpired();
    this.router.navigate(['/customer-login']);
  }
}
