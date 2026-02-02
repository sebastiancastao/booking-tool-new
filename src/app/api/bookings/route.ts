import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to upsert contact and return contact_id
async function upsertContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  widgetId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string
): Promise<string | null> {
  // Check if contact exists
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("widget_id", widgetId)
    .eq("email", email)
    .single();

  if (existingContact) {
    // Update existing contact
    await supabase
      .from("contacts")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      })
      .eq("id", existingContact.id);
    return existingContact.id;
  } else {
    // Create new contact
    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert({
        widget_id: widgetId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        source: "booking_form",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating contact:", error);
      return null;
    }
    return newContact?.id || null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "moveDate",
      "pickupStreet",
      "pickupCity",
      "pickupState",
      "pickupZip",
      "dropoffStreet",
      "dropoffCity",
      "dropoffState",
      "dropoffZip",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // If Supabase is not configured, return success for demo purposes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: true,
        message: "Booking received (demo mode)",
        id: "demo-" + Date.now(),
      });
    }

    const supabase = await createClient();

    // First, upsert the contact to get contact_id
    const contactId = await upsertContact(
      supabase,
      body.widgetId,
      body.firstName,
      body.lastName,
      body.email,
      body.phone
    );

    const { data, error } = await supabase.from("bookings").insert({
      widget_id: body.widgetId,
      contact_id: contactId,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phone: body.phone,
      move_date: body.moveDate,
      move_time: body.moveTime || null,
      flexible_dates: body.flexibleDates || false,
      pickup_street: body.pickupStreet,
      pickup_unit: body.pickupUnit || null,
      pickup_city: body.pickupCity,
      pickup_state: body.pickupState,
      pickup_zip: body.pickupZip,
      pickup_property_type: body.pickupPropertyType || null,
      pickup_floor: body.pickupFloor ? parseInt(body.pickupFloor) : null,
      pickup_elevator: body.pickupElevator || false,
      dropoff_street: body.dropoffStreet,
      dropoff_unit: body.dropoffUnit || null,
      dropoff_city: body.dropoffCity,
      dropoff_state: body.dropoffState,
      dropoff_zip: body.dropoffZip,
      dropoff_property_type: body.dropoffPropertyType || null,
      dropoff_floor: body.dropoffFloor ? parseInt(body.dropoffFloor) : null,
      dropoff_elevator: body.dropoffElevator || false,
      inventory: body.inventory || [],
      estimated_size: body.estimatedSize || null,
      special_items: body.specialItems || [],
      packing_service: body.packingService || false,
      unpacking_service: body.unpackingService || false,
      storage_needed: body.storageNeeded || false,
      storage_duration: body.storageDuration || null,
      insurance_option: body.insuranceOption || null,
      declared_value: body.declaredValue ? parseFloat(body.declaredValue) : null,
      custom_field_values: body.customFieldValues || {},
      additional_notes: body.additionalNotes || null,
    }).select().single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      id: data.id,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ bookings: [], total: 0 });
    }

    const supabase = await createClient();

    let query = supabase.from("bookings").select("*", { count: "exact" });

    if (widgetId) {
      query = query.eq("widget_id", widgetId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
