import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col items-start justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            POC: Adobe Journey Optimizer (AJO) Server-Side Experience Decisioning
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Server-rendered personalized offers with a client feedback loop
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            This app simulates server-to-server decisioning calls to fetch an
            offer for a chosen user. The <span className="font-medium">/offers</span>{" "}
            page renders the offer HTML on the server, then client interactions
            (view/click/dismiss/conversion) are sent back to the server via{" "}
            <span className="font-medium">/api/track</span>.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              1) Select a user profile
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              This acts like a dummy login. We store your choice in a cookie so
              the server can personalize the next request.
            </p>

            <form
              className="mt-4 flex flex-col gap-3"
              action="/api/select-user"
              method="POST"
            >
              <input type="hidden" name="redirectTo" value="/offers" />

              <button
                name="userId"
                value="user-a"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Continue as User A
              </button>
              <button
                name="userId"
                value="user-b"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                Continue as User B
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              What to demo
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <li>
                - Server fetch: mock decisioning request returns offer JSON
              </li>
              <li>- Server render: offer is embedded into HTML</li>
              <li>
                - Client events: view/click/dismiss/conversion posted to the
                server
              </li>
            </ul>
            <div className="mt-4">
              <Link
                href="/offers"
                className="text-sm font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-200"
              >
                Go to /offers (will redirect if no user selected)
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
