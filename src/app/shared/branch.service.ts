import { Injectable, inject, signal, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type CountryCode = 'TW' | 'JP' | 'KR';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  nameLocal: string;
  currency: string;
  primaryColor: string;
  hoverColor: string;
  bgColor: string;
  fontFamily: string;
  discountLimit: number;
  dialCode: string;
}

export interface LangDict {
  /* ── Navigation / Header ── */
  managementSystem: string; customerEntrance: string; tagline: string;
  /* ── Login ── */
  welcome: string; loginTitle: string; loginSubtitle: string;
  accountLabel: string; accountPlaceholder: string;
  passwordLabel: string; passwordPlaceholder: string;
  loginBtn: string; registerBtn: string; divider: string; guestBtn: string;
  loginError: string;
  /* ── QR Code ── */
  qrTitle: string; qrSubtitle: string;
  /* ── Register ── */
  joinUs: string; registerTitle: string; registerSubtitle: string;
  requiredHint: string;
  nameLbl: string; namePlaceholder: string; nameError: string;
  phoneLbl: string; phonePlaceholder: string;
  passwordLbl: string; passwordPlaceholder2: string; passwordError: string;
  confirmPasswordLbl: string; confirmPlaceholder: string; confirmError: string;
  registerSubmit: string; hasAccount: string; backToLogin: string;
  /* ── Customer Home nav ── */
  navHome: string; navMenu: string; navCart: string;
  navTracker: string; navOrders: string; navPromos: string;
  /* ── Menu categories ── */
  catAll: string; catRice: string; catNoodles: string;
  catSnacks: string; catLight: string; catDrinks: string;
  searchPlaceholder: string;
  /* ── Cart / Checkout ── */
  addToCart: string; cartEmpty: string; subtotal: string;
  total: string; cash: string; creditCard: string; mobilePay: string;
  checkout: string; cancelOrder: string; note: string; notePlaceholder: string;
  /* ── Order tracker ── */
  orderTrackerTitle: string; waiting: string; cooking: string; ready: string;
  /* ── Password visibility ── */
  showPwd: string; hidePwd: string;
}

const TW: LangDict = {
  managementSystem: '管理系統', customerEntrance: '客戶入口', tagline: '懶懶吃，飽飽樂',
  welcome: '歡迎回來', loginTitle: '會員登入，開始美味旅程',
  loginSubtitle: '登入享有個人化推薦、集點與專屬優惠',
  accountLabel: '手機號碼 / 電子郵件', accountPlaceholder: '請輸入手機或電子郵件',
  passwordLabel: '密碼', passwordPlaceholder: '請輸入密碼',
  loginBtn: '會員登入', registerBtn: '前往註冊，享受美食',
  divider: '或者', guestBtn: '訪客快速點餐，免登入',
  loginError: '✗ 帳號或密碼錯誤，請再試一次',
  qrTitle: '掃碼現場點餐', qrSubtitle: '掃描 QR Code 立即開始點餐',
  joinUs: '✦ 加入我們', registerTitle: '建立帳號，享受美食旅程',
  registerSubtitle: '註冊後可享有個人化推薦、集點與專屬優惠',
  requiredHint: '* 以下欄位均為必填',
  nameLbl: '會員名稱', namePlaceholder: '請輸入您的名稱', nameError: '✗ 請輸入會員名稱',
  phoneLbl: '手機號碼', phonePlaceholder: '請輸入電話號碼（含區碼）',
  passwordLbl: '密碼', passwordPlaceholder2: '請設定密碼（至少 6 位）', passwordError: '✗ 密碼至少需要 6 個字元',
  confirmPasswordLbl: '確認密碼', confirmPlaceholder: '請再次輸入密碼', confirmError: '✗ 兩次輸入的密碼不一致',
  registerSubmit: '立即註冊，開始點餐', hasAccount: '已有帳號？', backToLogin: '返回登入',
  navHome: '首頁', navMenu: '菜單', navCart: '購物車',
  navTracker: '訂單追蹤', navOrders: '我的訂單', navPromos: '活動專區',
  catAll: '全部', catRice: '飯食', catNoodles: '麵食',
  catSnacks: '小吃', catLight: '輕食', catDrinks: '飲品',
  searchPlaceholder: '搜尋餐點名稱…',
  addToCart: '加入購物車', cartEmpty: '購物車是空的', subtotal: '小計',
  total: '合計', cash: '現金', creditCard: '信用卡', mobilePay: '行動支付',
  checkout: '前往結帳', cancelOrder: '取消訂單', note: '備註', notePlaceholder: '特殊要求、口味偏好…',
  orderTrackerTitle: '訂單追蹤', waiting: '等待中', cooking: '製作中', ready: '可取餐',
  showPwd: '顯示密碼', hidePwd: '隱藏密碼',
};

