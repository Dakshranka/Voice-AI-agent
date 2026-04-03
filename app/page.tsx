import Link from "next/link";

const features = [
  {
    title: "Voice-Led Mock Interviews",
    description: "Practice natural spoken responses and build confidence before real interviews.",
  },
  {
    title: "Instant AI Feedback",
    description: "Get a score and clear feedback on clarity, technical depth, and communication.",
  },
  {
    title: "Track Your Progress",
    description: "Review transcripts and compare results across multiple practice sessions.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl animate-float"></div>
      <div className="pointer-events-none absolute top-24 right-0 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl animate-float-delayed"></div>

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            Interview Sprint
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Start Practicing
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <section className="animate-fade-in-up rounded-3xl border border-cyan-100 bg-gradient-to-r from-white via-cyan-50 to-sky-50 p-8 shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Student Interview Practice Platform
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
            Practice Interviews With AI Voice, Anytime
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            Run mock interviews, answer out loud, and get structured feedback so you walk into real
            interviews prepared.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              I Already Have an Account
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((item, index) => (
            <article
              key={item.title}
              className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-600 md:px-6">
          Interview Sprint helps students practice interview communication and confidence.
        </div>
      </footer>
    </div>
  );
}
