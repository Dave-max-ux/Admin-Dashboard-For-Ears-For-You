import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, MessageSquare, Heart, BookOpen,
  FileText, Shield, Bell, Monitor, ClipboardList, Settings,
  ChevronLeft, ChevronRight, Search, LogOut, Activity,
  AlertTriangle, CheckCircle, XCircle, Eye, Filter, Download,
  MoreVertical, Plus, RefreshCw, Lock, Globe, Mail, Clock,
  ArrowUp, ArrowDown, Edit, Trash2, ChevronDown, Send, X,
  User, Key, Zap, Database, Server, Cpu, BarChart2, Menu,
  AlertCircle, TrendingUp, Layers, Sparkles, Radio, Phone,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart as RPieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// API-COMPATIBLE TYPE DEFINITIONS
// Maps directly to backend REST endpoints — field names match Spring Boot DTOs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/dashboard
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalJournalEntries: number;
  totalMoodLogs: number;
  totalAiChats: number;
  totalReports: number;
}

// GET /api/users
type UserRole   = "USER" | "ADMIN" | "MODERATOR";
type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
}

// GET /api/analytics
interface UserGrowthPoint     { date: string; count: number; }
interface DailyActivePoint    { date: string; count: number; }
interface MoodStatPoint       { mood: string; count: number; percentage: number; }
interface JournalStatPoint    { date: string; entries: number; }
interface AIUsageStatPoint    { date: string; requests: number; successful: number; }
interface AnalyticsPayload {
  userGrowth: UserGrowthPoint[];
  dailyActiveUsers: DailyActivePoint[];
  moodStatistics: MoodStatPoint[];
  journalStatistics: JournalStatPoint[];
  aiUsageStatistics: AIUsageStatPoint[];
}

// AI Monitoring (sub-section of GET /api/analytics)
type AIProviderStatus = "OPERATIONAL" | "DEGRADED" | "DOWN";
interface AIMonitoringStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  apiResponseTime: number;           // ms
  aiProviderStatus: AIProviderStatus;
}

// GET /api/reports
type ReportType   = "HARASSMENT" | "SPAM" | "INAPPROPRIATE_CONTENT" | "ABUSE" | "FAKE_ACCOUNT";
type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
interface ReportRecord {
  reportId: string;
  reportedUser: string;
  reportType: ReportType;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

// GET /api/notifications
type NotifAudience = "ALL" | "PREMIUM" | "BASIC" | "INACTIVE";
interface NotificationRecord {
  id: string;
  notificationTitle: string;
  notificationMessage: string;
  targetAudience: NotifAudience;
  sentAt: string;
}

// GET /api/settings
interface APIConfiguration {
  baseUrl: string;
  apiVersion: string;
  rateLimitPerMinute: number;
  timeoutMs: number;
}
interface EmailConfiguration {
  smtpHost: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  tlsEnabled: boolean;
}
interface OTPConfiguration {
  otpLength: number;
  otpExpiryMinutes: number;
  maxAttempts: number;
  deliveryChannel: "EMAIL" | "SMS" | "BOTH";
}
interface SecuritySettings {
  jwtExpiryMinutes: number;
  refreshTokenExpiryDays: number;
  mfaEnabled: boolean;
  ipWhitelistEnabled: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
}
interface SettingsPayload {
  apiConfiguration: APIConfiguration;
  emailConfiguration: EmailConfiguration;
  otpConfiguration: OTPConfiguration;
  securitySettings: SecuritySettings;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Production-realistic, maps 1:1 to backend response shapes
// Replace with axios calls: const data = await axios.get<T>('/api/...')
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers:           124847,
  activeUsers:            8234,
  totalJournalEntries:  341209,
  totalMoodLogs:        892741,
  totalAiChats:        3812045,
  totalReports:             183,
};

const MOCK_USERS: UserRecord[] = [
  { id: "usr_01J2K4M8P9",  fullName: "Priya Nair",       email: "priya.nair@gmail.com",      role: "USER",      status: "ACTIVE",    createdAt: "2025-03-12T09:14:00Z", lastLogin: "2025-06-18T09:12:00Z" },
  { id: "usr_01J2K3R7Q2",  fullName: "Jordan Mitchell",  email: "j.mitchell@outlook.com",    role: "USER",      status: "ACTIVE",    createdAt: "2025-04-02T14:22:00Z", lastLogin: "2025-06-18T08:47:00Z" },
  { id: "usr_01J2K2S6N1",  fullName: "Anika Osei",       email: "anika.osei@gmail.com",      role: "USER",      status: "ACTIVE",    createdAt: "2025-04-18T11:05:00Z", lastLogin: "2025-06-18T07:33:00Z" },
  { id: "usr_01J1H8T4L0",  fullName: "Marcus Delacroix", email: "marcus.d@proton.me",        role: "USER",      status: "SUSPENDED", createdAt: "2025-02-28T08:30:00Z", lastLogin: "2025-06-17T23:58:00Z" },
  { id: "usr_01J2L9U3K8",  fullName: "Sofia Reyes",      email: "sofia.reyes@gmail.com",     role: "USER",      status: "ACTIVE",    createdAt: "2025-05-01T16:44:00Z", lastLogin: "2025-06-17T21:14:00Z" },
  { id: "usr_01J0G7V2J5",  fullName: "Ethan Kowalski",   email: "ethan.k@yahoo.com",         role: "USER",      status: "INACTIVE",  createdAt: "2025-01-15T10:20:00Z", lastLogin: "2025-06-17T19:30:00Z" },
  { id: "usr_01J2M8W1H3",  fullName: "Fatima Hassan",    email: "fatima.h@gmail.com",        role: "USER",      status: "ACTIVE",    createdAt: "2025-05-22T07:58:00Z", lastLogin: "2025-06-17T17:45:00Z" },
  { id: "usr_01ADM1N0001", fullName: "System Admin",     email: "admin@earsfor.you",         role: "ADMIN",     status: "ACTIVE",    createdAt: "2024-12-01T00:00:00Z", lastLogin: "2025-06-18T08:00:00Z" },
  { id: "usr_01MOD0R0001", fullName: "Content Moderator",email: "mod@earsfor.you",           role: "MODERATOR", status: "ACTIVE",    createdAt: "2025-01-01T00:00:00Z", lastLogin: "2025-06-18T08:21:00Z" },
  { id: "usr_01J2N7X9G4",  fullName: "Liam Nguyen",      email: "liam.nguyen@gmail.com",     role: "USER",      status: "BANNED",    createdAt: "2025-03-08T12:33:00Z", lastLogin: "2025-06-10T14:22:00Z" },
];

const MOCK_ANALYTICS: AnalyticsPayload = {
  userGrowth: [
    { date: "Jun 12", count: 118240 }, { date: "Jun 13", count: 119810 },
    { date: "Jun 14", count: 121340 }, { date: "Jun 15", count: 122100 },
    { date: "Jun 16", count: 123450 }, { date: "Jun 17", count: 124100 },
    { date: "Jun 18", count: 124847 },
  ],
  dailyActiveUsers: [
    { date: "Jun 12", count: 7120 }, { date: "Jun 13", count: 7450 },
    { date: "Jun 14", count: 7890 }, { date: "Jun 15", count: 8010 },
    { date: "Jun 16", count: 7760 }, { date: "Jun 17", count: 8140 },
    { date: "Jun 18", count: 8234 },
  ],
  moodStatistics: [
    { mood: "Happy",   count: 5095, percentage: 41 },
    { mood: "Neutral", count: 3473, percentage: 28 },
    { mood: "Anxious", count: 2232, percentage: 18 },
    { mood: "Sad",     count: 1240, percentage: 10 },
    { mood: "Angry",   count:  373, percentage: 3  },
  ],
  journalStatistics: [
    { date: "Jun 12", entries: 4120 }, { date: "Jun 13", entries: 4380 },
    { date: "Jun 14", entries: 3980 }, { date: "Jun 15", entries: 4710 },
    { date: "Jun 16", entries: 4290 }, { date: "Jun 17", entries: 4501 },
    { date: "Jun 18", entries: 4291 },
  ],
  aiUsageStatistics: [
    { date: "Jun 12", requests: 3420, successful: 3401 },
    { date: "Jun 13", requests: 3680, successful: 3659 },
    { date: "Jun 14", requests: 3150, successful: 3131 },
    { date: "Jun 15", requests: 3890, successful: 3874 },
    { date: "Jun 16", requests: 3640, successful: 3618 },
    { date: "Jun 17", requests: 3811, successful: 3793 },
    { date: "Jun 18", requests: 3891, successful: 3880 },
  ],
};

const MOCK_AI_MONITORING: AIMonitoringStats = {
  totalRequests:       3891,
  successfulRequests:  3880,
  failedRequests:        11,
  apiResponseTime:      178,
  aiProviderStatus:   "OPERATIONAL",
};

const MOCK_REPORTS: ReportRecord[] = [
  { reportId: "rpt_9A2K8M", reportedUser: "usr_01J1H8T4L0", reportType: "HARASSMENT",           description: "User sent repeated hostile messages after being blocked.",       status: "PENDING",  createdAt: "2025-06-18T09:02:00Z" },
  { reportId: "rpt_7B3L9N", reportedUser: "usr_01J2N7X9G4", reportType: "INAPPROPRIATE_CONTENT", description: "Shared external links to self-harm forums in public chat.",      status: "REVIEWED", createdAt: "2025-06-18T07:41:00Z" },
  { reportId: "rpt_5C4P0R", reportedUser: "usr_01J0G7V2J5", reportType: "SPAM",                  description: "Sending repeated promotional messages to other users.",          status: "RESOLVED", createdAt: "2025-06-17T22:15:00Z" },
  { reportId: "rpt_3D5Q1S", reportedUser: "usr_01J2K3R7Q2", reportType: "FAKE_ACCOUNT",          description: "Account appears to be impersonating a licensed therapist.",      status: "PENDING",  createdAt: "2025-06-17T18:30:00Z" },
  { reportId: "rpt_1E6R2T", reportedUser: "usr_01J2K4M8P9", reportType: "ABUSE",                 description: "Targeted verbal abuse directed at another user in group chat.",  status: "DISMISSED",createdAt: "2025-06-17T14:55:00Z" },
  { reportId: "rpt_8F7S3U", reportedUser: "usr_01J2L9U3K8", reportType: "HARASSMENT",            description: "Multiple users reported aggressive behaviour in mood threads.",   status: "REVIEWED", createdAt: "2025-06-17T11:20:00Z" },
];

const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  { id: "notif_001", notificationTitle: "New Feature: AI Mood Insights",           notificationMessage: "We have launched enhanced AI mood analysis. Open the app to explore your personalised insights.", targetAudience: "ALL",      sentAt: "2025-06-18T08:00:00Z" },
  { id: "notif_002", notificationTitle: "Premium Upgrade — Limited Offer",          notificationMessage: "Upgrade to Premium before June 30 and get 3 months free. Tap to learn more.",                    targetAudience: "BASIC",     sentAt: "2025-06-17T10:00:00Z" },
  { id: "notif_003", notificationTitle: "We Miss You 💙",                           notificationMessage: "It has been a while. Come back and check in with how you are feeling today.",                    targetAudience: "INACTIVE",  sentAt: "2025-06-16T09:00:00Z" },
  { id: "notif_004", notificationTitle: "Exclusive Therapist Session Available",    notificationMessage: "As a Premium member you have access to a free 20-minute therapist session this week.",           targetAudience: "PREMIUM",   sentAt: "2025-06-15T12:00:00Z" },
  { id: "notif_005", notificationTitle: "System Maintenance — June 20, 2:00 AM",   notificationMessage: "EarsForYou will undergo scheduled maintenance on June 20 from 2:00–4:00 AM EST.",               targetAudience: "ALL",       sentAt: "2025-06-14T16:00:00Z" },
];

