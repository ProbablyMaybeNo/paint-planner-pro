import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { plannerData } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(plannerData)
    .where(eq(plannerData.userId, session.user.id));

  if (rows.length === 0) {
    return NextResponse.json({ armies: [], updatedAt: null });
  }

  return NextResponse.json({
    armies: JSON.parse(rows[0].armies),
    updatedAt: rows[0].updatedAt,
  });
}

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const armies = body.armies ?? [];
  const now = new Date();

  await db
    .insert(plannerData)
    .values({
      userId: session.user.id,
      armies: JSON.stringify(armies),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: plannerData.userId,
      set: {
        armies: JSON.stringify(armies),
        updatedAt: now,
      },
    });

  return NextResponse.json({ ok: true, updatedAt: now });
}
