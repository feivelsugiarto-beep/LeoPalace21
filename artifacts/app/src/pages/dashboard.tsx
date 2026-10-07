import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useLang, formatTimeAgo } from "../lib/i18n";

const TOKEN_KEY = "wallcheck_token";
type Tab = "photos" | "account";

interface Room { id: number; roomNumber: string; receptionNumber: string }

interface AccountInfo {
  account: { managementNumber: string; name: string | null };
  room: { id: number; roomNumber: string; receptionNumber: string };
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
  originalName: string;
  notes: string | null;
  deviceLabel: string | null;
  createdAt: string;
  url: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { lang, toggleLang, t } = useLang();
  const [tab, setTab] = useState<Tab>("photos");
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newReceptionNumber, setNewReceptionNumber] = useState("");
  const [addingRoom, setAddingRoom] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [switchingRoomId, setSwitchingRoomId] = useState<number | null>(null);

  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { navigate("/"); return; }
    const r = await fetch("/api/auth/me", { headers: authHeaders() });
    if (!r.ok) { navigate("/"); return; }
    const data = await r.json() as AccountInfo;
    setInfo(data);
    setLoadingInfo(false);
  }, [navigate]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const fetchPhotos = useCallback(async () => {
    const res = await fetch("/api/inspections", { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json() as { photos: Photo[] };
    setPhotos(data.photos.slice().reverse());
    setLoadingPhotos(false);
  }, []);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/auth/sessions", { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json() as { sessions: ActiveSession[] };
    setSessions(data.sessions);
    setLoadingSessions(false);
  }, []);

  const fetchRooms = useCallback(async () => {
    const res = await fetch("/api/auth/rooms", { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json() as { rooms: Room[] };
    setRooms(data.rooms);
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);
  useEffect(() => { fetchSessions(); const id = setInterval(fetchSessions, 5000); return () => clearInterval(id); }, [fetchSessions]);
  useEffect(() => { if (tab === "account") fetchRooms(); }, [tab, fetchRooms]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    navigate("/");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("deviceLabel", info?.session.deviceLabel || "Unknown device");
      const res = await fetch("/api/inspections/upload", { method: "POST", headers: authHeaders(), body: form });
      if (!res.ok) return;
      const uploaded = await res.json() as { id: number; url: string; originalName: string; notes: string | null; deviceLabel: string | null; createdAt: string };
      await fetchPhotos();
      // Auto-analyze immediately after upload
      setAnalyzingId(uploaded.id);
      setAnalysisError(null);
      try {
        const aiRes = await fetch(`/api/ai/analyze/${uploaded.id}?lang=${lang}`, { method: "POST", headers: authHeaders() });
        const data = await aiRes.json() as { analysis?: string; error?: string };
        if (aiRes.ok) {
          setPhotos((prev) => prev.map((p) => p.id === uploaded.id ? { ...p, notes: data.analysis ?? p.notes } : p));
        }
      } catch {
        // silent — user can still re-analyze manually from preview
      } finally {
        setAnalyzingId(null);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/inspections/${id}`, { method: "DELETE", headers: authHeaders() });
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (preview?.id === id) setPreview(null);
  }

  async function handleAnalyze(photoId: number) {
    setAnalyzingId(photoId);
    setAnalysisError(null);
    try {
      const res = await fetch(`/api/ai/analyze/${photoId}?lang=${lang}`, { method: "POST", headers: authHeaders() });
      const data = await res.json() as { analysis?: string; error?: string };
      if (!res.ok) { setAnalysisError(data.error ?? t.errAnalysisFailed); return; }
      setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, notes: data.analysis ?? p.notes } : p));
      if (preview?.id === photoId) setPreview((prev) => prev ? { ...prev, notes: data.analysis ?? prev.notes } : prev);
    } catch {
      setAnalysisError(t.errServerShort);
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleSwitchRoom(roomId: number) {
    setSwitchingRoomId(roomId);
    try {
      const res = await fetch("/api/auth/switch-room", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) return;
      await fetchInfo();
      setPhotos([]);
      setLoadingPhotos(true);
      await fetchPhotos();
    } finally {
      setSwitchingRoomId(null);
    }
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    setRoomError("");
    if (!newRoomNumber.trim() || !newReceptionNumber.trim()) { setRoomError(t.errBothRequired); return; }
    setAddingRoom(true);
    try {
      const res = await fetch("/api/auth/rooms", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber: newRoomNumber.trim(), receptionNumber: newReceptionNumber.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setRoomError(data.error ?? t.errAddRoomFailed); return; }
      setNewRoomNumber(""); setNewReceptionNumber(""); setShowAddRoom(false);
      await fetchRooms();
    } finally {
      setAddingRoom(false);
    }
  }

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0e14]">
        <Spinner className="w-5 h-5 text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e14] flex flex-col max-w-sm mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0c0e14]/90 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <div>
            <span className="text-white text-sm font-semibold">WallCheck</span>
            {info && <span className="text-slate-500 text-[10px] ml-1.5 font-mono">{t.room} {info.room.roomNumber}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setTab("photos")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "photos" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>{t.photos}</button>
          <button onClick={() => setTab("account")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "account" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>{t.account}</button>
          <button onClick={toggleLang} className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors border border-white/5">
            {lang === "en" ? "JP" : "EN"}
          </button>
          <button onClick={handleLogout} className="ml-0.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium">{t.signOut}</button>
        </div>
      </div>

      {/* Photos tab */}
      {tab === "photos" && (
        <div className="p-4 flex-1">
          <div className="mb-4">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-2xl py-4 transition-all disabled:opacity-50">
              {uploading
                ? <><Spinner className="w-5 h-5 text-blue-400" /><span className="text-blue-400 text-sm font-medium">{t.uploading}</span></>
                : <><svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg><span className="text-blue-400 text-sm font-medium">{t.takeOrUpload}</span></>}
            </button>
            {info && <p className="text-slate-700 text-[10px] text-center mt-2">{t.photosHint(info.room.roomNumber)}</p>}
          </div>

          {loadingPhotos ? (
            <div className="py-10 flex justify-center"><Spinner className="w-5 h-5 text-slate-600" /></div>
          ) : photos.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              </div>
              <p className="text-slate-600 text-sm">{t.noPhotos}</p>
              <p className="text-slate-700 text-xs">{t.noPhotosHint}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo) => {
                const isAnalyzing = analyzingId === photo.id;
                return (
                  <button key={photo.id} onClick={() => setPreview(photo)}
                    className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/8 relative group">
                    <img src={photo.url} alt={photo.originalName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                      <p className="text-white text-[10px]">{formatTimeAgo(photo.createdAt, t)}</p>
                    </div>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5">
                        <Spinner className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-300 text-[10px] font-medium">AI…</span>
                      </div>
                    )}
                    {!isAnalyzing && photo.notes && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-purple-500/80 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Account tab */}
      {tab === "account" && info && (
        <div className="p-4 space-y-4">
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">{t.currentSession}</p>
            <div className="space-y-2.5">
              {([
                [t.property, info.account.managementNumber],
                ...(info.account.name ? [[t.name, info.account.name]] : []),
                [t.room, info.room.roomNumber],
                [t.reception, info.room.receptionNumber],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{label}</span>
                  <span className="text-white font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms */}
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{t.allRooms}</p>
              <button onClick={() => { setShowAddRoom((v) => !v); setRoomError(""); }}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={showAddRoom ? "M6 18L18 6M6 6l12 12" : "M12 4.5v15m7.5-7.5h-15"} />
                </svg>
                {showAddRoom ? t.cancel : t.addRoom}
              </button>
            </div>

            <div className="space-y-1.5 mb-3">
              {rooms.map((r) => {
                const isCurrent = r.id === info.room.id;
                const isSwitching = switchingRoomId === r.id;
                return (
                  <div key={r.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${isCurrent ? "border-blue-500/25 bg-blue-500/10" : "border-white/5 bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                      <span className="text-white font-mono text-xs">{r.roomNumber}</span>
                      {isCurrent && <span className="text-blue-400 text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded-full">{t.current}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px]">{r.receptionNumber}</span>
                      {!isCurrent && (
                        <button onClick={() => handleSwitchRoom(r.id)} disabled={!!switchingRoomId}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {isSwitching ? <Spinner className="w-3 h-3" /> : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" /></svg>
                          )}
                          {isSwitching ? t.switching : t.switchRoom}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {rooms.length === 0 && <p className="text-slate-600 text-xs text-center py-2">{t.loadingRooms}</p>}
            </div>

            {showAddRoom && (
              <form onSubmit={handleAddRoom} noValidate className="border-t border-white/8 pt-3 mt-1">
                <p className="text-[10px] text-slate-500 mb-2">{t.newRoomFor} <span className="font-mono text-slate-400">{info.account.managementNumber}</span></p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input type="text" value={newRoomNumber} onChange={(e) => { setNewRoomNumber(e.target.value); setRoomError(""); }}
                    placeholder={t.roomNoPlaceholder} autoFocus
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                  <input type="text" value={newReceptionNumber} onChange={(e) => { setNewReceptionNumber(e.target.value); setRoomError(""); }}
                    placeholder={t.receptionNoPlaceholder}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                </div>
                {roomError && <p className="text-red-400 text-[10px] mb-2">{roomError}</p>}
                <button type="submit" disabled={addingRoom}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-medium py-2 rounded-xl transition-all text-xs disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {addingRoom ? <><Spinner className="w-3.5 h-3.5" />{t.addingRoom}</> : t.addRoomBtn}
                </button>
              </form>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{t.activeSessions}</p>
              <button onClick={fetchSessions} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">{t.refresh}</button>
            </div>
            {loadingSessions ? (
              <div className="py-5 flex justify-center"><Spinner className="w-4 h-4 text-slate-600" /></div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${s.isCurrent ? "border-blue-500/25 bg-blue-500/10" : "border-white/5 bg-white/[0.02]"}`}>
                    <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white text-xs font-medium">{s.deviceLabel || "Unknown device"}</span>
                        {s.isCurrent && <span className="text-blue-400 text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded-full">{t.thisDevice}</span>}
                      </div>
                      <p className="text-slate-600 text-[10px] mt-0.5">{t.signedIn} {formatTimeAgo(s.createdAt, t)} · {t.activeLabel} {formatTimeAgo(s.lastSeenAt, t)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-slate-700 text-[10px] mt-3 text-center">{t.sessionsHint}</p>
          </div>
        </div>
      )}

      {/* Photo preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-white text-sm font-medium truncate">{preview.originalName}</p>
              <p className="text-slate-500 text-xs">{formatTimeAgo(preview.createdAt, t)} · {preview.deviceLabel || "Unknown"}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleDelete(preview.id)} className="p-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
              <button onClick={() => setPreview(null)} className="p-2 rounded-xl bg-white/8 text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center px-4 overflow-hidden" onClick={() => setPreview(null)}>
            <img src={preview.url} alt={preview.originalName} className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          </div>

          <div className="p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
            {preview.notes ? (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  <span className="text-purple-400 text-[10px] font-semibold uppercase tracking-widest">{t.aiAnalysis}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{preview.notes}</p>
                <button onClick={() => handleAnalyze(preview.id)} disabled={analyzingId === preview.id}
                  className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50">
                  {analyzingId === preview.id ? t.reAnalyzing : t.reAnalyze}
                </button>
              </div>
            ) : (
              <button onClick={() => handleAnalyze(preview.id)} disabled={analyzingId === preview.id}
                className="w-full flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 rounded-xl py-3 transition-all disabled:opacity-60">
                {analyzingId === preview.id
                  ? <><Spinner className="w-4 h-4 text-purple-400" /><span className="text-purple-400 text-sm font-medium">{t.analyzingDamage}</span></>
                  : <><svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg><span className="text-purple-400 text-sm font-medium">{t.analyzeWithAi}</span></>}
              </button>
            )}
            {analysisError && <p className="text-red-400 text-xs text-center">{analysisError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
