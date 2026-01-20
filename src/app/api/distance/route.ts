import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured." },
        { status: 500 }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", destination);
    url.searchParams.set("units", "imperial");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: data.error_message || "Failed to calculate distance." },
        { status: 500 }
      );
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { error: "Could not calculate distance between these locations." },
        { status: 400 }
      );
    }

    // Distance is in meters, convert to miles
    const distanceMeters = element.distance.value;
    const distanceMiles = distanceMeters / 1609.34;

    // Duration is in seconds, convert to hours
    const durationSeconds = element.duration.value;
    const durationHours = durationSeconds / 3600;

    return NextResponse.json({
      distance: {
        text: element.distance.text,
        miles: Math.round(distanceMiles * 10) / 10,
      },
      duration: {
        text: element.duration.text,
        hours: Math.round(durationHours * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Distance calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate distance." },
      { status: 500 }
    );
  }
}
