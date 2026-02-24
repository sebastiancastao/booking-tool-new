import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeSubmittedAt(value: unknown): string {
  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function toTimeOnly(isoDateTime: string): string {
  const timePart = isoDateTime.split("T")[1] ?? "";
  const hhmmss = timePart.slice(0, 8);
  return /^\d{2}:\d{2}:\d{2}$/.test(hhmmss) ? hhmmss : "00:00:00";
}

function shouldRetryWithTime(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? error.code : null;
  const maybeMessage = "message" in error ? error.message : null;
  const code = typeof maybeCode === "string" ? maybeCode : "";
  const message = typeof maybeMessage === "string" ? maybeMessage.toLowerCase() : "";

  return code === "22007" && message.includes("type time");
}

function shouldRetryWithoutDate(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? error.code : null;
  const maybeMessage = "message" in error ? error.message : null;
  const code = typeof maybeCode === "string" ? maybeCode : "";
  const message = typeof maybeMessage === "string" ? maybeMessage.toLowerCase() : "";

  return code === "42703" && message.includes("date");
}

// Helper function to upsert contact and return contact_id
async function upsertContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  widgetId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  submittedAt: string,
  submittedDate: string
): Promise<string | null> {
  const submittedTime = toTimeOnly(submittedAt);

  // Check if contact exists
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("widget_id", widgetId)
    .eq("email", email)
    .single();

  if (existingContact) {
    // Update existing contact
    let { error: updateError } = await supabase
      .from("contacts")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        date: submittedDate,
        updated_at: submittedAt,
      })
      .eq("id", existingContact.id);

    if (updateError && shouldRetryWithTime(updateError)) {
      console.warn(
        "Retrying booking contact upsert using time value for contacts.date:",
        updateError
      );
      const retryWithTime = await supabase
        .from("contacts")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          date: submittedTime,
          updated_at: submittedAt,
        })
        .eq("id", existingContact.id);
      updateError = retryWithTime.error;
    }

    if (updateError && shouldRetryWithoutDate(updateError)) {
      console.warn(
        "Retrying booking contact upsert without date column due schema mismatch:",
        updateError
      );
      const retry = await supabase
        .from("contacts")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: submittedAt,
        })
        .eq("id", existingContact.id);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("Error updating contact:", updateError);
    }
    return existingContact.id;
  } else {
    // Create new contact
    let { data: newContact, error } = await supabase
      .from("contacts")
      .insert({
        widget_id: widgetId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        source: "booking_form",
        date: submittedDate,
        created_at: submittedAt,
        updated_at: submittedAt,
      })
      .select("id")
      .single();

    if (error && shouldRetryWithTime(error)) {
      console.warn(
        "Retrying booking contact insert using time value for contacts.date:",
        error
      );
      const retryWithTime = await supabase
        .from("contacts")
        .insert({
          widget_id: widgetId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          source: "booking_form",
          date: submittedTime,
          created_at: submittedAt,
          updated_at: submittedAt,
        })
        .select("id")
        .single();
      newContact = retryWithTime.data;
      error = retryWithTime.error;
    }

    if (error && shouldRetryWithoutDate(error)) {
      console.warn(
        "Retrying booking contact insert without date column due schema mismatch:",
        error
      );
      const retry = await supabase
        .from("contacts")
        .insert({
          widget_id: widgetId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          source: "booking_form",
          created_at: submittedAt,
          updated_at: submittedAt,
        })
        .select("id")
        .single();
      newContact = retry.data;
      error = retry.error;
    }

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
    const submittedAt = normalizeSubmittedAt(body.submittedAt);
    const submittedDate = submittedAt.split("T")[0];

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
      body.phone,
      submittedAt,
      submittedDate
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
