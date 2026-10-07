import { useState, useEffect, useCallback } from "react";

export type Lang = "en" | "ja";
const LANG_KEY = "wallcheck_lang";

export const translations = {
  en: {
    appSubtitle: "Property Inspection System",
    // login
    propertyAccount: "Property Account",
    enterManagementNumber: "Enter your property management number to continue.",
    managementNumber: "Management Number",
    managementNumberPlaceholder: "e.g. PM-2024-001",
    demo: "Demo",
    required: "Required",
    continue: "Continue",
    back: "Back",
    roomAccess: "Room Access",
    account: "Account",
    roomNumber: "Room Number",
    receptionNumber: "Move-Out Reception No.",
    deviceLabel: "Device Label (optional)",
    deviceLabelPlaceholder: "iPhone, Office PC…",
    signingIn: "Signing in…",
    signIn: "Sign In",
    newProperty: "New property? Create an account",
    errRoomRequired: "Please enter the room number.",
    errReceptionRequired: "Please enter the reception number.",
    errLoginFailed: "Login failed.",
    errServer: "Could not reach the server. Please try again.",
    // register
    createAccount: "Create an account",
    createAccountBtn: "Create Account",
    creating: "Creating…",
    companyName: "Company / Property Name",
    companyNameOptional: "(optional)",
    companyNamePlaceholder: "e.g. Riverside Property Group",
    managementNumberHint: "This will be the login ID for all rooms under this property",
    rooms: "Rooms",
    addRoom: "Add room",
    roomNoPlaceholder: "Room no.",
    receptionNoPlaceholder: "Reception no.",
    roomsHint: "You can add more rooms later from the dashboard",
    alreadyHaveAccount: "Already have an account? Sign in",
    errManagementRequired: "Management number is required.",
    errRoomsRequired: "Add at least one room with both fields filled.",
    errRegisterFailed: "Registration failed.",
    accountCreated: "Account created!",
    yourManagementNumber: "Your management number:",
    roomsRegistered: (n: number) => `${n} room${n !== 1 ? "s" : ""} registered`,
    goToSignIn: "Go to Sign In",
    // dashboard nav
    photos: "Photos",
    signOut: "Sign out",
    // photos tab
    takeOrUpload: "Take or upload a photo",
    uploading: "Uploading…",
    photosHint: (room: string) => `Room ${room} · Photos persist across devices`,
    noPhotos: "No photos yet",
    noPhotosHint: "Upload a wallpaper photo to get started",
    // account tab
    currentSession: "Current Session",
    property: "Property",
    name: "Name",
    room: "Room",
    reception: "Reception",
    allRooms: "All Rooms",
    cancel: "Cancel",
    current: "Current",
    switchRoom: "Switch",
    switching: "Switching…",
    addingRoom: "Adding…",
    addRoomBtn: "Add Room",
    newRoomFor: "New room for",
    errBothRequired: "Both fields are required.",
    errAddRoomFailed: "Failed to add room.",
    loadingRooms: "Loading rooms…",
    activeSessions: "Active Sessions",
    refresh: "Refresh",
    thisDevice: "This device",
    signedIn: "Signed in",
    activeLabel: "Active",
    sessionsHint: "Open in another tab or device to see it appear here",
    // AI
    aiAnalysis: "AI Analysis",
    analyzeWithAi: "Analyze with AI",
    analyzingDamage: "Analyzing damage…",
    reAnalyze: "Re-analyze",
    reAnalyzing: "Re-analyzing…",
    errAnalysisFailed: "Analysis failed.",
    errServerShort: "Could not reach server.",
    // time
    justNow: "just now",
    timeAgo: (val: number, unit: "m" | "h" | "d") =>
      unit === "m" ? `${val}m ago` : unit === "h" ? `${val}h ago` : `${val}d ago`,
  },
  ja: {
    appSubtitle: "物件点検システム",
    // login
    propertyAccount: "物件アカウント",
    enterManagementNumber: "物件管理番号を入力してください。",
    managementNumber: "管理番号",
    managementNumberPlaceholder: "例：PM-2024-001",
    demo: "デモ",
    required: "必須",
    continue: "次へ",
    back: "戻る",
    roomAccess: "部屋アクセス",
    account: "アカウント",
    roomNumber: "部屋番号",
    receptionNumber: "退去受付番号",
    deviceLabel: "デバイス名（任意）",
    deviceLabelPlaceholder: "iPhone、事務所PC…",
    signingIn: "ログイン中…",
    signIn: "ログイン",
    newProperty: "新規物件登録はこちら",
    errRoomRequired: "部屋番号を入力してください。",
    errReceptionRequired: "受付番号を入力してください。",
    errLoginFailed: "ログインに失敗しました。",
    errServer: "サーバーに接続できません。再試行してください。",
    // register
    createAccount: "アカウント登録",
    createAccountBtn: "アカウント作成",
    creating: "作成中…",
    companyName: "会社名・物件名",
    companyNameOptional: "（任意）",
    companyNamePlaceholder: "例：リバーサイド不動産",
    managementNumberHint: "この番号が物件内全部屋のログインIDになります",
    rooms: "部屋",
    addRoom: "部屋を追加",
    roomNoPlaceholder: "部屋番号",
    receptionNoPlaceholder: "受付番号",
    roomsHint: "ダッシュボードから後で追加できます",
    alreadyHaveAccount: "既にアカウントをお持ちの方はこちら",
    errManagementRequired: "管理番号は必須です。",
    errRoomsRequired: "部屋番号と受付番号を入力してください。",
    errRegisterFailed: "登録に失敗しました。",
    accountCreated: "アカウントを作成しました！",
    yourManagementNumber: "管理番号：",
    roomsRegistered: (n: number) => `${n}部屋を登録しました`,
    goToSignIn: "ログインへ",
    // dashboard nav
    photos: "写真",
    signOut: "サインアウト",
    // photos tab
    takeOrUpload: "写真を撮影・アップロード",
    uploading: "アップロード中…",
    photosHint: (room: string) => `部屋 ${room} · 写真は全デバイスで共有されます`,
    noPhotos: "まだ写真がありません",
    noPhotosHint: "壁紙の写真をアップロードしてください",
    // account tab
    currentSession: "現在のセッション",
    property: "物件",
    name: "名前",
    room: "部屋",
    reception: "受付",
    allRooms: "全部屋",
    cancel: "キャンセル",
    current: "使用中",
    switchRoom: "切替",
    switching: "切替中…",
    addingRoom: "追加中…",
    addRoomBtn: "部屋を追加",
    newRoomFor: "新規部屋：",
    errBothRequired: "両方の項目を入力してください。",
    errAddRoomFailed: "部屋の追加に失敗しました。",
    loadingRooms: "読み込み中…",
    activeSessions: "アクティブセッション",
    refresh: "更新",
    thisDevice: "このデバイス",
    signedIn: "ログイン",
    activeLabel: "最終活動",
    sessionsHint: "別タブ・デバイスで開くとここに表示されます",
    // AI
    aiAnalysis: "AI分析",
    analyzeWithAi: "AIで損傷を分析",
    analyzingDamage: "損傷を分析中…",
    reAnalyze: "再分析",
    reAnalyzing: "再分析中…",
    errAnalysisFailed: "分析に失敗しました。",
    errServerShort: "サーバーに接続できません。",
    // time
    justNow: "たった今",
    timeAgo: (val: number, unit: "m" | "h" | "d") =>
      unit === "m" ? `${val}分前` : unit === "h" ? `${val}時間前` : `${val}日前`,
  },
} as const;

export type T = typeof translations.en;

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "ja" ? "ja" : "en";
  });

  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  const toggleLang = useCallback(() => setLangState((l) => l === "en" ? "ja" : "en"), []);
  const t = translations[lang] as T;

  return { lang, toggleLang, t };
}

export function formatTimeAgo(dateStr: string, t: T): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.timeAgo(mins, "m");
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t.timeAgo(hrs, "h");
  return t.timeAgo(Math.floor(hrs / 24), "d");
}