const MOCK_SETTINGS: SettingsPayload = {
  apiConfiguration: {
    baseUrl: "https://api.earsfor.you",
    apiVersion: "v1",
    rateLimitPerMinute: 120,
    timeoutMs: 5000,
  },
  emailConfiguration: {
    smtpHost: "smtp.sendgrid.net",
    smtpPort: 587,
    senderEmail: "noreply@earsfor.you",
    senderName: "EarsForYou",
    tlsEnabled: true,
  },
  otpConfiguration: {
    otpLength: 6,
    otpExpiryMinutes: 10,
    maxAttempts: 3,
    deliveryChannel: "EMAIL",
  },
  securitySettings: {
    jwtExpiryMinutes: 60,
    refreshTokenExpiryDays: 7,
    mfaEnabled: true,
    ipWhitelistEnabled: false,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — Glass utility helpers
// ─────────────────────────────────────────────────────────────────────────────

const glass = "rounded-2xl border border-white/[0.08] backdrop-blur-xl";
const glassCard = `${glass} bg-white/[0.04]`;
const glassCardHover = `${glassCard} hover:bg-white/[0.06] transition-colors duration-200`;
const glassInput = "w-full rounded-xl border border-white/[0.1] bg-white/[0.06] text-slate-100 placeholder:text-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition backdrop-blur-sm";

const CHART_COLORS = {
  blue:   "#3B82F6",
  violet: "#8B5CF6",
  cyan:   "#06B6D4",
  green:  "#10B981",
  amber:  "#F59E0B",
  rose:   "#F43F5E",
};

// Utility helpers
function downloadCSV(filename: string, rows: Array<Array<string | number | boolean>>) {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function setNested(obj: any, path: string, value: any) {
  const parts = path.split('.');
  const out = { ...obj };
  let cur: any = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    cur[p] = { ...(cur[p] ?? {}) };
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return out;
}

function getNested(obj: any, path: string) {
  return path.split('.').reduce((acc, p) => (acc ? acc[p] : undefined), obj);
}

// Background gradient mesh
const PageBg = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #020810 0%, #030B18 40%, #040D20 70%, #030B18 100%)" }} />
    <div className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full opacity-20"
      style={{ background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)" }} />
    <div className="absolute -bottom-64 -right-32 w-[700px] h-[700px] rounded-full opacity-15"
      style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)" }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.06]"
      style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.6) 0%, transparent 70%)" }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type BtnSize    = "xs" | "sm" | "md" | "lg";

function Btn({
  children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button",
}: {
  children: React.ReactNode; variant?: BtnVariant; size?: BtnSize;
  onClick?: () => void; className?: string; disabled?: boolean; type?: "button"|"submit";
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes: Record<BtnSize, string> = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  const variants: Record<BtnVariant, string> = {
    primary:  "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20",
    secondary:"bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20",
    ghost:    "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]",
    danger:   "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    outline:  "border border-white/[0.1] text-slate-300 hover:bg-white/[0.06] bg-white/[0.03]",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

type BadgeColor = "blue" | "violet" | "cyan" | "green" | "amber" | "red" | "gray" | "rose";
function Badge({ label, color = "gray" }: { label: string; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    cyan:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red:    "bg-red-500/10 text-red-400 border-red-500/20",
    gray:   "bg-white/[0.06] text-slate-400 border-white/[0.08]",
    rose:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${colors[color]}`}>
      {label}
    </span>
  );
}

function StatusPulse({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    "bg-emerald-400",
    INACTIVE:  "bg-slate-500",
    SUSPENDED: "bg-amber-400",
    BANNED:    "bg-red-500",
    OPERATIONAL:"bg-emerald-400",
    DEGRADED:  "bg-amber-400",
    DOWN:      "bg-red-500",
  };
  return (
    <span className="relative inline-flex">
      <span className={`w-2 h-2 rounded-full ${map[status] ?? "bg-slate-500"}`} />
      {(status === "ACTIVE" || status === "OPERATIONAL") && (
        <span className={`absolute inset-0 rounded-full ${map[status]} animate-ping opacity-75`} />
      )}
    </span>
  );
}

// Stat card — API field name passed as `field` prop for developer reference
function StatCard({
  label, field, value, sub, trend, trendUp, icon: Icon, accent = false, gradient, onClick,
}: {
  label: string; field: keyof DashboardStats; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean; icon: React.ElementType;
  accent?: boolean; gradient?: string; onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { onClick(); } } : undefined}
      onClick={onClick}
      className={`${glassCard} p-5 relative overflow-hidden group ${onClick ? "cursor-pointer" : ""}`}
      title={`API field: ${field}`}>
      {/* Gradient glow */}
      {gradient && (
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 transition-opacity duration-300 group-hover:opacity-30"
          style={{ background: `radial-gradient(circle, ${gradient}, transparent 70%)` }} />
      )}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 font-[Plus_Jakarta_Sans] tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? "bg-blue-500/20" : "bg-white/[0.06]"}`}>
          <Icon size={18} className={accent ? "text-blue-400" : "text-slate-400"} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
          {trendUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          <span>{trend}</span>
          <span className="text-slate-600 font-normal ml-0.5">vs last week</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white font-[Plus_Jakarta_Sans]">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}

function TableWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${glassCard} overflow-hidden ${className}`}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap border-b border-white/[0.06]">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 text-sm ${className}`}>{children}</td>;
}

function ChartCard({ title, sub, children, className = "" }: {
  title: string; sub?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`${glassCard} p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${glass} bg-[#0D1635]/90 px-3 py-2.5 text-xs shadow-xl`}>
      <p className="font-medium text-white mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-medium text-white">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1400);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <PageBg />

      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-14 relative">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Floating orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)" }} />
        <div className="absolute bottom-32 left-8 w-56 h-56 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${glass} bg-blue-500/20`}>
              <Sparkles size={18} className="text-blue-400" />
            </div>
            <div>
              <span className="text-white font-bold font-[Plus_Jakarta_Sans]">EarsForYou</span>
              <span className="ml-2 text-xs bg-blue-500/15 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight font-[Plus_Jakarta_Sans] mb-5">
            Mental wellness<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
              at scale.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-md">
            The ES4U administration console gives your team complete visibility, control, and real-time analytics across the entire platform.
          </p>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {[
              { label: "Total Users",      value: "124,847" },
              { label: "AI Conversations", value: "3.8M+"   },
              { label: "Journal Entries",  value: "341K+"   },
              { label: "Platform Uptime",  value: "99.98%"  },
            ].map(s => (
              <div key={s.label} className={`${glassCard} p-4`}>
                <p className="text-xl font-bold text-white font-[Plus_Jakarta_Sans]">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-600 text-xs">
          © 2025 EarsForYou Inc. · SOC 2 Type II · HIPAA · GDPR Compliant
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${glass} bg-blue-500/20`}>
              <Sparkles size={15} className="text-blue-400" />
            </div>
            <span className="font-bold text-white font-[Plus_Jakarta_Sans]">EarsForYou Admin</span>
          </div>

          <div className={`${glassCard} p-8`}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white font-[Plus_Jakarta_Sans]">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your administrator account</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5 uppercase tracking-wider">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@earsfor.you"
                    className={`${glassInput} pl-10`} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${glassInput} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    <Eye size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setRemember(v => !v)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${remember ? "bg-blue-500 border-blue-500" : "border-white/20 bg-white/[0.04]"}`}>
                    {remember && <CheckCircle size={10} className="text-white" />}
                  </button>
                  <span className="text-xs text-slate-400">Remember me for 30 days</span>
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", boxShadow: "0 8px 24px rgba(59,130,246,0.25)" }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating…</>
                  : "Sign in to Admin Console"
                }
              </button>
            </form>

            {/* Security indicators */}
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-center gap-5 text-xs text-slate-600">
                {[
                  { icon: Lock,   label: "256-bit TLS"      },
                  { icon: Shield, label: "2FA Enabled"      },
                  { icon: Key,    label: "JWT Auth"         },
                  { icon: Server, label: "SOC 2 Certified"  },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <s.icon size={11} className="text-blue-500" />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// Endpoint labels show developers which GET endpoint each section calls
// ─────────────────────────────────────────────────────────────────────────────

type SectionId = "overview"|"users"|"analytics"|"ai-monitoring"|"reports"|"notifications"|"emergency"|"settings";

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType; endpoint: string; badge?: string }[] = [
  { id: "overview",       label: "Dashboard",       icon: LayoutDashboard, endpoint: "GET /api/dashboard" },
  { id: "users",          label: "User Management", icon: Users,           endpoint: "GET /api/users" },
  { id: "analytics",      label: "Analytics",       icon: BarChart2,       endpoint: "GET /api/analytics" },
  { id: "ai-monitoring",  label: "AI Monitoring",   icon: Sparkles,        endpoint: "GET /api/analytics" },
  { id: "reports",        label: "Reports",         icon: Shield,          endpoint: "GET /api/reports",       badge: "6" },
  { id: "notifications",  label: "Notifications",   icon: Bell,            endpoint: "GET /api/notifications" },
  { id: "emergency",      label: "Emergency",       icon: Shield,          endpoint: "GET /api/emergency-resources" },
  { id: "settings",       label: "Settings",        icon: Settings,        endpoint: "GET /api/settings" },
];

function Sidebar({ active, setActive, collapsed, setCollapsed }: {
  active: SectionId; setActive: (s: SectionId) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside className="flex flex-col h-full flex-shrink-0 border-r border-white/[0.06]"
      style={{ width: collapsed ? 64 : 240, background: "rgba(3,11,24,0.9)", backdropFilter: "blur(20px)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Sparkles size={15} className="text-blue-400" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm font-[Plus_Jakarta_Sans] whitespace-nowrap leading-none">EarsForYou</p>
            <p className="text-slate-600 text-[10px] whitespace-nowrap mt-0.5">Admin Console v1.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 cursor-pointer relative group
                ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"}`}>

              {isActive && (
                <>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "linear-gradient(180deg, #3B82F6, #8B5CF6)" }} />
                  <span className="absolute inset-0 opacity-10"
                    style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.3), transparent)" }} />
                </>
              )}

              <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-lg transition
                ${isActive ? "bg-blue-500/20" : "group-hover:bg-white/[0.06]"}`}>
                <item.icon size={14} className={isActive ? "text-blue-400" : ""} />
              </div>

              {!collapsed && (
                <>
                  <span className="flex-1 text-left whitespace-nowrap text-xs font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{item.badge}</span>
                  )}
                </>
              )}

              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  style={{ background: "#0D1635", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {item.label}
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{item.endpoint}</p>
                </div>
              )}
            </button>
          );
        })}

        {/* Endpoint reference (only expanded) */}
        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">API Endpoint</p>
            <p className="text-[10px] font-mono text-blue-500/70 leading-relaxed">
              {NAV_ITEMS.find(n => n.id === active)?.endpoint ?? "—"}
            </p>
          </div>
        )}
      </nav>

      {/* Collapse */}
      <div className="px-3 py-4 border-t border-white/[0.06] flex-shrink-0">
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 text-slate-600 hover:text-slate-400 text-xs rounded-xl hover:bg-white/[0.04] transition">
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAVIGATION BAR
// ─────────────────────────────────────────────────────────────────────────────

function TopNav({ section, onLogout, onNavigate, onSearch }: { section: SectionId; onLogout: () => void; onNavigate?: (s: SectionId, opts?: { tab?: "api"|"email"|"otp"|"security" }) => void; onSearch?: (section: SectionId, query: string) => void }) {
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);
  const profilePanelRef = useRef<HTMLDivElement | null>(null);
  const label = NAV_ITEMS.find(n => n.id === section)?.label ?? "Dashboard";
  const endpoint = NAV_ITEMS.find(n => n.id === section)?.endpoint;

  const notifications = [
    { msg: "Report rpt_9A2K8M requires immediate review",         time: "2m ago",  color: "text-red-400"     },
    { msg: "AI provider response time elevated — 178ms avg",      time: "14m ago", color: "text-amber-400"   },
    { msg: "New user registration milestone: 124,847 users",      time: "1h ago",  color: "text-emerald-400" },
    { msg: "Scheduled maintenance window in 2 days",              time: "3h ago",  color: "text-blue-400"    },
  ];

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (profileOpen) {
        if (profilePanelRef.current && profileBtnRef.current && !profilePanelRef.current.contains(t) && !profileBtnRef.current.contains(t)) {
          setProfileOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [profileOpen]);

  const handleSearchKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch?.(section, query);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      (e.target as HTMLInputElement).focus();
      e.preventDefault();
    }
  }, [onSearch, section, query]);

  return (
    <header className="h-14 flex items-center px-5 gap-4 flex-shrink-0 border-b border-white/[0.06]"
      style={{ background: "rgba(3,11,24,0.8)", backdropFilter: "blur(20px)" }}>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">Admin</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300 font-medium">{label}</span>
          {endpoint && (
            <span className="hidden xl:inline text-[10px] font-mono text-blue-500/50 ml-2 border border-blue-500/20 bg-blue-500/5 px-2 py-0.5 rounded-full">
              {endpoint}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleSearchKey}
          placeholder="Search users, reports, logs…"
          className="pl-8 pr-12 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 placeholder:text-slate-600 w-60 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 transition" />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono hidden xl:block">⌘K</kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
          className="relative w-8 h-8 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-200 transition">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        {notifOpen && (
          <div className={`absolute right-0 top-11 w-80 ${glass} bg-[#0A0F1E]/95 shadow-2xl z-50 overflow-hidden`}>
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-semibold text-sm text-white">Notifications</span>
              <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">4 new</span>
            </div>
            {notifications.map((n, i) => (
              <div key={i} className="px-4 py-3 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0 cursor-pointer transition">
                <p className={`text-xs font-medium ${n.color}`}>{n.msg}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{n.time}</p>
              </div>
            ))}
            <div className="px-4 py-2.5 text-center border-t border-white/[0.06]">
              <button onClick={() => { onNavigate?.('notifications'); setNotifOpen(false); }} className="text-xs text-blue-400 hover:text-blue-300 transition">View all notifications</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button ref={profileBtnRef} onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
          className="flex items-center gap-2 rounded-xl hover:bg-white/[0.06] px-2 py-1.5 transition">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>SA</div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-white leading-none">Super Admin</p>
            <p className="text-[10px] text-slate-500">admin@earsfor.you</p>
          </div>
          <ChevronDown size={13} className="text-slate-500" />
        </button>
        {profileOpen && (
          <div ref={profilePanelRef}
            className={`${glass} bg-[#0A0F1E]/95 shadow-2xl`} 
            style={{ position: 'absolute', right: 0, top: 48, minWidth: 208, zIndex: 9999 }}>
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white">Super Admin</p>
              <p className="text-xs text-slate-500">RBAC: SUPER_ADMIN</p>
            </div>
            <div className="max-h-72 overflow-auto">
            {[
              { label: "My Profile",  icon: User },
              { label: "Security",    icon: Shield },
              { label: "API Tokens",  icon: Key },
            ].map(item => (
              <button key={item.label}
                onClick={() => {
                  if (item.label === 'My Profile') {
                    onNavigate?.('users');
                  } else if (item.label === 'Security') {
                    onNavigate?.('settings', { tab: 'security' });
                  } else if (item.label === 'API Tokens') {
                    onNavigate?.('settings', { tab: 'api' });
                  }
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition">
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
            </div>
            <div className="border-t border-white/[0.06]">
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: DASHBOARD OVERVIEW — GET /api/dashboard
// ─────────────────────────────────────────────────────────────────────────────

function DashboardOverview({ onNavigate }: { onNavigate?: (s: SectionId, opts?: { tab?: "api"|"email"|"otp"|"security" }) => void }) {
  const [stats, setStats] = useState(MOCK_DASHBOARD_STATS);

  const refresh = () => setStats(s => ({
    ...s,
    totalUsers: Math.max(0, s.totalUsers + Math.floor(Math.random() * 100 - 50)),
    activeUsers: Math.max(0, s.activeUsers + Math.floor(Math.random() * 20 - 10)),
    totalJournalEntries: Math.max(0, s.totalJournalEntries + Math.floor(Math.random() * 200 - 100)),
    totalMoodLogs: Math.max(0, s.totalMoodLogs + Math.floor(Math.random() * 200 - 100)),
    totalAiChats: Math.max(0, s.totalAiChats + Math.floor(Math.random() * 1000 - 500)),
    totalReports: Math.max(0, s.totalReports + Math.floor(Math.random() * 5 - 2)),
  }));

  const exportReport = () => {
    const rows: Array<Array<string>> = [["metric", "value"], ...Object.entries(stats).map(([k, v]) => [k, String(v)])];
    downloadCSV('dashboard-report.csv', rows as any);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard Overview"
        sub="Real-time platform metrics · Endpoint: GET /api/dashboard · Updated Jun 18, 2025 09:41 EST">
        <Btn variant="outline" onClick={refresh}><RefreshCw size={12} />Refresh</Btn>
        <Btn onClick={exportReport}><Download size={12} />Export Report</Btn>
      </SectionHeader>

      {/* KPI Grid — each card maps to a DashboardStats field */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard field="totalUsers"          label="Total Users"         value={stats.totalUsers}          trend="+12.3%" trendUp icon={Users}        accent gradient={CHART_COLORS.blue} onClick={() => onNavigate?.('users')} />
        <StatCard field="activeUsers"         label="Active Users"        value={stats.activeUsers}         trend="+5.1%"  trendUp icon={Activity}           gradient={CHART_COLORS.cyan} onClick={() => onNavigate?.('users')} />
        <StatCard field="totalJournalEntries" label="Journal Entries"     value={stats.totalJournalEntries} trend="+6.1%"  trendUp icon={BookOpen}           gradient={CHART_COLORS.violet} onClick={() => onNavigate?.('analytics')} />
        <StatCard field="totalMoodLogs"       label="Mood Logs"           value={stats.totalMoodLogs}       trend="+3.2%"  trendUp icon={Heart}              gradient={CHART_COLORS.green} onClick={() => onNavigate?.('analytics')} />
        <StatCard field="totalAiChats"        label="AI Chats"            value={stats.totalAiChats}        trend="+8.7%"  trendUp icon={Sparkles}           gradient={CHART_COLORS.amber} onClick={() => onNavigate?.('ai-monitoring')} />
        <StatCard field="totalReports"        label="Open Reports"        value={stats.totalReports}        trend="+4"     trendUp={false} icon={Shield}     gradient={CHART_COLORS.rose} onClick={() => onNavigate?.('reports')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* userGrowth */}
        <ChartCard title="User Growth" sub="Field: userGrowth · last 7 days" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_ANALYTICS.userGrowth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gUG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="count" name="Total Users" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#gUG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* moodStatistics — pie */}
        <ChartCard title="Mood Statistics" sub="Field: moodStatistics · today">
          <ResponsiveContainer width="100%" height={160}>
            <RPieChart>
              <Pie data={MOCK_ANALYTICS.moodStatistics} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                paddingAngle={3} dataKey="count" nameKey="mood">
                {MOCK_ANALYTICS.moodStatistics.map((_, i) => (
                  <Cell key={i} fill={[CHART_COLORS.green, CHART_COLORS.cyan, CHART_COLORS.amber, CHART_COLORS.violet, CHART_COLORS.rose][i]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {MOCK_ANALYTICS.moodStatistics.map((m, i) => (
              <div key={m.mood} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: [CHART_COLORS.green, CHART_COLORS.cyan, CHART_COLORS.amber, CHART_COLORS.violet, CHART_COLORS.rose][i] }} />
                <span className="text-slate-500">{m.mood}</span>
                <span className="text-white font-medium ml-auto">{m.percentage}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* AI usage + journal stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="AI Usage Statistics" sub="Field: aiUsageStatistics · requests vs successful">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_ANALYTICS.aiUsageStatistics} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
              <Bar dataKey="requests"   name="Requests"   fill={CHART_COLORS.blue}   radius={[3,3,0,0]} fillOpacity={0.7} />
              <Bar dataKey="successful" name="Successful" fill={CHART_COLORS.green}  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Journal Statistics" sub="Field: journalStatistics · daily entries">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MOCK_ANALYTICS.journalStatistics} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gJS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.violet} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="entries" name="Entries" stroke={CHART_COLORS.violet} strokeWidth={2} fill="url(#gJS)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: USER MANAGEMENT — GET /api/users
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_BADGE:   Record<UserRole,   BadgeColor> = { USER: "gray", ADMIN: "blue", MODERATOR: "violet" };
const STATUS_BADGE: Record<UserStatus, BadgeColor> = { ACTIVE: "green", INACTIVE: "gray", SUSPENDED: "amber", BANNED: "red" };

function UserManagement() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | UserStatus>("ALL");
  const [selected,     setSelected]     = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // Replace: const users = await axios.get<UserRecord[]>('/api/users')
  const [users, setUsers] = useState<UserRecord[]>(() => {
    try {
      const local = localStorage.getItem('local_users');
      const parsed = local ? JSON.parse(local) as UserRecord[] : [];
      return [...parsed, ...MOCK_USERS];
    } catch (e) { return MOCK_USERS; }
  });

  // Do not show users with BANNED status in the User Management UI
  const visibleUsers = users.filter(u => u.status !== 'BANNED');

  const filtered = visibleUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === "ALL" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSelected = paged.length > 0 && paged.every(u => selected.includes(u.id));

  return (
    <div className="space-y-6">
      <SectionHeader title="User Management" sub={`${visibleUsers.length} total users · Endpoint: GET /api/users`}>
      </SectionHeader>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Users",  value: visibleUsers.length,                                          icon: Users,       gradient: CHART_COLORS.blue },
          { label: "Active",       value: visibleUsers.filter(u => u.status === "ACTIVE").length,       icon: CheckCircle, gradient: CHART_COLORS.green },
          { label: "Suspended",    value: visibleUsers.filter(u => u.status === "SUSPENDED").length,    icon: AlertTriangle,gradient: CHART_COLORS.amber },
        ].map(s => (
          <div key={s.label} className={`${glassCard} p-4 relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${s.gradient}, transparent 70%)` }} />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-white mt-0.5 font-[Plus_Jakarta_Sans]">{s.value}</p>
              </div>
              <s.icon size={16} className="text-slate-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className={`${glassCard} p-4 flex flex-wrap items-center gap-3`}>
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by id, fullName, email…"
            className={`${glassInput} pl-8`} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600 mr-1">Status:</span>
          {( ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"] as const ).map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${filterStatus === s ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"}`}>
              {s}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-400">{selected.length} selected</span>
            <Btn variant="danger" size="xs"><Lock size={11} />Suspend</Btn>
            <Btn variant="danger" size="xs"><Trash2 size={11} />Delete</Btn>
          </div>
        )}
      </div>

      {/* Table — field names map directly to UserRecord interface */}
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>
                <button onClick={() => setSelected(allSelected ? [] : paged.map(u => u.id))}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${allSelected ? "bg-blue-500 border-blue-500" : "border-white/20 bg-white/[0.04]"}`}>
                  {allSelected && <CheckCircle size={10} className="text-white" />}
                </button>
              </Th>
              {["id", "fullName", "email", "role", "status", "createdAt", "lastLogin", ""].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition group">
                <Td>
                  <button onClick={() => toggleSelect(u.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${selected.includes(u.id) ? "bg-blue-500 border-blue-500" : "border-white/20 bg-white/[0.04]"}`}>
                    {selected.includes(u.id) && <CheckCircle size={10} className="text-white" />}
                  </button>
                </Td>
                <Td className="font-mono text-[10px] text-slate-600">{u.id}</Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4))", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium text-white text-xs">{u.fullName}</span>
                  </div>
                </Td>
                <Td className="text-slate-400 text-xs">{u.email}</Td>
                <Td><Badge label={u.role} color={ROLE_BADGE[u.role]} /></Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <StatusPulse status={u.status} />
                    <span className="text-xs text-slate-300 capitalize">{u.status.toLowerCase()}</span>
                  </div>
                </Td>
                <Td className="text-xs text-slate-500 font-mono whitespace-nowrap">{u.createdAt.split("T")[0]}</Td>
                <Td className="text-xs text-slate-500 font-mono whitespace-nowrap">{u.lastLogin.split("T")[0]}</Td>
                <Td>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Btn variant="ghost" size="xs"><Eye size={11} /></Btn>
                    <Btn variant="ghost" size="xs"><Edit size={11} /></Btn>
                    <Btn variant="danger" size="xs"><Lock size={11} /></Btn>
                  </div>
                </Td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-600 text-sm">No users match your filters.</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${page === i + 1 ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </TableWrapper>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: ANALYTICS — GET /api/analytics
// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsPage() {
  // Replace: const analytics = await axios.get<AnalyticsPayload>('/api/analytics')
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS);

  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" sub="Platform trends · Endpoint: GET /api/analytics">
        <Btn variant="outline"><Filter size={12} />Date Range</Btn>
      </SectionHeader>

      {/* userGrowth + dailyActiveUsers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="User Growth" sub="Field: userGrowth">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics.userGrowth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="count" name="Total Users" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#a1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Active Users" sub="Field: dailyActiveUsers">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.dailyActiveUsers} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="count" name="Active Users" fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* moodStatistics + journalStatistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Mood Statistics" sub="Field: moodStatistics">
          <ResponsiveContainer width="100%" height={180}>
            <RPieChart>
              <Pie data={analytics.moodStatistics} cx="50%" cy="50%" outerRadius={72} paddingAngle={3}
                dataKey="count" nameKey="mood">
                {analytics.moodStatistics.map((_, i) => (
                  <Cell key={i} fill={[CHART_COLORS.green, CHART_COLORS.cyan, CHART_COLORS.amber, CHART_COLORS.violet, CHART_COLORS.rose][i]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {analytics.moodStatistics.map((m, i) => (
              <div key={m.mood} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: [CHART_COLORS.green, CHART_COLORS.cyan, CHART_COLORS.amber, CHART_COLORS.violet, CHART_COLORS.rose][i] }} />
                <span className="text-slate-500 flex-1">{m.mood}</span>
                <span className="font-mono text-white">{m.percentage}%</span>
                <span className="text-slate-600">({m.count.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Journal Statistics" sub="Field: journalStatistics" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.journalStatistics} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Line type="monotone" dataKey="entries" name="Entries" stroke={CHART_COLORS.violet} strokeWidth={2.5}
                dot={{ fill: CHART_COLORS.violet, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: CHART_COLORS.violet }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* aiUsageStatistics */}
      <ChartCard title="AI Usage Statistics" sub="Field: aiUsageStatistics · totalRequests vs successfulRequests">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={analytics.aiUsageStatistics} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="aReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aSucc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
            <Tooltip content={<GlassTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
            <Area type="monotone" dataKey="requests"   name="requests"   stroke={CHART_COLORS.blue}  strokeWidth={2} fill="url(#aReq)"  dot={false} />
            <Area type="monotone" dataKey="successful" name="successful" stroke={CHART_COLORS.green} strokeWidth={2} fill="url(#aSucc)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: AI MONITORING — GET /api/analytics (sub-resource)
// ─────────────────────────────────────────────────────────────────────────────

function AIMonitoringPage() {
  // Replace: const ai = await axios.get<AIMonitoringStats>('/api/analytics/ai')
  const ai = MOCK_AI_MONITORING;
  const successRate = ((ai.successfulRequests / ai.totalRequests) * 100).toFixed(2);
  const failRate    = ((ai.failedRequests    / ai.totalRequests) * 100).toFixed(2);

  const timeline = MOCK_ANALYTICS.aiUsageStatistics.map(d => ({
    date: d.date,
    totalRequests: d.requests,
    successfulRequests: d.successful,
    failedRequests: d.requests - d.successful,
    apiResponseTime: Math.floor(150 + Math.random() * 80),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader title="AI Monitoring" sub="Engine health, request tracking · Endpoint: GET /api/analytics">
        <Btn variant="outline"><RefreshCw size={12} />Refresh</Btn>
      </SectionHeader>

      {/* Status banner */}
      <div className={`${glassCard} p-4 flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${ai.aiProviderStatus === "OPERATIONAL" ? "bg-emerald-500/15 border border-emerald-500/20"
          : ai.aiProviderStatus === "DEGRADED"    ? "bg-amber-500/15 border border-amber-500/20"
          : "bg-red-500/15 border border-red-500/20"}`}>
          <Radio size={20} className={ai.aiProviderStatus === "OPERATIONAL" ? "text-emerald-400" : ai.aiProviderStatus === "DEGRADED" ? "text-amber-400" : "text-red-400"} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-sm">AI Provider Status</p>
            <Badge label={ai.aiProviderStatus} color={ai.aiProviderStatus === "OPERATIONAL" ? "green" : ai.aiProviderStatus === "DEGRADED" ? "amber" : "red"} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Field: aiProviderStatus · All inference endpoints nominal · Last checked: Jun 18, 09:41 EST</p>
        </div>
        <div className="hidden md:grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-lg font-bold text-white font-mono">{ai.totalRequests.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-mono">totalRequests</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-400 font-mono">{ai.successfulRequests.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-mono">successfulRequests</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-400 font-mono">{ai.failedRequests}</p>
            <p className="text-[10px] text-slate-500 font-mono">failedRequests</p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests",       field: "totalRequests",       value: ai.totalRequests,        icon: Activity,  color: CHART_COLORS.blue   },
          { label: "Successful Requests",  field: "successfulRequests",  value: ai.successfulRequests,   icon: CheckCircle,color: CHART_COLORS.green  },
          { label: "Failed Requests",      field: "failedRequests",      value: ai.failedRequests,       icon: XCircle,   color: CHART_COLORS.rose   },
          { label: "Avg Response Time",    field: "apiResponseTime",     value: `${ai.apiResponseTime}ms`,icon: Zap,       color: CHART_COLORS.amber  },
        ].map(m => (
          <div key={m.field} className={`${glassCard} p-5 relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle, ${m.color}, transparent 70%)` }} />
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{m.field}</p>
            <p className="text-2xl font-bold text-white mt-1 font-[Plus_Jakarta_Sans]">
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Request Timeline" sub="totalRequests · successfulRequests · failedRequests" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
              <Line type="monotone" dataKey="totalRequests"      name="totalRequests"      stroke={CHART_COLORS.blue}  strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="successfulRequests" name="successfulRequests" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failedRequests"     name="failedRequests"     stroke={CHART_COLORS.rose}  strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Success vs Failure Rate" sub="Based on today's totalRequests">
          <div className="space-y-4 mt-2">
            {[
              { label: "Success Rate",  value: parseFloat(successRate), color: CHART_COLORS.green, field: "successfulRequests/totalRequests" },
              { label: "Failure Rate",  value: parseFloat(failRate),    color: CHART_COLORS.rose,  field: "failedRequests/totalRequests"     },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <div>
                    <p className="text-xs text-white font-medium">{r.label}</p>
                    <p className="text-[9px] font-mono text-slate-600">{r.field}</p>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: r.color }}>{r.value}%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${r.value}%`, background: r.color }} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-slate-500 mb-2">apiResponseTime</p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold text-white font-mono">{ai.apiResponseTime}</span>
                <span className="text-slate-500 text-sm pb-1">ms avg</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(ai.apiResponseTime / 500 * 100, 100)}%`, background: ai.apiResponseTime < 200 ? CHART_COLORS.green : CHART_COLORS.amber }} />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">{ai.apiResponseTime < 200 ? "Normal" : "Elevated"} · Target: &lt;200ms</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: REPORTS MANAGEMENT — GET /api/reports
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_TYPE_BADGE:   Record<ReportType,   BadgeColor> = { HARASSMENT: "rose", SPAM: "amber", INAPPROPRIATE_CONTENT: "red", ABUSE: "red", FAKE_ACCOUNT: "violet" };
const REPORT_STATUS_BADGE: Record<ReportStatus, BadgeColor> = { PENDING: "amber", REVIEWED: "blue", RESOLVED: "green", DISMISSED: "gray" };

function ReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Reports Management" sub="Feature coming soon" />

      <div className={`${glassCard} p-8 text-center`}>
        <h3 className="text-xl font-semibold text-white">Feature coming soon</h3>
        <p className="mt-2 text-sm text-slate-400">This section is currently being prepared for future release.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: NOTIFICATIONS — GET /api/notifications
// ─────────────────────────────────────────────────────────────────────────────

const AUDIENCE_BADGE: Record<NotifAudience, BadgeColor> = { ALL: "blue", PREMIUM: "violet", BASIC: "cyan", INACTIVE: "amber" };

function NotificationsPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifTitle, setNotifTitle]   = useState("");
  const [notifMsg,   setNotifMsg]     = useState("");
  const [audience,   setAudience]     = useState<NotifAudience>("ALL");

  // Replace: const notifs = await axios.get<NotificationRecord[]>('/api/notifications')
  const [notifs, setNotifs] = useState<NotificationRecord[]>(MOCK_NOTIFICATIONS);

  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" sub={`${notifs.length} sent · Endpoint: GET /api/notifications`}>
        <Btn variant="outline"><RefreshCw size={12} />Refresh</Btn>
        <Btn onClick={() => setComposeOpen(true)}><Plus size={12} />Compose</Btn>
      </SectionHeader>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className={`${glassCard} w-full max-w-lg p-6 relative`}>
            <button onClick={() => setComposeOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition">
              <X size={16} />
            </button>
            <h3 className="font-bold text-white font-[Plus_Jakarta_Sans] mb-1">Compose Notification</h3>
            <p className="text-xs text-slate-500 mb-5 font-mono">POST /api/notifications · Body: NotificationRecord</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">notificationTitle</label>
                <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                  placeholder="e.g. New Feature: AI Mood Insights"
                  className={glassInput} />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">notificationMessage</label>
                <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
                  placeholder="Notification body text…"
                  rows={3}
                  className={`${glassInput} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">targetAudience</label>
                <div className="flex gap-2">
                  {(["ALL","PREMIUM","BASIC","INACTIVE"] as NotifAudience[]).map(a => (
                    <button key={a} onClick={() => setAudience(a)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${audience === a ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Btn variant="outline" onClick={() => setComposeOpen(false)} className="flex-1 justify-center">Cancel</Btn>
              <Btn className="flex-1 justify-center" onClick={() => {
                if (!notifTitle || !notifMsg) { alert('Title and message required'); return; }
                const newNotif: NotificationRecord = { id: generateId('notif'), notificationTitle: notifTitle, notificationMessage: notifMsg, targetAudience: audience, sentAt: new Date().toISOString() };
                setNotifs(n => [newNotif, ...n]);
                setComposeOpen(false);
                setNotifTitle(''); setNotifMsg(''); setAudience('ALL');
              }}><Send size={12} />Send Notification</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sent",       value: notifs.length,                                           color: CHART_COLORS.blue },
          { label: "To All Users",     value: notifs.filter(n => n.targetAudience === "ALL").length,   color: CHART_COLORS.cyan },
          { label: "Re-engagement",    value: notifs.filter(n => n.targetAudience === "INACTIVE").length,color: CHART_COLORS.amber },
        ].map(s => (
          <div key={s.label} className={`${glassCard} p-4 relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle, ${s.color}, transparent 70%)` }} />
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1 font-[Plus_Jakarta_Sans]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Notifications table */}
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr>{["id","notificationTitle","targetAudience","sentAt","Actions"].map(h => <Th key={h}>{h}</Th>)}</tr>
          </thead>
          <tbody>
            {notifs.map(n => (
              <tr key={n.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition group">
                <Td className="font-mono text-[10px] text-slate-600">{n.id}</Td>
                <Td>
                  <p className="font-medium text-white text-xs">{n.notificationTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm truncate">{n.notificationMessage}</p>
                </Td>
                <Td><Badge label={n.targetAudience} color={AUDIENCE_BADGE[n.targetAudience]} /></Td>
                <Td className="font-mono text-xs text-slate-500 whitespace-nowrap">{n.sentAt.split("T")[0]}</Td>
                <Td>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Btn variant="ghost" size="xs"><Eye size={11} /></Btn>
                    <Btn variant="danger" size="xs"><Trash2 size={11} /></Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: SETTINGS — GET /api/settings / PATCH /api/settings
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// PAGE: EMERGENCY RESOURCES — GET /api/emergency-resources
// ─────────────────────────────────────────────────────────────────────────────

function EmergencyPage() {
  const [resources, setResources] = useState([
    { id: "emr_1", country: "Nigeria", name: "SURPIN Suicide Prevention Helpline", contactInfo: "0800 0787 746", resourceType: "HOTLINE" },
    { id: "emr_2", country: "USA", name: "988 Suicide & Crisis Lifeline", contactInfo: "988", resourceType: "HOTLINE" },
    { id: "emr_3", country: "UK", name: "Samaritans", contactInfo: "116 123", resourceType: "HOTLINE" },
    { id: "emr_4", country: "Germany", name: "Telefonseelsorge", contactInfo: "0800 111 0 111", resourceType: "HOTLINE" },
    { id: "emr_5", country: "Singapore", name: "Samaritans of Singapore (SOS)", contactInfo: "1-767", resourceType: "HOTLINE" },
    { id: "emr_6", country: "India", name: "Kiran Mental Health Helpline", contactInfo: "1800-599-0019", resourceType: "HOTLINE" },
    { id: "emr_7", country: "Brazil", name: "CVV (Centro de Valorização da Vida)", contactInfo: "188", resourceType: "HOTLINE" },
  ]);

  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [newName, setNewName] = useState("");
  const [newContactInfo, setNewContactInfo] = useState("");
  const [newResourceType, setNewResourceType] = useState<"HOTLINE" | "WEBSITE" | "CLINIC">("HOTLINE");

  const addResource = () => {
    if (!newCountry.trim() || !newName.trim() || !newContactInfo.trim()) {
      alert("Please fill in all fields");
      return;
    }
    const newId = `emr_${Math.max(...resources.map(r => parseInt(r.id.split('_')[1]) || 0), 0) + 1}`;
    setResources([...resources, { id: newId, country: newCountry, name: newName, contactInfo: newContactInfo, resourceType: newResourceType }]);
    setNewCountry("");
    setNewName("");
    setNewContactInfo("");
    setNewResourceType("HOTLINE");
    setAddResourceOpen(false);
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const hotkineCount = resources.filter(r => r.resourceType === "HOTLINE").length;
  const websiteCount = resources.filter(r => r.resourceType === "WEBSITE").length;
  const clinicCount = resources.filter(r => r.resourceType === "CLINIC").length;

  const RESOURCE_TYPE_COLORS = {
    HOTLINE: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", label: "Rose", icon: Radio },
    WEBSITE: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", label: "Blue", icon: Globe },
    CLINIC: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Emerald", icon: Shield },
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Emergency Resources" sub={`Global crisis helplines and support resources · Endpoint: GET /api/emergency-resources`}>
        <Btn variant="outline"><RefreshCw size={12} />Refresh</Btn>
        <Btn onClick={() => setAddResourceOpen(true)}><Plus size={12} />Add Resource</Btn>
      </SectionHeader>

      {/* Add Resource Modal */}
      {addResourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className={`${glassCard} w-full max-w-lg p-6 relative`}>
            <button onClick={() => setAddResourceOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition">
              <X size={16} />
            </button>
            <h3 className="font-bold text-white font-[Plus_Jakarta_Sans] mb-1">Add Emergency Resource</h3>
            <p className="text-xs text-slate-500 mb-5 font-mono">POST /api/emergency-resources</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Country</label>
                <input type="text" value={newCountry} onChange={e => setNewCountry(e.target.value)}
                  placeholder="e.g. Nigeria, USA, UK…"
                  className={`${glassInput}`} />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Organization Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Samaritans, 988 Lifeline…"
                  className={`${glassInput}`} />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Contact Info</label>
                <input type="text" value={newContactInfo} onChange={e => setNewContactInfo(e.target.value)}
                  placeholder="e.g. +1-800-273-8255 or https://example.com"
                  className={`${glassInput}`} />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Resource Type</label>
                <div className="flex gap-2">
                  {(["HOTLINE", "WEBSITE", "CLINIC"] as const).map(rt => (
                    <button key={rt} onClick={() => setNewResourceType(rt)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition ${newResourceType === rt ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {rt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Btn onClick={() => setAddResourceOpen(false)} variant="outline" className="flex-1">Cancel</Btn>
              <Btn onClick={addResource} className="flex-1"><Plus size={12} />Add Resource</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Hotlines", value: hotkineCount, icon: Radio, gradient: CHART_COLORS.rose },
          { label: "Websites", value: websiteCount, icon: Globe, gradient: CHART_COLORS.blue },
          { label: "Clinics", value: clinicCount, icon: Shield, gradient: CHART_COLORS.green },
        ].map(s => (
          <div key={s.label} className={`${glassCard} p-5 relative overflow-hidden group cursor-pointer hover:bg-white/[0.08] transition`}>
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-15 group-hover:opacity-25 transition"
              style={{ background: `radial-gradient(circle, ${s.gradient}, transparent 70%)` }} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1 font-[Plus_Jakarta_Sans]">{s.value}</p>
              </div>
              <s.icon size={20} className="text-slate-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Hero section */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${CHART_COLORS.rose}, transparent 70%)` }} />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-rose-400" />
            <h2 className="text-lg font-bold text-white font-[Plus_Jakarta_Sans]">Life-Saving Support Network</h2>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Instantly connect users to critical mental health resources across {resources.length} countries. Every connection to these services can make a life-changing difference.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Badge label={`${hotkineCount} Active Hotlines`} color="rose" />
            <Badge label={`Across ${new Set(resources.map(r => r.country)).size} Countries`} color="blue" />
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {resources.map((r, idx) => (
          <div key={r.id} className={`${glassCard} p-5 border ${RESOURCE_TYPE_COLORS[r.resourceType as keyof typeof RESOURCE_TYPE_COLORS].border} hover:bg-white/[0.06] transition group`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`${RESOURCE_TYPE_COLORS[r.resourceType as keyof typeof RESOURCE_TYPE_COLORS].bg} ${RESOURCE_TYPE_COLORS[r.resourceType as keyof typeof RESOURCE_TYPE_COLORS].border} border rounded-lg p-2.5`}>
                  {Radio && <Radio size={16} className={RESOURCE_TYPE_COLORS[r.resourceType as keyof typeof RESOURCE_TYPE_COLORS].text} />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm font-[Plus_Jakarta_Sans]">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.country}</p>
                </div>
              </div>
              <Badge label={r.resourceType} color="rose" />
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
              <Phone size={13} className="text-slate-500" />
              <span className="text-sm font-mono text-slate-300 font-medium">{r.contactInfo}</span>
            </div>
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition">
              <Btn variant="ghost" size="xs" className="flex-1"><Edit size={11} />Edit</Btn>
              <Btn variant="danger" size="xs" className="flex-1" onClick={() => deleteResource(r.id)}><Trash2 size={11} />Remove</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ initialTab, onTabConsumed }: { initialTab?: "api"|"email"|"otp"|"security"; onTabConsumed?: () => void }) {
  const [tab, setTab] = useState<"api"|"email"|"otp"|"security">("api");
  const [settingsState, setSettingsState] = useState<SettingsPayload>(() => {
    try {
      const s = localStorage.getItem('local_settings');
      return s ? JSON.parse(s) : MOCK_SETTINGS;
    } catch (e) { return MOCK_SETTINGS; }
  });
  const [settingsSearch, setSettingsSearch] = useState("");

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
      onTabConsumed?.();
    }
  }, [initialTab, onTabConsumed]);

  const saveSettings = () => {
    try {
      localStorage.setItem('local_settings', JSON.stringify(settingsState));
      alert('Settings saved (in-memory)');
    } catch (e) { alert('Failed to save settings'); }
  };

  const resetSettings = () => {
    setSettingsState(MOCK_SETTINGS);
    localStorage.removeItem('local_settings');
    alert('Settings reset to defaults');
  };

  const FieldRow = ({ field, value, onChange, type = "text", mono = false }: {
    field: string; value: string | number | boolean; onChange?: (v: any) => void; type?: string; mono?: boolean;
  }) => (
    <div>
      <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-1.5">{field}</label>
      {typeof value === "boolean" ? (
        <div className="flex items-center gap-3">
          <button onClick={() => onChange?.(!value)} type="button" className={`w-10 h-5 rounded-full relative inline-flex items-center transition ${value ? "bg-blue-500/40" : "bg-white/10"} border ${value ? "border-blue-500/40" : "border-white/10"}`}>
            <span className={`absolute left-0.5 w-4 h-4 rounded-full shadow transition-transform ${value ? "translate-x-5 bg-blue-400" : "translate-x-0.5 bg-slate-500"}`} />
          </button>
          <span className="text-xs text-slate-400">{value ? "Enabled" : "Disabled"}</span>
        </div>
      ) : (
        <input type={type} value={String(value)} onChange={e => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value)}
          className={`${glassInput} ${mono ? "font-mono text-xs" : ""}`} />
      )}
    </div>
  );

  const TABS: { id: "api"|"email"|"otp"|"security"; label: string; field: keyof SettingsPayload }[] = [
    { id: "api",      label: "API Configuration",    field: "apiConfiguration" },
    { id: "email",    label: "Email Configuration",  field: "emailConfiguration" },
    { id: "otp",      label: "OTP Configuration",    field: "otpConfiguration" },
    { id: "security", label: "Security Settings",    field: "securitySettings" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" sub="Platform configuration · Endpoint: GET /api/settings · PATCH /api/settings">
        <Btn variant="outline" onClick={resetSettings}><RefreshCw size={12} />Reset</Btn>
        <Btn onClick={saveSettings}><CheckCircle size={12} />Save All</Btn>
      </SectionHeader>

      <div className="mb-4">
        <input placeholder="Search settings…" value={settingsSearch} onChange={e => setSettingsSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-white/[0.06] pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap -mb-px ${tab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {t.label}
            <span className="ml-2 text-[9px] font-mono text-slate-700">{TABS.find(x=>x.id===t.id)?.field}</span>
          </button>
        ))}
      </div>

      {tab === "api" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={`${glassCard} p-6 space-y-4`}>
            <p className="text-xs font-mono text-blue-500/60 border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 rounded-lg">GET /api/settings → apiConfiguration</p>
            {['baseUrl','apiVersion','rateLimitPerMinute','timeoutMs'].map(f => {
              if (settingsSearch && !f.toLowerCase().includes(settingsSearch.toLowerCase())) return null;
              if (f === 'baseUrl') return <FieldRow key={f} field={f} value={settingsState.apiConfiguration.baseUrl} onChange={v => setSettingsState(s => setNested(s, 'apiConfiguration.baseUrl', v))} mono />;
              if (f === 'apiVersion') return <FieldRow key={f} field={f} value={settingsState.apiConfiguration.apiVersion} onChange={v => setSettingsState(s => setNested(s, 'apiConfiguration.apiVersion', v))} mono />;
              if (f === 'rateLimitPerMinute') return <FieldRow key={f} field={f} value={settingsState.apiConfiguration.rateLimitPerMinute} onChange={v => setSettingsState(s => setNested(s, 'apiConfiguration.rateLimitPerMinute', v))} type="number" />;
              return <FieldRow key={f} field={f} value={settingsState.apiConfiguration.timeoutMs} onChange={v => setSettingsState(s => setNested(s, 'apiConfiguration.timeoutMs', v))} type="number" />;
            })}
            <Btn size="md" className="mt-2"><CheckCircle size={13} />Update API Config</Btn>
          </div>
          <div className={`${glassCard} p-6`}>
            <h3 className="font-semibold text-white text-sm mb-4">Integration Checklist</h3>
            {[
              { label: "Axios instance configured",          done: true  },
              { label: "Base URL environment variable set",  done: true  },
              { label: "JWT interceptor attached",           done: true  },
              { label: "Rate limit error handling",          done: false },
              { label: "Request timeout configured",         done: true  },
              { label: "Retry logic implemented",            done: false },
            ].map(c => (
              <div key={c.label} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                {c.done
                  ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  : <AlertCircle  size={14} className="text-amber-400 flex-shrink-0" />}
                <span className="text-xs text-slate-400">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "email" && (
        <div className={`${glassCard} p-6 space-y-4 max-w-xl`}>
          <p className="text-xs font-mono text-blue-500/60 border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 rounded-lg">GET /api/settings → emailConfiguration</p>
          {['smtpHost','smtpPort','senderEmail','senderName','tlsEnabled'].map(f => {
            if (settingsSearch && !f.toLowerCase().includes(settingsSearch.toLowerCase())) return null;
            if (f === 'smtpHost') return <FieldRow key={f} field={f} value={settingsState.emailConfiguration.smtpHost} onChange={v => setSettingsState(s => setNested(s, 'emailConfiguration.smtpHost', v))} mono />;
            if (f === 'smtpPort') return <FieldRow key={f} field={f} value={settingsState.emailConfiguration.smtpPort} onChange={v => setSettingsState(s => setNested(s, 'emailConfiguration.smtpPort', v))} type="number" />;
            if (f === 'senderEmail') return <FieldRow key={f} field={f} value={settingsState.emailConfiguration.senderEmail} onChange={v => setSettingsState(s => setNested(s, 'emailConfiguration.senderEmail', v))} mono />;
            if (f === 'senderName') return <FieldRow key={f} field={f} value={settingsState.emailConfiguration.senderName} onChange={v => setSettingsState(s => setNested(s, 'emailConfiguration.senderName', v))} />;
            return <FieldRow key={f} field={f} value={settingsState.emailConfiguration.tlsEnabled} onChange={v => setSettingsState(s => setNested(s, 'emailConfiguration.tlsEnabled', v))} />;
          })}
          <Btn size="md" className="mt-2"><Mail size={13} />Update Email Config</Btn>
        </div>
      )}

      {tab === "otp" && (
        <div className={`${glassCard} p-6 space-y-4 max-w-xl`}>
          <p className="text-xs font-mono text-blue-500/60 border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 rounded-lg">GET /api/settings → otpConfiguration</p>
          {['otpLength','otpExpiryMinutes','maxAttempts'].map(f => {
            if (settingsSearch && !f.toLowerCase().includes(settingsSearch.toLowerCase())) return null;
            if (f === 'otpLength') return <FieldRow key={f} field={f} value={settingsState.otpConfiguration.otpLength} onChange={v => setSettingsState(s => setNested(s, 'otpConfiguration.otpLength', v))} type="number" />;
            if (f === 'otpExpiryMinutes') return <FieldRow key={f} field={f} value={settingsState.otpConfiguration.otpExpiryMinutes} onChange={v => setSettingsState(s => setNested(s, 'otpConfiguration.otpExpiryMinutes', v))} type="number" />;
            return <FieldRow key={f} field={f} value={settingsState.otpConfiguration.maxAttempts} onChange={v => setSettingsState(s => setNested(s, 'otpConfiguration.maxAttempts', v))} type="number" />;
          })}
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mb-1.5">deliveryChannel</label>
            <div className="flex gap-2">
              {(["EMAIL","SMS","BOTH"] as const).map(c => (
                <button key={c} onClick={() => setSettingsState(s => setNested(s, 'otpConfiguration.deliveryChannel', c))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${settingsState.otpConfiguration.deliveryChannel === c ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <Btn size="md" className="mt-2"><Key size={13} />Update OTP Config</Btn>
        </div>
      )}

      {tab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={`${glassCard} p-6 space-y-4`}>
            <p className="text-xs font-mono text-blue-500/60 border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 rounded-lg">GET /api/settings → securitySettings</p>
            {['jwtExpiryMinutes','refreshTokenExpiryDays','maxLoginAttempts','sessionTimeoutMinutes','mfaEnabled','ipWhitelistEnabled'].map(f => {
              if (settingsSearch && !f.toLowerCase().includes(settingsSearch.toLowerCase())) return null;
              if (f === 'jwtExpiryMinutes') return <FieldRow key={f} field={f} value={settingsState.securitySettings.jwtExpiryMinutes} onChange={v => setSettingsState(s => setNested(s, 'securitySettings.jwtExpiryMinutes', v))} type="number" />;
              if (f === 'refreshTokenExpiryDays') return <FieldRow key={f} field={f} value={settingsState.securitySettings.refreshTokenExpiryDays} onChange={v => setSettingsState(s => setNested(s, 'securitySettings.refreshTokenExpiryDays', v))} type="number" />;
              if (f === 'maxLoginAttempts') return <FieldRow key={f} field={f} value={settingsState.securitySettings.maxLoginAttempts} onChange={v => setSettingsState(s => setNested(s, 'securitySettings.maxLoginAttempts', v))} type="number" />;
              if (f === 'sessionTimeoutMinutes') return <FieldRow key={f} field={f} value={settingsState.securitySettings.sessionTimeoutMinutes} onChange={v => setSettingsState(s => setNested(s, 'securitySettings.sessionTimeoutMinutes', v))} type="number" />;
              if (f === 'mfaEnabled') return <FieldRow key={f} field={f} value={settingsState.securitySettings.mfaEnabled} onChange={v => setSettingsState(s => setNested(s, 'securitySettings.mfaEnabled', v))} />;
              return <FieldRow key={f} field={f} value={settingsState.securitySettings.ipWhitelistEnabled} onChange={v => setSettingsState(s => setNested(s, 'securitySettings.ipWhitelistEnabled', v))} />;
            })}
            <Btn size="md" className="mt-2"><Lock size={13} />Update Security Settings</Btn>
          </div>
          <div className={`${glassCard} p-6`}>
            <h3 className="font-semibold text-white text-sm mb-4">RBAC Role Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Permission", "USER", "ADMIN"].map(h => (
                      <th key={h} className="text-left py-2 pr-3 text-slate-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["View dashboard",    false, true  ],
                    ["Manage users",      false, true  ],
                    ["Moderate reports",  false, true  ],
                    ["Send notifications",false, true  ],
                    ["AI monitoring",     false, true  ],
                    ["Edit settings",     false, true  ],
                  ].map(([perm, ...roles]) => (
                    <tr key={perm as string} className="border-b border-white/[0.04]">
                      <td className="py-2 pr-3 text-slate-400">{perm as string}</td>
                      {(roles as boolean[]).map((allowed, i) => (
                        <td key={i} className="py-2 pr-3">
                          {allowed
                            ? <CheckCircle size={13} className="text-emerald-400" />
                            : <XCircle     size={13} className="text-slate-700" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SHELL — Layout wrapper (sidebar + topnav + content area)
// ─────────────────────────────────────────────────────────────────────────────

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [section,   setSection]   = useState<SectionId>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen,setMobileOpen]= useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"api"|"email"|"otp"|"security"|null>(null);

  const navigateTo = (s: SectionId, opts?: { tab?: "api"|"email"|"otp"|"security" }) => {
    if (s === "settings" && opts?.tab) {
      setSettingsInitialTab(opts.tab);
    }
    setSection(s);
  };

  const renderPage = () => {
    switch (section) {
      case "overview":      return <DashboardOverview onNavigate={navigateTo} />;
      case "users":         return <UserManagement />;
      case "analytics":     return <AnalyticsPage />;
      case "ai-monitoring": return <AIMonitoringPage />;
      case "reports":       return <ReportsPage />;
      case "notifications": return <NotificationsPage />;
      case "emergency":     return <EmergencyPage />;
      case "settings":      return <SettingsPage initialTab={settingsInitialTab ?? undefined} onTabConsumed={() => setSettingsInitialTab(null)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <PageBg />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden lg:block flex-shrink-0 transition-all duration-300" style={{ width: collapsed ? 64 : 240 }}>
        <Sidebar active={section} setActive={setSection} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Sidebar — mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ width: 240 }}>
        <Sidebar active={section} setActive={s => { setSection(s); setMobileOpen(false); }} collapsed={false} setCollapsed={() => {}} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile hamburger */}
        <div className="lg:hidden absolute top-3.5 left-4 z-30">
          <button onClick={() => setMobileOpen(true)}
            className={`w-7 h-7 ${glassCard} flex items-center justify-center text-slate-400 hover:text-white transition`}>
            <Menu size={14} />
          </button>
        </div>

        <TopNav section={section} onLogout={onLogout} onNavigate={navigateTo} />

        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// JWT token would be stored in context/localStorage on real login
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn
    ? <AdminShell onLogout={() => setLoggedIn(false)} />
    : <LoginPage  onLogin={() => setLoggedIn(true)} />;
}
