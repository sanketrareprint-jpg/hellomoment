import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-3xl font-semibold text-neutral-900">
        hellomoment.in
      </h1>
      <p className="mb-8 text-neutral-500">
        Never miss a birthday, anniversary, or festival with your customers.
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