const JP: LangDict = {
  managementSystem: '管理システム', customerEntrance: 'お客様入口', tagline: 'ゆっくり食べて、満腹の幸せ',
  welcome: 'いらっしゃいませ', loginTitle: '会員ログイン・美味しい旅を始めましょう',
  loginSubtitle: 'ログインで個人化されたおすすめ・ポイント・特典をお楽しみください',
  accountLabel: '電話番号・メールアドレス', accountPlaceholder: '電話番号またはメールアドレスを入力',
  passwordLabel: 'パスワード', passwordPlaceholder: 'パスワードを入力してください',
  loginBtn: 'ログイン', registerBtn: '会員登録して美食を楽しむ',
  divider: 'または', guestBtn: 'ゲスト注文（ログイン不要）',
  loginError: '✗ アカウントまたはパスワードが違います。もう一度お試しください',
  qrTitle: 'QRコードで注文', qrSubtitle: 'スキャンして今すぐ注文',
  joinUs: '✦ ご参加ください', registerTitle: 'アカウントを作成して美食を楽しもう',
  registerSubtitle: '登録で個人化されたおすすめ・ポイント・特典をお楽しみください',
  requiredHint: '* 以下のフィールドはすべて必須です',
  nameLbl: '会員名', namePlaceholder: 'お名前を入力してください', nameError: '✗ 会員名を入力してください',
  phoneLbl: '電話番号', phonePlaceholder: '例：090-XXXX-XXXX',
  passwordLbl: 'パスワード', passwordPlaceholder2: 'パスワードを設定してください（6文字以上）', passwordError: '✗ パスワードは6文字以上必要です',
  confirmPasswordLbl: 'パスワード（確認）', confirmPlaceholder: 'パスワードをもう一度入力してください', confirmError: '✗ パスワードが一致しません',
  registerSubmit: '今すぐ登録して注文する', hasAccount: 'アカウントをお持ちですか？', backToLogin: 'ログインに戻る',
  navHome: 'ホーム', navMenu: 'メニュー', navCart: 'カート',
  navTracker: '注文追跡', navOrders: '注文履歴', navPromos: 'キャンペーン',
  catAll: 'すべて', catRice: 'ご飯料理', catNoodles: '麺料理',
  catSnacks: '軽食', catLight: 'ライト', catDrinks: 'ドリンク',
  searchPlaceholder: '料理名を検索…',
  addToCart: 'カートに追加', cartEmpty: 'カートは空です', subtotal: '小計',
  total: '合計', cash: '現金', creditCard: 'クレジットカード', mobilePay: '電子決済',
  checkout: '注文する', cancelOrder: '注文をキャンセル', note: '備考', notePlaceholder: '特別なご要望・味のご希望…',
  orderTrackerTitle: '注文追跡', waiting: '準備中', cooking: '調理中', ready: 'お受け取り可能',
  showPwd: 'パスワードを表示', hidePwd: 'パスワードを非表示',
};

