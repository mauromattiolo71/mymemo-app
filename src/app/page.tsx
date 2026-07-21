import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold">Voce nell&apos;Infinito</h1>
      <p className="text-neutral-500">
        MyMemo ti permette di registrare un messaggio video per i tuoi cari,
        da conservare per sempre. Non è un testamento legale: è la tua voce,
        oltre il tempo.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Inizia gratis
        </Link>
        <Link
          href="/feed"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium dark:border-neutral-700"
        >
          Community
        </Link>
      </div>
    </div>
  );
}
