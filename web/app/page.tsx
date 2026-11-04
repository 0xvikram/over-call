import Link from "next/link";

export default function Home() {
  return (
    <main className="phone">
      <h1>Over Call</h1>
      <p className="muted">Practice build. The whole room calls the next ball on Monad.</p>
      <Link className="primary" href="/play">
        Play (phone)
      </Link>
      <Link className="primary" href="/screen">
        Big screen
      </Link>
      <Link className="primary" href="/host?secret=practice">
        Host controls
      </Link>
    </main>
  );
}
