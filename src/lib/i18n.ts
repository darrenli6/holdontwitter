"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { TweetKind } from "@/lib/tweets";

export type Locale = "en" | "zh";
export const DEFAULT_LOCALE: Locale = "en";
const LOCALE_KEY = "tweet-pulse:locale";

const en = {
  appTagline: "Daily tweet goal",
  kinds: { original: "Original", reply: "Replies", retweet: "Retweets", quote: "Quotes" } as Record<TweetKind, string>,
  weekdaysShort: ["S", "M", "T", "W", "T", "F", "S"],
  weekdaysLong: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

  // Toolbar
  refreshAll: "Refresh all",
  settings: "Settings",
  switchLanguage: "切换到中文",
  languageButton: "中文",

  // Onboarding
  heroTitle: "Post every day",
  heroBody:
    "Add your twitterapi.io API key and your X username to see how many times you've posted today (Beijing time): originals, replies, retweets and quotes, measured against your daily goal. Add the accounts you follow to see how often they post too.",

  // Date nav
  chooseDate: "Choose a day",
  prevDay: "Previous day",
  nextDay: "Next day",
  backToToday: "Back to today",
  today: "Today",
  yesterday: "Yesterday",
  formatDate: (m: number, d: number) => `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}`,
  beijingNow: (time: string) => `Beijing time ${time} · auto-refresh every 10 min, at most once a minute`,

  // Me card
  myProgress: "My progress",
  goalMet: "Goal reached!",
  goalExceeded: (n: number) => `Goal reached, ${n} over`,
  leftToday: (n: number) => `${n} to go today`,
  leftThatDay: (n: number) => `Missed by ${n}`,
  truncatedLong: "Too many tweets to count them all. The real number may be higher.",
  last7: "Last 7 days (only days you've opened are recorded)",
  noRecord: "no record",
  daySummary: (n: number, met: boolean) => `${n} posts${met ? ", goal met" : ""}`,
  showDayTweets: (n: number) => `Show ${n} posts from this day`,
  noUsernameTitle: "Your username isn't set",
  noUsernameBody: "Add it and your progress for today will show here.",
  goToSettings: "Open settings",

  // Watch list
  watching: "Watching",
  watchEmpty: "Add a few accounts you follow to see how much they post each day.",
  unwatch: (h: string) => `Stop watching @${h}`,
  ofGoal: (goal: number) => `/ ${goal}`,
  latestAt: (time: string) => `Latest ${time}`,
  noneToday: "Nothing yet today",
  noneThatDay: "Nothing that day",
  truncatedShort: "Too many tweets; partial count.",
  showTweets: "Show posts",
  noTweets: "No posts on this day.",
  noText: "(no text)",

  // Watch adder
  addHandleLabel: "Add a username to watch",
  addHandlePlaceholder: "Username or profile link, several at once",
  add: "Add",
  unrecognized: (list: string[]) => `Couldn't read: ${list.join(", ")}`,
  alreadyAdded: "Already on the list",

  // Settings
  apiKeyLabel: "twitterapi.io API key",
  apiKeyPlaceholder: "Copy it from the twitterapi.io dashboard",
  showKey: "Show API key",
  hideKey: "Hide API key",
  apiKeyHelpBefore: "Stored only in this browser's localStorage. No key yet? Get one at",
  apiKeyHelpAfter: ".",
  myUsername: "My X username",
  usernameInvalid: "Letters, numbers and underscores only, up to 15 characters.",
  dailyGoal: "Daily goal (posts)",
  customGoal: "Custom goal",
  goalHelp: "Originals, replies, retweets and quotes each count as one. The goal applies to everyone.",
  save: "Save",
  cancel: "Cancel",
  saved: "Saved in this browser",

  // Errors (by API error code)
  retry: "Retry",
  retryIn: (s: number) => `Retry in ${s}s`,
  refreshIn: (s: number) => `Refresh available in ${s} seconds`,
  errors: {
    missing_api_key: "Add your API key first",
    invalid_api_key: "Invalid or expired API key",
    rate_limited: "Rate limited by twitterapi.io",
    user_not_found: "User not found",
    invalid_username: "That username isn't valid",
    invalid_date: "Invalid date",
    date_out_of_range: "Only the last 14 days are available",
    timeout: "twitterapi.io timed out",
    network_error: "Couldn't reach twitterapi.io",
  } as Record<string, string>,
  errorHints: {
    invalid_api_key: "Check the API key in Settings.",
    rate_limited: "Wait a few seconds and refresh. Free-tier keys are limited more strictly.",
    user_not_found: "The account doesn't exist, or it's protected or suspended.",
  } as Record<string, string>,
  requestFailed: (status: number) => `Request failed (${status})`,

  notFoundBack: "Back to dashboard",
};

export type Messages = typeof en;

