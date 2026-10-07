import { useState } from "react";
import { useLocation } from "wouter";
import { useLang } from "../lib/i18n";

interface Room { roomNumber: string; receptionNumber: string }

function LangToggle({ lang, toggle }: { lang: string; toggle: () => void }) {
  return (
    <button onClick={toggle}
      className="absolute top-4 right-4 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors font-mono">
      {lang === "en" ? "日本語" : "English"}
    </button>
  );
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { lang, toggleLang, t } = useLang();
  const [managementNumber, setManagementNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([{ roomNumber: "", receptionNumber: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function addRoom() { setRooms((r) => [...r, { roomNumber: "", receptionNumber: "" }]); }
  function removeRoom(i: number) { setRooms((r) => r.filter((_, idx) => idx !== i)); }
  function updateRoom(i: number, field: keyof Room, value: string) {
    setRooms((r) => r.map((room, idx) => idx === i ? { ...room, [field]: value } : room));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!managementNumber.trim()) { setError(t.errManagementRequired); return; }
    const validRooms = rooms.filter((r) => r.roomNumber.trim() && r.receptionNumber.trim());
    if (validRooms.length === 0) { setError(t.errRoomsRequired); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managementNumber: managementNumber.trim(),
          name: companyName.trim() || undefined,
          rooms: validRooms,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? t.errRegisterFailed); return; }
      setDone(true);
    } catch {
      setError(t.errServer);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const validCount = rooms.filter(r => r.roomNumber.trim()).length;
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <LangToggle lang={lang} toggle={toggleLang} />
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-500/20 border border-green-400/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{t.accountCreated}</h2>
          <p className="text-slate-400 text-sm mb-1">{t.yourManagementNumber}</p>
          <p className="text-blue-400 font-mono text-lg font-semibold mb-1">{managementNumber}</p>
          <p className="text-slate-500 text-xs mb-7">{t.roomsRegistered(validCount)}</p>
          <button onClick={() => navigate("/")}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium py-3 rounded-xl transition-all text-sm">
            {t.goToSignIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <LangToggle lang={lang} toggle={toggleLang} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">WallCheck</h1>
          <p className="text-slate-400 text-sm mt-1">{t.createAccount}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                {t.managementNumber} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={managementNumber}
                onChange={(e) => { setManagementNumber(e.target.value); setError(""); }}
                placeholder={t.managementNumberPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                autoFocus
              />
              <p className="text-slate-600 text-[10px] mt-1">{t.managementNumberHint}</p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                {t.companyName} <span className="text-slate-600">{t.companyNameOptional}</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t.companyNamePlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  {t.rooms} <span className="text-red-400">*</span>
                </label>
                <button type="button" onClick={addRoom}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t.addRoom}
                </button>
              </div>
              <div className="space-y-2">
                {rooms.map((room, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={room.roomNumber}
                        onChange={(e) => { updateRoom(i, "roomNumber", e.target.value); setError(""); }}
                        placeholder={t.roomNoPlaceholder}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                      <input
                        type="text"
                        value={room.receptionNumber}
                        onChange={(e) => { updateRoom(i, "receptionNumber", e.target.value); setError(""); }}
                        placeholder={t.receptionNoPlaceholder}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(i)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-[10px] mt-2">{t.roomsHint}</p>
            </div>

            {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all text-sm active:scale-95 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t.creating}</>
              ) : t.createAccountBtn}
            </button>
          </form>
        </div>

        <p className="text-center mt-4">
          <button onClick={() => navigate("/")} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            {t.alreadyHaveAccount}
          </button>
        </p>
      </div>
    </div>
  );
}
