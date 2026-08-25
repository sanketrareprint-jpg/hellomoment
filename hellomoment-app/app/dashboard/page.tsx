import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { pool } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { rows } = await pool.query(
    "select business_name, email, timezone, created_at from users where email = $1",
    [session.user.email]
  );
  const user = rows[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        Welcome, {user?.business_name ?? session.user.name}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        This confirms registration, login, and the database are all wired up
        end to end.
      </p>

      <dl className="mb-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-neutral-200 p-4 text-sm">
        <dt className="text-neutral-500">Email</dt>
        <dd className="text-neutral-900">{user?.email}</dd>
        <dt className="text-neutral-500">Timezone</dt>
        <dd className="text-neutral-900">{user?.timezone}</dd>
        <dt className="text-neutral-500">Account created</dt>
        <dd className="text-neutral-900">
          {user?.created_at ? new Date(user.created_at).toLocaleString() : "—"}
        </dd>
      </dl>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
