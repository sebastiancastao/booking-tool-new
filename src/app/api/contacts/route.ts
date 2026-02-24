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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId");

    // If Supabase is not configured, return demo data
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        contacts: [
          {
            id: "demo-1",
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
            phone: "555-123-4567",
            preferred_contact_method: "email",
            source: "booking_form",
            created_at: new Date().toISOString(),
          },
          {
            id: "demo-2",
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com",
            phone: "555-987-6543",
            preferred_contact_method: "phone",
            source: "booking_form",
            created_at: new Date().toISOString(),
          },
        ],
        total: 2,
      });
    }

    const supabase = await createClient();

    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" });

    if (widgetId) {
      query = query.eq("widget_id", widgetId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contacts: data || [],
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const submittedAt = normalizeSubmittedAt(body.submittedAt);
    const submittedDate = submittedAt.split("T")[0];
    const submittedTime = toTimeOnly(submittedAt);

    // Validate required fields
    const requiredFields = ["widgetId", "firstName", "lastName", "email", "phone"];
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
        message: "Contact saved (demo mode)",
        id: "demo-" + Date.now(),
      });
    }

    const supabase = await createClient();

    // Check if contact already exists (by widget_id and email)
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("widget_id", body.widgetId)
      .eq("email", body.email)
      .single();

    if (existingContact) {
      // Update existing contact
      let { data, error } = await supabase
        .from("contacts")
        .update({
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
          date: submittedDate,
          updated_at: submittedAt,
        })
        .eq("id", existingContact.id)
        .select()
        .single();

      if (error && shouldRetryWithTime(error)) {
        console.warn(
          "Retrying contact update using time value for contacts.date:",
          error
        );
        const retryWithTime = await supabase
          .from("contacts")
          .update({
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone,
            date: submittedTime,
            updated_at: submittedAt,
          })
          .eq("id", existingContact.id)
          .select()
          .single();
        data = retryWithTime.data;
        error = retryWithTime.error;
      }

      if (error && shouldRetryWithoutDate(error)) {
        console.warn(
          "Retrying contact update without date column due schema mismatch:",
          error
        );
        const retry = await supabase
          .from("contacts")
          .update({
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone,
            updated_at: submittedAt,
          })
          .eq("id", existingContact.id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to update contact" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Contact updated",
        id: data.id,
      });
    } else {
      // Create new contact
      let { data, error } = await supabase
        .from("contacts")
        .insert({
          widget_id: body.widgetId,
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          source: "booking_form",
          date: submittedDate,
          created_at: submittedAt,
          updated_at: submittedAt,
        })
        .select()
        .single();

      if (error && shouldRetryWithTime(error)) {
        console.warn(
          "Retrying contact insert using time value for contacts.date:",
          error
        );
        const retryWithTime = await supabase
          .from("contacts")
          .insert({
            widget_id: body.widgetId,
            first_name: body.firstName,
            last_name: body.lastName,
            email: body.email,
            phone: body.phone,
            source: "booking_form",
            date: submittedTime,
            created_at: submittedAt,
            updated_at: submittedAt,
          })
          .select()
          .single();
        data = retryWithTime.data;
        error = retryWithTime.error;
      }

      if (error && shouldRetryWithoutDate(error)) {
        console.warn(
          "Retrying contact insert without date column due schema mismatch:",
          error
        );
        const retry = await supabase
          .from("contacts")
          .insert({
            widget_id: body.widgetId,
            first_name: body.firstName,
            last_name: body.lastName,
            email: body.email,
            phone: body.phone,
            source: "booking_form",
            created_at: submittedAt,
            updated_at: submittedAt,
          })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to create contact" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Contact created",
        id: data.id,
      });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ success: true, message: "Contact deleted (demo mode)" });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
