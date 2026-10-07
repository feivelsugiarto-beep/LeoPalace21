import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api";
const TOKEN_KEY = "wallcheck_token";

type Step = "management" | "room";
type View = "account" | "photos";

interface SessionInfo {
  account: { managementNumber: string; name: string | null };
  room: { roomNumber: string; receptionNumber: string };
  session: { id: number; deviceLabel: string | null; createdAt: string };
}

interface ActiveSession {
  id: number;
  deviceLabel: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  notes: string | null;
  deviceLabel: string | null;
  createdAt: string;
  url: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NavBar({ view, setView, onLogout }: { view: View; setView: (v: View) => void; onLogout: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0c0e14]/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <span className="text-white text-sm font-semibold">WallCheck</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setView("account")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "account" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
        >
          Account
        </button>
        <button
          onClick={() => setView("photos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "photos" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
        >
          Photos
        </button>
        <button onClick={onLogout} className="ml-1 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium">
          Sign out
        </button>
      </div>
    </div>
  );
}

function AccountView({ info }: { info: SessionInfo }) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json() as { sessions: ActiveSession[] };
      setSessions(data.sessions);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const id = setInterval(fetchSessions, 5000);
    return () => clearInterval(id);
  }, [fetchSessions]);

  return (
    <div className="p-4 space-y-4">
      {/* Account info */}
      <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Account</p>
        <div className="space-y-2.5">
          {[
            ["Property", info.account.managementNumber],
            info.account.name ? ["Name", info.account.name] : null,
            ["Room", info.room.roomNumber],
            ["Reception", info.room.receptionNumber],
          ].filter((item): item is string[] => item !== null).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{label}</span>
              <span className="text-white font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Active Sessions</p>
          <button onClick={fetchSessions} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Refresh</button>
        </div>
        {loadingSessions ? (
          <div className="py-5 flex justify-center">
            <svg className="w-4 h-4 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${s.isCurrent ? "border-blue-500/25 bg-blue-500/10" : "border-white/5 bg-white/[0.02]"}`}>
                <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white text-xs font-medium">{s.deviceLabel || "Unknown device"}</span>
                    {s.isCurrent && <span className="text-blue-400 text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded-full">This device</span>}
                  </div>
                  <p className="text-slate-600 text-[10px] mt-0.5">Signed in {timeAgo(s.createdAt)} · Active {timeAgo(s.lastSeenAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-slate-700 text-[10px] mt-3 text-center">Open in another tab to see it appear here</p>
      </div>
    </div>
  );
}

function PhotosView({ info }: { info: SessionInfo }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/inspections`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json() as { photos: Photo[] };
      setPhotos(data.photos.slice().reverse());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("deviceLabel", info.session.deviceLabel || "Unknown device");
      const res = await fetch(`${API_BASE}/inspections/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) return;
      await fetchPhotos();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await fetch(`${API_BASE}/inspections/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (preview?.id === id) setPreview(null);
  }

  return (
    <div className="p-4">
      {/* Upload button */}
      <div className="mb-4">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-2xl py-4 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="w-5 h-5 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-blue-400 text-sm font-medium">Uploading…</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span className="text-blue-400 text-sm font-medium">Take or upload a photo</span>
            </>
          )}
        </button>
        <p className="text-slate-700 text-[10px] text-center mt-2">
          Room {info.room.roomNumber} · Photos persist across devices and logins
        </p>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="py-10 flex justify-center">
          <svg className="w-5 h-5 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : photos.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-slate-600 text-sm">No photos yet</p>
          <p className="text-slate-700 text-xs">Upload a wallpaper photo to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setPreview(photo)}
              className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/8 relative group"
            >
              <img
                src={photo.url}
                alt={photo.originalName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                <p className="text-white text-[10px] truncate">{timeAgo(photo.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Photo preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col" onClick={() => setPreview(null)}>
          <div className="flex items-center justify-between p-4" onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-white text-sm font-medium truncate max-w-[200px]">{preview.originalName}</p>
              <p className="text-slate-500 text-xs">{timeAgo(preview.createdAt)} · {preview.deviceLabel || "Unknown device"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(preview.id)}
                className="p-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
              <button onClick={() => setPreview(null)} className="p-2 rounded-xl bg-white/8 text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
            <img
              src={preview.url}
              alt={preview.originalName}
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ info, onLogout }: { info: SessionInfo; onLogout: () => void }) {
  const [view, setView] = useState<View>("photos");

  return (
    <div className="min-h-screen bg-[#0c0e14] flex flex-col">
      <NavBar view={view} setView={setView} onLogout={onLogout} />
      {view === "account" ? <AccountView info={info} /> : <PhotosView info={info} />}
    </div>
  );
}

export function LoginScreen() {
  const [step, setStep] = useState<Step>("management");
  const [managementNumber, setManagementNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [receptionNumber, setReceptionNumber] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setCheckingToken(false); return; }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSessionInfo(data as SessionInfo); })
      .catch(() => {})
      .finally(() => setCheckingToken(false));
  }, []);

  async function handleRoomLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!roomNumber.trim()) { setError("Please enter the room number."); return; }
    if (!receptionNumber.trim()) { setError("Please enter the move-out reception number."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managementNumber: managementNumber.trim(),
          roomNumber: roomNumber.trim(),
          receptionNumber: receptionNumber.trim(),
          deviceLabel: deviceLabel.trim() || `Browser ${new Date().toLocaleTimeString()}`,
        }),
      });
      const data = await res.json() as { error?: string; token?: string } & Partial<SessionInfo>;
      if (!res.ok) { setError(data.error ?? "Login failed."); return; }
      localStorage.setItem(TOKEN_KEY, data.token!);
      setSessionInfo({ account: data.account!, room: data.room!, session: data.session! });
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      localStorage.removeItem(TOKEN_KEY);
    }
    setSessionInfo(null);
    setStep("management");
    setManagementNumber(""); setRoomNumber(""); setReceptionNumber(""); setDeviceLabel("");
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0e14]">
        <svg className="w-5 h-5 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (sessionInfo) return <Dashboard info={sessionInfo} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">WallCheck</h1>
          <p className="text-slate-400 text-sm mt-1">Property Inspection System</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step === "management" || step === "room" ? "bg-blue-500" : "bg-white/10"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step === "room" ? "bg-blue-500" : "bg-white/10"}`} />
          </div>

          {step === "management" ? (
            <form onSubmit={e => { e.preventDefault(); if (!managementNumber.trim()) { setError("Required"); return; } setError(""); setStep("room"); }} noValidate>
              <h2 className="text-lg font-semibold text-white mb-1">Property Account</h2>
              <p className="text-slate-400 text-sm mb-6">Enter your property management number to continue.</p>
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Management Number</label>
                <input
                  type="text"
                  value={managementNumber}
                  onChange={e => { setManagementNumber(e.target.value); setError(""); }}
                  placeholder="e.g. PM-2024-001"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-slate-600 text-xs mb-5">Demo: <span className="text-slate-400 font-mono">PM-2024-001</span></p>
              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium py-3 rounded-xl transition-all text-sm">Continue</button>
            </form>
          ) : (
            <form onSubmit={handleRoomLogin} noValidate>
              <button type="button" onClick={() => { setStep("management"); setError(""); }} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-5 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>
              <h2 className="text-lg font-semibold text-white mb-1">Room Access</h2>
              <p className="text-slate-400 text-xs mb-1">Account <span className="text-blue-400 font-mono">{managementNumber}</span></p>
              <p className="text-slate-600 text-xs mb-5">Demo: room <span className="font-mono">101A</span> · <span className="font-mono">REC-20240610</span></p>
              {[
                { label: "Room Number", value: roomNumber, set: setRoomNumber, ph: "101A" },
                { label: "Move-Out Reception No.", value: receptionNumber, set: setReceptionNumber, ph: "REC-20240610" },
                { label: "Device Label (optional)", value: deviceLabel, set: setDeviceLabel, ph: "iPhone, Office PC…" },
              ].map(({ label, value, set, ph }) => (
                <div key={label} className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => { set(e.target.value); setError(""); }}
                    placeholder={ph}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              ))}
              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Signing in…</> : "Sign In"}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-slate-600 text-xs mt-6">For housing company staff only</p>
      </div>
    </div>
  );
}
