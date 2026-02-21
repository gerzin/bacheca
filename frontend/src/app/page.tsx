import Header from "./components/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      {/* Main content - mobile-first with responsive padding */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Welcome section */}
          <section className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Welcome to Bacheca
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Your bulletin board for announcements and updates
            </p>
          </section>

          {/* Cards grid - mobile: 1 column, tablet: 2 columns, desktop: 3 columns */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <article
                key={i}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Sample Post {i}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Just now
                    </p>
                  </div>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300">
                  This is a sample bulletin post. Replace this with real content
                  from your API.
                </p>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile-first footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} Bacheca
        </div>
      </footer>
    </div>
  );
}
