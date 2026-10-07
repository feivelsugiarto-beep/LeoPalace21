import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLang } from "../lib/i18n";

const TOKEN_KEY = "wallcheck_token";
type Step = "management" | "room";

function LangToggle({ lang, toggle }: { lang: string; toggle: () => void }) {
  return (
    <button onClick={toggle}
      className="absolute top-4 right-4 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors font-mono">
      {lang === "en" ? "日本語" : "English"}
    </button>
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { lang, toggleLang, t } = useLang();
  const [step, setStep] = useState<Step>("management");
  const [managementNumber, setManagementNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [receptionNumber, setReceptionNumber] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? navigate("/dashboard") : null))
      .catch(() => {});
  }, [navigate]);

  async function handleRoomLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!roomNumber.trim()) { setError(t.errRoomRequired); return; }
    if (!receptionNumber.trim()) { setError(t.errReceptionRequired); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managementNumber: managementNumber.trim(),
          roomNumber: roomNumber.trim(),
          receptionNumber: receptionNumber.trim(),
          deviceLabel: deviceLabel.trim() || `Browser ${new Date().toLocaleTimeString()}`,
        }),
      });
      const data = await res.json() as { error?: string; token?: string };
      if (!res.ok) { setError(data.error ?? t.errLoginFailed); return; }
      localStorage.setItem(TOKEN_KEY, data.token!);
      navigate("/dashboard");
    } catch {
      setError(t.errServer);
    } finally {
      setLoading(false);
    }
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
          <p className="text-slate-400 text-sm mt-1">{t.appSubtitle}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1.5 flex-1 rounded-full bg-blue-500" />
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step === "room" ? "bg-blue-500" : "bg-white/10"}`} />
          </div>

          {step === "management" ? (
            <form onSubmit={(e) => { e.preventDefault(); if (!managementNumber.trim()) { setError(t.required); return; } setError(""); setStep("room"); }} noValidate>
              <h2 className="text-lg font-semibold text-white mb-1">{t.propertyAccount}</h2>
              <p className="text-slate-400 text-sm mb-6">{t.enterManagementNumber}</p>
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{t.managementNumber}</label>
                <input
                  type="text"
                  value={managementNumber}
                  onChange={(e) => { setManagementNumber(e.target.value); setError(""); }}
                  placeholder={t.managementNumberPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-slate-600 text-xs mb-5">{t.demo}: <span className="text-slate-400 font-mono">PM-2024-001</span></p>
              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium py-3 rounded-xl transition-all text-sm active:scale-95">
                {t.continue}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRoomLogin} noValidate>
              <button type="button" onClick={() => { setStep("management"); setError(""); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-5 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                {t.back}
              </button>
              <h2 className="text-lg font-semibold text-white mb-1">{t.roomAccess}</h2>
              <p className="text-slate-400 text-xs mb-1">{t.account} <span className="text-blue-400 font-mono">{managementNumber}</span></p>
              <p className="text-slate-600 text-xs mb-5">{t.demo}: room <span className="font-mono">101A</span> · <span className="font-mono">REC-20240610</span></p>

              {[
                { label: t.roomNumber, value: roomNumber, set: setRoomNumber, ph: "101A" },
                { label: t.receptionNumber, value: receptionNumber, set: setReceptionNumber, ph: "REC-20240610" },
                { label: t.deviceLabel, value: deviceLabel, set: setDeviceLabel, ph: t.deviceLabelPlaceholder },
              ].map(({ label, value, set, ph }) => (
                <div key={label} className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => { set(e.target.value); setError(""); }}
                    placeholder={ph}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              ))}

              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all text-sm active:scale-95 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t.signingIn}</>
                ) : t.signIn}
              </button>
            </form>
          )}
        </div>
        <p className="text-center mt-4">
          <button onClick={() => navigate("/register")} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            {t.newProperty}
          </button>
        </p>
      </div>
    </div>
  );
}
