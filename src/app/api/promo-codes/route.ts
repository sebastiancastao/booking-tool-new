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
