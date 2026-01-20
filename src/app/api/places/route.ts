import { NextRequest, NextResponse } from "next/server";

type GooglePlacesPrediction = {
  description: string;
  place_id: string;
};

type GooglePlacesResponse = {
  status: string;
  predictions?: GooglePlacesPrediction[];
  error_message?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input")?.trim() ?? "";

    if (input.length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured." },
        { status: 500 }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("types", "geocode");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places fetch failed:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch Google Places results.", status: response.status },
        { status: 502 }
      );
    }

    const data = (await response.json()) as GooglePlacesResponse;
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places error:", data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || "Google Places error.", status: data.status },
        { status: 502 }
      );
    }

    const predictions = (data.predictions ?? [])
      .slice(0, 5)
      .map((prediction) => ({
        description: prediction.description,
        placeId: prediction.place_id,
      }));

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
