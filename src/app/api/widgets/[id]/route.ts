import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PRICING_CONFIG } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const supabase = await createClient();

    // Fetch the widget
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("*")
      .eq("id", id)
      .single();

    if (widgetError) {
      console.error("Error fetching widget:", widgetError);
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    // Fetch all pricing data for this widget
    const [
      teamsResult,
      laborResult,
      travelResult,
      protectionResult,
      accessibilityResult,
      stairsResult,
      walkingResult,
    ] = await Promise.all([
      supabase.from("pricing_teams").select("*").eq("widget_id", id),
      supabase.from("pricing_labor_estimates").select("*").eq("widget_id", id),
      supabase.from("pricing_travel").select("*").eq("widget_id", id).single(),
      supabase.from("pricing_protection").select("*").eq("widget_id", id).single(),
      supabase.from("pricing_accessibility").select("*").eq("widget_id", id).single(),
      supabase.from("pricing_stairs").select("*").eq("widget_id", id),
      supabase.from("pricing_walking_distance").select("*").eq("widget_id", id),
    ]);

    const dbTravelRate = travelResult.data?.travel_rate;
    const normalizedTravelRate =
      typeof dbTravelRate === "number" && Math.abs(dbTravelRate - 0.75) < 0.000001
        ? 1
        : dbTravelRate;

    // Build pricing config from database data
    const pricing = {
      teams: {
        move: { ...DEFAULT_PRICING_CONFIG.teams.move } as Record<string, { rate: number; minimumHours: number }>,
        loaders: { ...DEFAULT_PRICING_CONFIG.teams.loaders } as Record<string, { rate: number; minimumHours: number }>,
        unloading: { ...DEFAULT_PRICING_CONFIG.teams.unloading } as Record<string, { rate: number; minimumHours: number }>,
      },
      estimateLabor: {
        home: { ...DEFAULT_PRICING_CONFIG.estimateLabor.home } as Record<string, { minLabor: number; maxLabor: number }>,
        storage: { ...DEFAULT_PRICING_CONFIG.estimateLabor.storage } as Record<string, { minLabor: number; maxLabor: number }>,
        office: { ...DEFAULT_PRICING_CONFIG.estimateLabor.office } as Record<string, { minLabor: number; maxLabor: number }>,
      },
      travelRate: normalizedTravelRate ?? DEFAULT_PRICING_CONFIG.travelRate,
      pricePerMile: travelResult.data?.price_per_mile ?? DEFAULT_PRICING_CONFIG.pricePerMile,
      protectionCharge: protectionResult.data?.protection_charge ?? DEFAULT_PRICING_CONFIG.protectionCharge,
      accessibility: {
        noElevatorCharge:
          accessibilityResult.data?.no_elevator_charge ??
          DEFAULT_PRICING_CONFIG.accessibility.noElevatorCharge,
        stairsCharge: DEFAULT_PRICING_CONFIG.accessibility.stairsCharge,
        walkingDistance: {
          ...DEFAULT_PRICING_CONFIG.accessibility.walkingDistance,
        } as Record<string, number>,
      },
    };

    // Populate team pricing
    if (teamsResult.data) {
      for (const team of teamsResult.data) {
        const group = team.team_group as "move" | "loaders" | "unloading";
        if (!pricing.teams[group]) continue;

        const normalizedTeamOption =
          group === "move" && team.team_option === "3-2"
            ? "4-1"
            : group === "loaders" && team.team_option === "loaders-2"
              ? "2-1"
              : group === "loaders" && team.team_option === "loaders-3"
                ? "3-1"
                : team.team_option;
        if (Object.prototype.hasOwnProperty.call(pricing.teams[group], normalizedTeamOption)) {
          pricing.teams[group][normalizedTeamOption] = {
            rate: parseFloat(team.rate),
            minimumHours: parseFloat(team.minimum_hours),
          };
        }
      }
    }

    // Populate labor estimates
    if (laborResult.data) {
      for (const labor of laborResult.data) {
        const group = labor.estimate_group as "home" | "storage" | "office";
        if (pricing.estimateLabor[group]) {
          pricing.estimateLabor[group][labor.estimate_option] = {
            minLabor: parseFloat(labor.min_labor),
            maxLabor: parseFloat(labor.max_labor),
          };
        }
      }
    }

    // Populate stairs charges
    if (stairsResult.data) {
      const stairValues = stairsResult.data
        .map((stair) => parseFloat(stair.charge))
        .filter((value) => Number.isFinite(value));
      if (stairValues.length > 0) {
        // Backward compatibility for older records with multiple stair ranges.
        pricing.accessibility.stairsCharge = Math.max(...stairValues);
      }
    }

    // Populate walking distance charges
    if (walkingResult.data) {
      for (const walking of walkingResult.data) {
        pricing.accessibility.walkingDistance[walking.distance_type] = parseFloat(walking.charge);
      }
    }

    // Return widget with pricing
    return NextResponse.json({
      widget: {
        id: widget.id,
        name: widget.name,
        companyName: widget.company_name,
        logo: widget.logo,
        primaryColor: widget.primary_color,
        secondaryColor: widget.secondary_color,
        backgroundColor: widget.background_color,
        textColor: widget.text_color,
        fontFamily: widget.font_family,
        buttonText: widget.button_text,
        successMessage: widget.success_message,
        customFields: widget.custom_fields || [],
        enableInsurance: widget.enable_insurance,
        enableSpecialItems: widget.enable_special_items,
        enableInventory: widget.enable_inventory,
        pricing,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
