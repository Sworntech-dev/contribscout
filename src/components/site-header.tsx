"use client";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="flex items-center justify-between rounded-md border border-cream/10 bg-cream/[0.045] px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-moss/40 bg-moss/10 text-sm font-black text-cream shadow-[0_0_30px_rgba(157,191,154,0.18)]">
            CS
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black text-cream">ContribScout</p>
            <span className="rounded-md border border-moss/25 bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">
              Hermes Skill Layer
            </span>
          </div>
        </div>
        <a
          href="#proof-vault"
          className="rounded-md border border-cream/10 bg-cream/[0.06] px-3 py-2 text-sm text-cream/85 transition hover:border-moss/50 hover:text-cream"
        >
          Proof Vault
        </a>
      </nav>
    </header>
  );
}
