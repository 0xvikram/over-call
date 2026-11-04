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
          <div><b>&lt;1s</b><span>to settle a call</span></div>
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

      <section className="block">
        <h2>Why Monad</h2>
        <div className="grid3">
          <div className="card"><h3>Fast blocks</h3><p className="muted">A room&apos;s calls land in the few seconds between deliveries.</p></div>
          <div className="card"><h3>Parallel execution</h3><p className="muted">Hundreds of fans calling at once don&apos;t queue behind each other.</p></div>
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
