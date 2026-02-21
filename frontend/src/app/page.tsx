import Header from "./components/Header";
import ListingsSection from "./components/ListingsSection";

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
              Bacheca
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              La tua bacheca per annunci e comunicazioni
            </p>
          </section>

          {/* Listings with section tabs */}
          <ListingsSection />
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
