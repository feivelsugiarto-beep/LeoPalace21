import { useState } from "react";

type Step = "management" | "room";

export function VariantA() {
  const [step, setStep] = useState<Step>("management");
  const [managementNumber, setManagementNumber] = useState("");
  const [error, setError] = useState("");

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!managementNumber.trim()) { setError("Required"); return; }
    setStep("room");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0e14] p-6">

      {/* Brand strip */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-base leading-none">WallCheck</p>
          <p className="text-slate-500 text-xs mt-0.5">Property Inspection</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Step pills */}
        <div className="flex gap-1.5 mb-7">
          {(["management", "room"] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              (step === "management" && i === 0) || step === "room" ? "bg-blue-500" : "bg-white/10"
            }`} />
          ))}
        </div>

        {step === "management" ? (
          <form onSubmit={handleNext} noValidate className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-white">Property Account</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your management number to continue.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                Management Number
              </label>
              <div className={`flex items-center gap-3 bg-white/[0.04] border rounded-xl px-4 h-12 transition-all ${error ? "border-red-500/50" : "border-white/10 focus-within:border-blue-500/60 focus-within:bg-white/[0.06]"}`}>
                <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                <input
                  type="text"
                  value={managementNumber}
                  onChange={e => { setManagementNumber(e.target.value); setError(""); }}
                  placeholder="PM-2024-001"
                  className="flex-1 bg-transparent text-white text-sm font-mono placeholder-slate-700 focus:outline-none"
                  autoFocus
                />
              </div>
              {error ? (
                <p className="text-red-400 text-xs">{error}</p>
              ) : (
                <p className="text-slate-700 text-xs">Demo: <span className="font-mono text-slate-500">PM-2024-001</span></p>
              )}
            </div>

            <button type="submit" className="w-full h-11 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </form>
        ) : (
          <form onSubmit={e => e.preventDefault()} noValidate className="space-y-4">
            <div>
              <button type="button" onClick={() => setStep("management")} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-4 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>
              <h2 className="text-xl font-semibold text-white">Room Access</h2>
              <p className="text-slate-500 text-sm mt-1">
                <span className="font-mono text-blue-400 text-xs">{managementNumber}</span> · Enter room credentials
              </p>
            </div>

            {[
              { label: "Room Number", placeholder: "101A", hint: "Demo: 101A" },
              { label: "Reception No.", placeholder: "REC-20240610", hint: "Demo: REC-20240610" },
              { label: "Device Label", placeholder: "e.g. iPhone, Office PC", hint: "Optional" },
            ].map(({ label, placeholder, hint }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em]">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full h-11 bg-white/[0.04] border border-white/10 focus:border-blue-500/60 focus:bg-white/[0.06] rounded-xl px-4 text-white text-sm font-mono placeholder-slate-700 focus:outline-none transition-all"
                />
                <p className="text-slate-700 text-xs">{hint}</p>
              </div>
            ))}

            <button type="submit" className="w-full h-11 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors mt-2">
              Sign In
            </button>
          </form>
        )}
      </div>

      <p className="text-slate-700 text-xs mt-10">For housing company staff only</p>
    </div>
  );
}
