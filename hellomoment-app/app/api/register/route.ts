import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "@/lib/db";

const RegisterSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { businessName, email, password } = parsed.data;

  const { rows: existing } = await pool.query(
    "select id from users where email = $1",
    [email]
  );
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    "insert into users (business_name, email, password_hash) values ($1, $2, $3)",
    [businessName, email, passwordHash]
  );

  return NextResponse.json({ ok: true });
}
