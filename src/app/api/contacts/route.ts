import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      const { data, error } = await supabase
        .from("contacts")
        .update({
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
        })
        .eq("id", existingContact.id)
        .select()
        .single();

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
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          widget_id: body.widgetId,
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          source: "booking_form",
        })
        .select()
        .single();

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
