import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PricingConfig } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

async function savePricingData(
  supabase: SupabaseClient,
  widgetId: number,
  pricing: PricingConfig
) {
  console.log("Saving pricing data for widget:", widgetId);

  // Save team pricing
  const teamInserts = [];
  for (const [group, teams] of Object.entries(pricing.teams)) {
    for (const [option, data] of Object.entries(teams)) {
      teamInserts.push({
        widget_id: widgetId,
        team_group: group,
        team_option: option,
        rate: data.rate,
        minimum_hours: data.minimumHours,
      });
    }
  }

  // Delete existing and insert new team pricing
  const { error: teamDeleteError } = await supabase.from("pricing_teams").delete().eq("widget_id", widgetId);
  if (teamDeleteError) console.error("Error deleting team pricing:", teamDeleteError);

  if (teamInserts.length > 0) {
    const { error: teamInsertError } = await supabase.from("pricing_teams").insert(teamInserts);
    if (teamInsertError) console.error("Error inserting team pricing:", teamInsertError);
    else console.log("Team pricing saved:", teamInserts.length, "records");
  }

  // Save labor estimates
  const laborInserts = [];
  for (const [group, estimates] of Object.entries(pricing.estimateLabor)) {
    for (const [option, data] of Object.entries(estimates)) {
      laborInserts.push({
        widget_id: widgetId,
        estimate_group: group,
        estimate_option: option,
        min_labor: data.minLabor,
        max_labor: data.maxLabor,
      });
    }
  }

  const { error: laborDeleteError } = await supabase.from("pricing_labor_estimates").delete().eq("widget_id", widgetId);
  if (laborDeleteError) console.error("Error deleting labor estimates:", laborDeleteError);

  if (laborInserts.length > 0) {
    const { error: laborInsertError } = await supabase.from("pricing_labor_estimates").insert(laborInserts);
    if (laborInsertError) console.error("Error inserting labor estimates:", laborInsertError);
    else console.log("Labor estimates saved:", laborInserts.length, "records");
  }

  // Save travel pricing
  const { error: travelDeleteError } = await supabase.from("pricing_travel").delete().eq("widget_id", widgetId);
  if (travelDeleteError) console.error("Error deleting travel pricing:", travelDeleteError);

  const { error: travelInsertError } = await supabase.from("pricing_travel").insert({
    widget_id: widgetId,
    travel_rate: pricing.travelRate,
    price_per_mile: pricing.pricePerMile,
  });
  if (travelInsertError) console.error("Error inserting travel pricing:", travelInsertError);
  else console.log("Travel pricing saved");

  // Save protection pricing
  const { error: protectionDeleteError } = await supabase.from("pricing_protection").delete().eq("widget_id", widgetId);
  if (protectionDeleteError) console.error("Error deleting protection pricing:", protectionDeleteError);

  const { error: protectionInsertError } = await supabase.from("pricing_protection").insert({
    widget_id: widgetId,
    protection_charge: pricing.protectionCharge,
  });
  if (protectionInsertError) console.error("Error inserting protection pricing:", protectionInsertError);
  else console.log("Protection pricing saved");

  // Save accessibility pricing
  const { error: accessibilityDeleteError } = await supabase.from("pricing_accessibility").delete().eq("widget_id", widgetId);
  if (accessibilityDeleteError) console.error("Error deleting accessibility pricing:", accessibilityDeleteError);

  const { error: accessibilityInsertError } = await supabase.from("pricing_accessibility").insert({
    widget_id: widgetId,
    no_elevator_charge: pricing.accessibility.noElevatorCharge,
  });
  if (accessibilityInsertError) console.error("Error inserting accessibility pricing:", accessibilityInsertError);
  else console.log("Accessibility pricing saved");

  // Save stairs charges
  const stairsInserts = Object.entries(pricing.accessibility.stairsCharge).map(
    ([range, charge]) => ({
      widget_id: widgetId,
      stairs_range: range,
      charge: charge,
    })
  );

  const { error: stairsDeleteError } = await supabase.from("pricing_stairs").delete().eq("widget_id", widgetId);
  if (stairsDeleteError) console.error("Error deleting stairs pricing:", stairsDeleteError);

  if (stairsInserts.length > 0) {
    const { error: stairsInsertError } = await supabase.from("pricing_stairs").insert(stairsInserts);
    if (stairsInsertError) console.error("Error inserting stairs pricing:", stairsInsertError);
    else console.log("Stairs pricing saved:", stairsInserts.length, "records");
  }

  // Save walking distance charges
  const walkingInserts = Object.entries(pricing.accessibility.walkingDistance).map(
    ([type, charge]) => ({
      widget_id: widgetId,
      distance_type: type,
      charge: charge,
    })
  );

  const { error: walkingDeleteError } = await supabase.from("pricing_walking_distance").delete().eq("widget_id", widgetId);
  if (walkingDeleteError) console.error("Error deleting walking distance pricing:", walkingDeleteError);

  if (walkingInserts.length > 0) {
    const { error: walkingInsertError } = await supabase.from("pricing_walking_distance").insert(walkingInserts);
    if (walkingInsertError) console.error("Error inserting walking distance pricing:", walkingInsertError);
    else console.log("Walking distance pricing saved:", walkingInserts.length, "records");
  }

  console.log("Pricing data save complete for widget:", widgetId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: true,
        message: "Widget saved (demo mode)",
        id: "demo-" + Date.now(),
      });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Allow unauthenticated saves in development, use a default user_id
    const userId = user?.id || "anonymous";

    // Generate a unique widget key
    const widgetKey = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const { data, error } = await supabase.from("widgets").insert({
      user_id: userId,
      company_id: body.companyId || 1, // Default company ID for development
      service_category: body.serviceCategory || "moving", // Default service category
      widget_key: body.widgetKey || widgetKey,
      name: body.name,
      company_name: body.companyName,
      logo: body.logo || null,
      primary_color: body.primaryColor,
      secondary_color: body.secondaryColor,
      background_color: body.backgroundColor,
      text_color: body.textColor,
      font_family: body.fontFamily,
      button_text: body.buttonText,
      success_message: body.successMessage,
      custom_fields: body.customFields || [],
      enable_insurance: body.enableInsurance,
      enable_special_items: body.enableSpecialItems,
      enable_inventory: body.enableInventory,
    }).select().single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create widget" },
        { status: 500 }
      );
    }

    // Save pricing data if provided
    if (body.pricing) {
      try {
        await savePricingData(supabase, data.id, body.pricing);
      } catch (pricingError) {
        console.error("Error saving pricing data:", pricingError);
        // Widget was created, but pricing failed - don't fail the whole request
      }
    }

    return NextResponse.json({
      success: true,
      message: "Widget created successfully",
      id: data.id,
      widget: data,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ widgets: [] });
    }

    const supabase = await createClient();

    // Fetch all widgets for development (no user filter)
    const { data, error } = await supabase
      .from("widgets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching widgets:", error);
      return NextResponse.json(
        { error: "Failed to fetch widgets" },
        { status: 500 }
      );
    }

    console.log("Fetched widgets:", data?.length || 0);
    return NextResponse.json({ widgets: data || [] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    console.log("PUT /api/widgets - id:", id, "pricing provided:", !!updates.pricing);

    if (!id) {
      return NextResponse.json(
        { error: "Widget ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: true,
        message: "Widget updated (demo mode)",
        id,
      });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Allow unauthenticated updates in development
    const userId = user?.id || "anonymous";

    // Update widget without user_id filter (for development)
    const { data, error } = await supabase
      .from("widgets")
      .update({
        name: updates.name,
        company_name: updates.companyName,
        logo: updates.logo || null,
        primary_color: updates.primaryColor,
        secondary_color: updates.secondaryColor,
        background_color: updates.backgroundColor,
        text_color: updates.textColor,
        font_family: updates.fontFamily,
        button_text: updates.buttonText,
        success_message: updates.successMessage,
        custom_fields: updates.customFields || [],
        enable_insurance: updates.enableInsurance,
        enable_special_items: updates.enableSpecialItems,
        enable_inventory: updates.enableInventory,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating widget:", error);
      return NextResponse.json(
        { error: "Failed to update widget" },
        { status: 500 }
      );
    }

    console.log("Widget updated successfully, now saving pricing...");

    // Save pricing data if provided
    if (updates.pricing) {
      try {
        const widgetId = typeof id === 'string' ? parseInt(id, 10) : id;
        console.log("Calling savePricingData with widgetId:", widgetId);
        await savePricingData(supabase, widgetId, updates.pricing);
        console.log("Pricing data saved successfully");
      } catch (pricingError) {
        console.error("Error saving pricing data:", pricingError);
        // Widget was updated, but pricing failed - don't fail the whole request
      }
    } else {
      console.log("No pricing data provided in update");
    }

    return NextResponse.json({
      success: true,
      message: "Widget updated successfully",
      widget: data,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
