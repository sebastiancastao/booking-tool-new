"use client";

import { WidgetConfig } from "@/types";
import { BookingForm } from "./BookingForm";

interface WidgetPreviewProps {
  config: WidgetConfig;
  isPreview?: boolean;
}

export function WidgetPreview({ config, isPreview = true }: WidgetPreviewProps) {
  const fontFamilyClass = getFontFamilyClass(config.fontFamily);

  return (
    <div
      className={`rounded-lg shadow-lg overflow-hidden ${fontFamilyClass}`}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
    >
      {/* Form */}
      <div className="p-6">
        <BookingForm config={config} isPreview={isPreview} />
      </div>
    </div>
  );
}

function getFontFamilyClass(fontFamily: string): string {
  const fontMap: Record<string, string> = {
    Inter: "font-sans",
    "Roboto": "font-sans",
    "Open Sans": "font-sans",
    "Lato": "font-sans",
    "Montserrat": "font-sans",
    "Georgia": "font-serif",
    "Times New Roman": "font-serif",
    "Courier New": "font-mono",
  };
  return fontMap[fontFamily] || "font-sans";
}
