import { NextRequest, NextResponse } from "next/server";

const RECIPIENTS = ["service@furnituretaxi.site", "sebastiancastao379@gmail.com"];

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function buildEmailText(payload: Record<string, unknown>) {
  const summary = payload.summary as Record<string, unknown> | undefined;
  const form = payload.form as Record<string, unknown> | undefined;

  const lines = [
    "New reservation confirmation",
    "",
    `Contact: ${formatValue(summary?.contactName)}`,
    `Summary: ${formatValue(summary?.contactSummaryLine)}`,
    `Route: ${formatValue(summary?.routeSummary)}`,
    `When: ${formatValue(summary?.moveDateSummary)}`,
    `Team: ${formatValue(summary?.team)}`,
    `Estimate: ${formatValue(summary?.estimateLabel)}`,
    "",
    "Form details:",
    `First name: ${formatValue(form?.firstName)}`,
    `Last name: ${formatValue(form?.lastName)}`,
    `Email: ${formatValue(form?.email)}`,
    `Phone: ${formatValue(form?.phone)}`,
    `Move date: ${formatValue(form?.moveDate)}`,
    `Move time: ${formatValue(form?.moveTime)}`,
    `Flexible dates: ${formatValue(form?.flexibleDates)}`,
    `Pickup street: ${formatValue(form?.pickupStreet)}`,
    `Pickup unit: ${formatValue(form?.pickupUnit)}`,
    `Pickup city: ${formatValue(form?.pickupCity)}`,
    `Pickup state: ${formatValue(form?.pickupState)}`,
    `Pickup ZIP: ${formatValue(form?.pickupZip)}`,
    `Pickup property type: ${formatValue(form?.pickupPropertyType)}`,
    `Pickup floor: ${formatValue(form?.pickupFloor)}`,
    `Pickup elevator: ${formatValue(form?.pickupElevator)}`,
    `Dropoff street: ${formatValue(form?.dropoffStreet)}`,
    `Dropoff unit: ${formatValue(form?.dropoffUnit)}`,
    `Dropoff city: ${formatValue(form?.dropoffCity)}`,
    `Dropoff state: ${formatValue(form?.dropoffState)}`,
    `Dropoff ZIP: ${formatValue(form?.dropoffZip)}`,
    `Dropoff property type: ${formatValue(form?.dropoffPropertyType)}`,
    `Dropoff floor: ${formatValue(form?.dropoffFloor)}`,
    `Dropoff elevator: ${formatValue(form?.dropoffElevator)}`,
    `Estimated size: ${formatValue(form?.estimatedSize)}`,
    `Packing service: ${formatValue(form?.packingService)}`,
    `Unpacking service: ${formatValue(form?.unpackingService)}`,
    `Storage needed: ${formatValue(form?.storageNeeded)}`,
    `Storage duration: ${formatValue(form?.storageDuration)}`,
    `Insurance option: ${formatValue(form?.insuranceOption)}`,
    `Declared value: ${formatValue(form?.declaredValue)}`,
    `Notes: ${formatValue(form?.additionalNotes)}`,
    "",
    "Raw payload:",
    JSON.stringify(payload, null, 2),
  ];

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const debug = process.env.DEBUG_CONFIRM === "true";
  const logDebug = (...args: unknown[]) => {
    if (debug) console.log("[confirm]", ...args);
  };

  try {
    const payload = await request.json();
    const apiKey = process.env.RESEND_API_KEY;

    logDebug("Payload keys:", Object.keys(payload || {}));
    logDebug("Form email:", payload?.form?.email);
    logDebug("Has API key:", Boolean(apiKey));

    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const from = process.env.RESEND_FROM || "Bookings <service@furnituretaxi.site>";
    const replyTo =
      payload?.form?.email && typeof payload.form.email === "string"
        ? payload.form.email
        : undefined;

    const emailPayload: Record<string, unknown> = {
      from,
      to: RECIPIENTS,
      subject: "New reservation confirmation",
      text: buildEmailText(payload),
    };

    if (replyTo) {
      emailPayload.reply_to = replyTo;
    }

    logDebug("Email from:", from);
    logDebug("Recipients:", RECIPIENTS);
    logDebug("Reply-to:", replyTo || "none");
    logDebug("Email text length:", String(emailPayload.text).length);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await resendResponse.text();
    logDebug("Resend status:", resendResponse.status, resendResponse.statusText);
    if (responseText) {
      logDebug("Resend response body:", responseText);
    }

    if (!resendResponse.ok) {
      return NextResponse.json(
        { error: "Failed to send confirmation email.", details: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirmation email error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