const KR: LangDict = {
  managementSystem: '관리 시스템', customerEntrance: '고객 입구', tagline: '느긋하게 먹고, 배부르게 즐겨요',
  welcome: '어서 오세요', loginTitle: '회원 로그인・맛있는 여행을 시작해요',
  loginSubtitle: '로그인하면 맞춤 추천, 포인트 및 특별 혜택을 이용할 수 있습니다',
  accountLabel: '전화번호・이메일', accountPlaceholder: '전화번호 또는 이메일 입력',
  passwordLabel: '비밀번호', passwordPlaceholder: '비밀번호를 입력하세요',
  loginBtn: '로그인', registerBtn: '회원가입 후 맛있는 음식을 즐겨요',
  divider: '또는', guestBtn: '게스트 주문（로그인 불필요）',
  loginError: '✗ 계정 또는 비밀번호가 잘못되었습니다. 다시 시도해 주세요',
  qrTitle: 'QR코드로 주문', qrSubtitle: '스캔하여 바로 주문하세요',
  joinUs: '✦ 가입하기', registerTitle: '계정을 만들고 맛있는 음식을 즐겨요',
  registerSubtitle: '등록하면 맞춤 추천, 포인트 및 특별 혜택을 이용할 수 있습니다',
  requiredHint: '* 아래 항목은 모두 필수입니다',
  nameLbl: '회원 이름', namePlaceholder: '이름을 입력하세요', nameError: '✗ 회원 이름을 입력하세요',
  phoneLbl: '전화번호', phonePlaceholder: '예：010-XXXX-XXXX',
  passwordLbl: '비밀번호', passwordPlaceholder2: '비밀번호를 설정하세요（6자 이상）', passwordError: '✗ 비밀번호는 6자 이상이어야 합니다',
  confirmPasswordLbl: '비밀번호 확인', confirmPlaceholder: '비밀번호를 다시 입력하세요', confirmError: '✗ 비밀번호가 일치하지 않습니다',
  registerSubmit: '지금 가입하고 주문하세요', hasAccount: '이미 계정이 있으신가요？', backToLogin: '로그인으로 돌아가기',
  navHome: '홈', navMenu: '메뉴', navCart: '장바구니',
  navTracker: '주문 추적', navOrders: '내 주문', navPromos: '이벤트',
  catAll: '전체', catRice: '밥 요리', catNoodles: '면류',
  catSnacks: '간식', catLight: '라이트', catDrinks: '음료',
  searchPlaceholder: '메뉴 이름 검색…',
  addToCart: '장바구니에 추가', cartEmpty: '장바구니가 비어있습니다', subtotal: '소계',
  total: '합계', cash: '현금', creditCard: '신용카드', mobilePay: '모바일 결제',
  checkout: '주문하기', cancelOrder: '주문 취소', note: '메모', notePlaceholder: '특별 요청, 맛 선호도…',
  orderTrackerTitle: '주문 추적', waiting: '대기 중', cooking: '조리 중', ready: '수령 가능',
  showPwd: '비밀번호 표시', hidePwd: '비밀번호 숨기기',
};

const TRANSLATIONS: Record<CountryCode, LangDict> = { TW, JP, KR };

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  TW: {
    code: 'TW', name: '台灣', nameLocal: '台灣', currency: 'NT$',
    primaryColor: '#D95C1A', hoverColor: '#A84210', bgColor: '#FFFAF3',
    fontFamily: "'Noto Sans TC', sans-serif", discountLimit: 200, dialCode: '+886',
  },
  JP: {
    code: 'JP', name: '日本', nameLocal: '日本', currency: '¥',
    primaryColor: '#B5451A', hoverColor: '#8C3212', bgColor: '#FAF7F2',
    fontFamily: "'Noto Sans JP', 'Noto Sans TC', sans-serif", discountLimit: 1000, dialCode: '+81',
  },
  KR: {
    code: 'KR', name: '韓國', nameLocal: '한국', currency: '₩',
    primaryColor: '#D94F2B', hoverColor: '#B03A1C', bgColor: '#FFF8F5',
    fontFamily: "'Noto Sans KR', 'Noto Sans TC', sans-serif", discountLimit: 10000, dialCode: '+82',
  },
};

@Injectable({ providedIn: 'root' })
export class BranchService {
  private doc = inject(DOCUMENT);

  private _c = signal<CountryCode>((() => {
    try {
      const s = localStorage.getItem('selectedCountry');
      return (s === 'TW' || s === 'JP' || s === 'KR') ? s as CountryCode : 'TW';
    } catch { return 'TW'; }
  })());

  readonly lang = computed(() => TRANSLATIONS[this._c()]);

  get country(): CountryCode { return this._c(); }
  get config(): CountryConfig { return COUNTRY_CONFIGS[this._c()]; }
  get allCountries(): CountryConfig[] { return Object.values(COUNTRY_CONFIGS); }

  setCountry(code: CountryCode): void {
    this._c.set(code);
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
    root.style.setProperty('--brand-font', cfg.fontFamily);
    this.doc.body.style.fontFamily = cfg.fontFamily;
  }

  init(): void { this.applyTheme(this._c()); }
}
