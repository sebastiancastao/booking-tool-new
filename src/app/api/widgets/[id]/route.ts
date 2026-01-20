import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Build pricing config from database data
    const pricing = {
      teams: {
        move: {} as Record<string, { rate: number; minimumHours: number }>,
        loaders: {} as Record<string, { rate: number; minimumHours: number }>,
        unloading: {} as Record<string, { rate: number; minimumHours: number }>,
      },
      estimateLabor: {
        home: {} as Record<string, { minLabor: number; maxLabor: number }>,
        storage: {} as Record<string, { minLabor: number; maxLabor: number }>,
        office: {} as Record<string, { minLabor: number; maxLabor: number }>,
      },
      travelRate: travelResult.data?.travel_rate || 0.75,
      pricePerMile: travelResult.data?.price_per_mile || 2.5,
      protectionCharge: protectionResult.data?.protection_charge || 15,
      accessibility: {
        noElevatorCharge: accessibilityResult.data?.no_elevator_charge || 25,
        stairsCharge: {
          "1-2": 0,
          "3-4": 0,
          "5+": 0,
        } as Record<string, number>,
        walkingDistance: {
          short: 0,
          medium: 0,
          long: 0,
        } as Record<string, number>,
      },
    };

    // Populate team pricing
    if (teamsResult.data) {
      for (const team of teamsResult.data) {
        const group = team.team_group as "move" | "loaders" | "unloading";
        if (pricing.teams[group]) {
          pricing.teams[group][team.team_option] = {
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
      for (const stair of stairsResult.data) {
        pricing.accessibility.stairsCharge[stair.stairs_range] = parseFloat(stair.charge);
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
