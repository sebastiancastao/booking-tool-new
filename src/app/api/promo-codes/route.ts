import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DiscountType = "percent" | "fixed";

type PromoRecord = {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  uses_count: number;
  created_at?: string;
};

type PromoInput = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
};

function normalizePromo(input: PromoInput) {
  const code = String(input.code || "").trim().toUpperCase();
  const discountType = input.discountType === "fixed" ? "fixed" : "percent";
  const discountValueRaw = Number(input.discountValue);
  const discountValue = Number.isFinite(discountValueRaw) ? Math.floor(discountValueRaw) : 0;

  return { code, discountType, discountValue };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = String(searchParams.get("mode") || "").trim().toLowerCase();

    if (mode === "list" || searchParams.get("list") === "1") {
      const limitRaw = Number(searchParams.get("limit") ?? 50);
      const offsetRaw = Number(searchParams.get("offset") ?? 0);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 50;
      const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;
      const q = String(searchParams.get("q") || "").trim().toUpperCase();

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ promos: [], count: 0, demo: true });
      }

      const supabase = await createClient();

      let query = supabase
        .from("promo_codes")
        .select(
          "id,code,discount_type,discount_value,is_active,starts_at,ends_at,max_uses,uses_count,created_at",
          { count: "exact" }
        );

      if (q) query = query.ilike("code", `%${q}%`);

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Supabase error listing promo codes:", error);
        return NextResponse.json({ error: "Failed to load promo codes" }, { status: 500 });
      }

      return NextResponse.json({ promos: data ?? [], count: count ?? null, limit, offset });
    }

    const codeRaw = String(searchParams.get("code") || "").trim();
    const code = codeRaw.toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, reason: "missing_code" }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ valid: false, reason: "demo_mode" });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "code,discount_type,discount_value,is_active,starts_at,ends_at,max_uses,uses_count"
      )
      .ilike("code", code)
      .maybeSingle();

    if (error) {
      console.error("Supabase error validating promo code:", error);
      return NextResponse.json({ valid: false, reason: "server_error" }, { status: 500 });
    }

    const record = data as PromoRecord | null;

    if (!record) {
      return NextResponse.json({ valid: false, reason: "not_found" });
    }

    const now = new Date();
    const startsAt = record.starts_at ? new Date(record.starts_at) : null;
    const endsAt = record.ends_at ? new Date(record.ends_at) : null;

    if (!record.is_active) return NextResponse.json({ valid: false, reason: "inactive" });
    if (startsAt && now < startsAt) return NextResponse.json({ valid: false, reason: "not_started" });
    if (endsAt && now > endsAt) return NextResponse.json({ valid: false, reason: "expired" });
    if (record.max_uses !== null && record.uses_count >= record.max_uses) {
      return NextResponse.json({ valid: false, reason: "maxed_out" });
    }

    return NextResponse.json({
      valid: true,
      promo: {
        code: record.code,
        discountType: record.discount_type,
        discountValue: record.discount_value,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ valid: false, reason: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const promos = Array.isArray(body?.promos) ? (body.promos as PromoInput[]) : [];

    if (promos.length === 0) {
      return NextResponse.json({ error: "No promo codes provided" }, { status: 400 });
    }

    const normalized = promos.map(normalizePromo).filter((p) => p.code.length > 0);
    if (normalized.length === 0) {
      return NextResponse.json({ error: "No valid promo codes provided" }, { status: 400 });
    }

    for (const p of normalized) {
      if (p.discountType === "percent") {
        if (p.discountValue < 1 || p.discountValue > 100) {
          return NextResponse.json(
            { error: `Invalid percent discount for ${p.code}` },
            { status: 400 }
          );
        }
      } else if (p.discountValue < 1) {
        return NextResponse.json(
          { error: `Invalid fixed discount for ${p.code}` },
          { status: 400 }
        );
      }
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: true,
        message: "Promo codes saved (demo mode)",
        saved: normalized.length,
      });
    }

    const supabase = await createClient();

    const rows = normalized.map((p) => ({
      code: p.code,
      discount_type: p.discountType,
      discount_value: p.discountValue,
      is_active: true,
    }));

    const { error } = await supabase
      .from("promo_codes")
      .upsert(rows, { onConflict: "code" });

    if (error) {
      console.error("Supabase error saving promo codes:", error);
      return NextResponse.json({ error: "Failed to save promo codes" }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: rows.length });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
