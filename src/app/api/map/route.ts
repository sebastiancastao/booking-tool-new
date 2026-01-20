import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.trim() ?? "";

    if (!address) {
      return NextResponse.json({ error: "Missing address." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured." },
        { status: 500 }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
    url.searchParams.set("center", address);
    url.searchParams.set("zoom", "15");
    url.searchParams.set("size", "600x220");
    url.searchParams.set("scale", "2");
    url.searchParams.set("maptype", "roadmap");
    url.searchParams.set("markers", `color:0x3b82f6|${address}`);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Static map fetch failed:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch map preview.", status: response.status },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Map preview error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
