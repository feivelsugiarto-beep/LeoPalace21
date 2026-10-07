import { useState } from "react";

type Step = "management" | "room";

export function VariantB() {
  const [step, setStep] = useState<Step>("management");
  const [managementNumber, setManagementNumber] = useState("");
  const [error, setError] = useState("");

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!managementNumber.trim()) { setError("Management number is required"); return; }
    setStep("room");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b12] relative overflow-hidden p-6">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5 shadow-xl shadow-blue-900/20">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WallCheck</h1>
          <p className="text-slate-600 text-[13px] mt-1 tracking-wide">PROPERTY INSPECTION SYSTEM</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Progress bar at top of card */}
          <div className="h-0.5 bg-white/5 flex">
            <div className={`h-full bg-blue-500 transition-all duration-500 ease-out ${step === "management" ? "w-1/2" : "w-full"}`} />
          </div>

          <div className="p-7">
            {step === "management" ? (
              <form onSubmit={handleNext} noValidate>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-[10px] font-bold">1</span>
                  </div>
                  <span className="text-slate-400 text-xs">of 2 steps</span>
                </div>

                <h2 className="text-[18px] font-semibold text-white mb-1 leading-snug">Property Account</h2>
                <p className="text-slate-500 text-[13px] mb-6 leading-relaxed">Enter your property management number to begin.</p>

                <div className="mb-6">
                  <label className="block text-[11px] font-medium text-slate-400 mb-2 tracking-wider uppercase">
                    Management Number
                  </label>
                  <input
                    type="text"
                    value={managementNumber}
                    onChange={e => { setManagementNumber(e.target.value); setError(""); }}
                    placeholder="PM-2024-001"
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-[13px] font-mono placeholder-slate-700 focus:outline-none transition-all ${
                      error
                        ? "border-red-500/60 focus:border-red-500/80"
                        : "border-white/10 focus:border-blue-500/50 focus:bg-white/[0.07]"
                    }`}
                    autoFocus
                  />
                  {error ? (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  ) : (
                    <p className="text-slate-700 text-xs mt-1.5">
                      Demo: <code className="text-slate-500">PM-2024-001</code>
                    </p>
                  )}
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/30">
                  Continue →
                </button>
              </form>
            ) : (
              <form onSubmit={e => e.preventDefault()} noValidate>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                      <span className="text-blue-400 text-[10px] font-bold">2</span>
                    </div>
                    <span className="text-slate-400 text-xs">of 2 steps</span>
                  </div>
                  <button type="button" onClick={() => setStep("management")} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    ← Back
                  </button>
                </div>

                <h2 className="text-[18px] font-semibold text-white mb-1">Room Access</h2>
                <p className="text-slate-500 text-[13px] mb-1">
                  Account: <span className="font-mono text-blue-400 text-[11px]">{managementNumber}</span>
                </p>
                <p className="text-slate-700 text-[11px] mb-5">Demo: room <code>101A</code> · reception <code>REC-20240610</code></p>

                <div className="space-y-3 mb-5">
                  {[
                    { label: "Room Number", ph: "101A" },
                    { label: "Reception No.", ph: "REC-20240610" },
                    { label: "Device Label", ph: "iPhone, Office PC… (optional)" },
                  ].map(({ label, ph }) => (
                    <div key={label}>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5 tracking-wider uppercase">{label}</label>
                      <input
                        type="text"
                        placeholder={ph}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/[0.07] rounded-xl px-4 py-2.5 text-white text-[13px] font-mono placeholder-slate-700 focus:outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/30">
                  Sign In
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">For housing company staff only</p>
      </div>
    </div>
  );
}
