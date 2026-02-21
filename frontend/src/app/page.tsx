export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile-first header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Bacheca
          </h1>
          <nav className="flex items-center gap-2">
            <button className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

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