const zh: Messages = {
  appTagline: "每日发推打卡",
  kinds: { original: "原创", reply: "回复", retweet: "转发", quote: "引用" },
  weekdaysShort: ["日", "一", "二", "三", "四", "五", "六"],
  weekdaysLong: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],

  refreshAll: "刷新全部",
  settings: "设置",
  switchLanguage: "Switch to English",
  languageButton: "EN",

  heroTitle: "每天发够",
  heroBody:
    "填入 twitterapi.io 的 API key 和你的用户名，就能看到今天（北京时间）发了多少条：原创、回复、转发、引用分开统计，对照你定的每日目标。也可以加上关注的人，看看他们今天的发推频率。",

  chooseDate: "选择日期",
  prevDay: "前一天",
  nextDay: "后一天",
  backToToday: "回到今天",
  today: "今天",
  yesterday: "昨天",
  formatDate: (m, d) => `${m}月${d}日`,
  beijingNow: (time) => `北京时间 ${time} · 每 10 分钟自动刷新，每分钟最多请求一次`,

  myProgress: "我的进度",
  goalMet: "目标完成！",
  goalExceeded: (n) => `目标完成，超出 ${n} 条`,
  leftToday: (n) => `今天还差 ${n} 条`,
  leftThatDay: (n) => `这天差了 ${n} 条`,
  truncatedLong: "推文太多，只统计到了一部分，实际数量可能更高。",
  last7: "最近 7 天（打开过的日子才有记录）",
  noRecord: "无记录",
  daySummary: (n, met) => `${n} 条${met ? "，达标" : ""}`,
  showDayTweets: (n) => `查看这天的 ${n} 条`,
  noUsernameTitle: "还没填你自己的用户名",
  noUsernameBody: "填上之后，这里会显示你今天的进度。",
  goToSettings: "去设置",

  watching: "关注的人",
  watchEmpty: "加几个你关注的账号，看看他们一天发多少条。",
  unwatch: (h) => `不再关注 @${h}`,
  ofGoal: (goal) => `/ ${goal} 条`,
  latestAt: (time) => `最近一条 ${time}`,
  noneToday: "今天还没发",
  noneThatDay: "这天没发",
  truncatedShort: "推文太多，只统计到一部分。",
  showTweets: "查看推文",
  noTweets: "这一天还没有推文。",
  noText: "（无文字）",

  addHandleLabel: "添加要关注的用户名",
  addHandlePlaceholder: "用户名或主页链接，可一次填多个",
  add: "添加",
  unrecognized: (list) => `无法识别：${list.join("、")}`,
  alreadyAdded: "已经在列表里了",

  apiKeyLabel: "twitterapi.io API key",
  apiKeyPlaceholder: "在 twitterapi.io 控制台复制",
  showKey: "显示 API key",
  hideKey: "隐藏 API key",
  apiKeyHelpBefore: "只存在这个浏览器的 localStorage 里。还没有 key？去",
  apiKeyHelpAfter: "注册获取。",
  myUsername: "我的 X 用户名",
  usernameInvalid: "用户名只能包含字母、数字和下划线，最多 15 位。",
  dailyGoal: "每日目标（条）",
  customGoal: "自定义目标",
  goalHelp: "原创、回复、转发、引用都算一条。所有人共用这个目标。",
  save: "保存",
  cancel: "取消",
  saved: "已保存到本浏览器",

  retry: "重试",
  retryIn: (s) => `${s} 秒后可重试`,
  refreshIn: (s) => `${s} 秒后可刷新`,
  errors: {
    missing_api_key: "请先填写 API key",
    invalid_api_key: "API key 无效或已过期",
    rate_limited: "请求太频繁，被 twitterapi.io 限流了",
    user_not_found: "找不到这个用户",
    invalid_username: "用户名格式不对",
    invalid_date: "日期格式不对",
    date_out_of_range: "只能查看最近 14 天",
    timeout: "twitterapi.io 响应超时",
    network_error: "无法连接 twitterapi.io",
  },
  errorHints: {
    invalid_api_key: "检查一下设置里的 API key。",
    rate_limited: "等几秒再刷新。免费额度的 key 限制更严。",
    user_not_found: "这个用户名不存在，或者账号被保护/封禁。",
  },
  requestFailed: (status) => `请求失败（${status}）`,

  notFoundBack: "回到仪表盘",
};

const MESSAGES: Record<Locale, Messages> = { en, zh };

const listeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    return stored === "zh" || stored === "en" ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

let current: Locale | null = null;

function getLocale(): Locale {
  if (current === null) current = readLocale();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCALE_KEY) {
      current = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setLocale(locale: Locale) {
  current = locale;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Not persisted; still switches for this visit.
  }
  listeners.forEach((listener) => listener());
}

/** English on the server and during hydration, then the stored choice. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}

export function useT(): Messages {
  return MESSAGES[useLocale()];
}

/** Keeps <html lang> in step with the chosen language. Mount once. */
export function useDocumentLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);
}
