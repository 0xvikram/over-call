import Link from "next/link";
import { CONTRACT } from "@/lib/config";

const steps = [
  { n: "01", t: "Scan", d: "The big screen shows a QR code. Fans join in seconds, with no app, no wallet and no gas." },
  { n: "02", t: "Call the ball", d: "Before every delivery: dot, runs, boundary or wicket. Each call is signed and lands on Monad." },
  { n: "03", t: "Watch it settle", d: "The ball is revealed, the contract scores the room, and the live leaderboard updates on the big screen." },
];

const buyers = [
  { t: "Watch parties and sports bars", d: "Keep a full room playing for the whole match. Leaderboards bring people back next game." },
  { t: "Brands and sponsors", d: "A sponsor owns the over: branded screen, branded prizes, and on-chain proof of who engaged and when." },
  { t: "Leagues and fan clubs", d: "A fair second-screen game where every call is timestamped on-chain, so nobody can call after the ball." },
];

const plans = [
  { t: "Free", p: "₹0", d: "Up to 50 players a match. Perfect for a living room." },
  { t: "Venue", p: "₹2,999/mo", d: "Unlimited matches, your logo on screen, and player export.", hot: true },
  { t: "Sponsor", p: "Custom", d: "Sponsored overs, prize drops, and engagement reports for brand partners." },
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="nav">
        <span className="brand"><span className="brandDot" /> Over Call</span>
        <div className="navLinks">
          <Link href="/screen">Big screen</Link>
          <Link className="navCta" href="/play">Play now</Link>
        </div>
      </nav>

      <section className="hero poster">
        <span className="ghostWord" aria-hidden>CRICKET</span>
        <span className="ball" aria-hidden />
        <span className="pill">Live on Monad Testnet</span>
        <h1>
          Call the <em>next ball</em>
        </h1>
        <p className="lead">
          Over Call lets a whole crowd call the next delivery from their phones. Every call settles on Monad
          in under a second, before the bowler reaches the crease.
        </p>
        <div className="heroCtas">
          <Link className="primary" href="/play">Join from your phone</Link>
          <Link className="ghost" href="/screen">Open the big screen</Link>
        </div>
        <div className="stats">
          <div><b>0</b><span>wallets or gas needed</span></div>
          <div><b>~0.4s</b><span>per call on Monad</span></div>
          <div><b>100%</b><span>calls verifiable on-chain</span></div>
        </div>
      </section>

      <div className="ticker" aria-hidden>
        <div>{Array.from({ length: 16 }, (_, i) => <span key={i}>• LET&apos;S PLAY</span>)}</div>
      </div>

      <section className="block">
        <h2>How it works</h2>
        <div className="grid3">
          {steps.map((s) => (
            <div className="card" key={s.n}>
              <span className="num">{s.n}</span>
              <h3>{s.t}</h3>
              <p className="muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>Who it&apos;s for</h2>
        <p className="muted sub">
          India has hundreds of millions of cricket fans watching together, and the second screen is still a
          group chat. Over Call makes it a game that a venue or sponsor can own.
        </p>
        <div className="grid3">
          {buyers.map((b) => (
            <div className="card" key={b.t}>
              <h3>{b.t}</h3>
              <p className="muted">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block speed">
        <h2>Built on Monad&apos;s speed</h2>
        <p className="muted sub">
          A bowler takes about 30 seconds between deliveries, and the call window is only 8 seconds. Every fan&apos;s
          call has to be confirmed on-chain inside that window. That only works on a chain this fast.
        </p>
        <div className="speedRow">
          <div className="speedCard dark"><b>~0.4s</b><span>Monad block time. A call is on-chain before the fan looks up.</span></div>
          <div className="speedCard"><b>8s</b><span>Call window per ball. That fits about 20 Monad blocks.</span></div>
          <div className="speedCard"><b>~12s</b><span>One Ethereum block. The window would close before a single call lands.</span></div>
          <div className="speedCard lime"><b>10,000</b><span>Transactions a second, the Monad target. Parallel execution means a stadium of calls does not queue.</span></div>
        </div>
        <div className="grid3">
          <div className="card"><h3>Real-time, not batched</h3><p className="muted">Every tap is its own transaction. No off-chain server decides who called first.</p></div>
          <div className="card"><h3>Gas a fan never sees</h3><p className="muted">Fees are low enough for the venue to cover every call, so players need no wallet or tokens.</p></div>
          <div className="card"><h3>Fair by design</h3><p className="muted">The contract closes calls before the reveal. Late calls are rejected on-chain.</p></div>
        </div>
      </section>

      <section className="block">
        <h2>Pricing</h2>
        <div className="grid3">
          {plans.map((p) => (
            <div className={`card plan${p.hot ? " hot" : ""}`} key={p.t}>
              <h3>{p.t}</h3>
              <b className="price">{p.p}</b>
              <p className="muted">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="foot">
        <span>Points only, no betting. Built at Monad Blitz Mumbai, Devcon Edition.</span>
        <a
          className="mono"
          href={`https://testnet.monadexplorer.com/address/${CONTRACT}`}
          target="_blank"
          rel="noreferrer"
        >
          Contract {CONTRACT.slice(0, 6)}…{CONTRACT.slice(-4)} ↗
        </a>
      </footer>
    </main>
  );
}
