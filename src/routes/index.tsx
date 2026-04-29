import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <section className="rise-in flex max-w-2xl flex-col items-center text-center">
        <p className="island-kicker mb-4">Your project starts here</p>
        <h1 className="display-title mb-6 text-4xl leading-tight font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl">
          Orderflow
        </h1>
        <p className="mb-10 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
          A fresh start.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/signup"
            className="button-cta rounded-2xl px-8 py-4 text-base font-semibold transition"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="button-ghost rounded-2xl px-8 py-4 text-base font-medium transition"
          >
            Login
          </a>
        </div>
      </section>
    </main>
  );
}
