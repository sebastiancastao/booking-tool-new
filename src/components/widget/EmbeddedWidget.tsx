"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { WidgetPreview } from "./WidgetPreview";
import type { WidgetConfig } from "@/types";

interface EmbeddedWidgetProps {
  config: WidgetConfig;
}

export function EmbeddedWidget({ config }: EmbeddedWidgetProps) {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "true";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEmbedded || typeof window === "undefined") return;

    const sendHeight = () => {
      if (containerRef.current && window.parent !== window) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage(
          {
            type: "resize",
            widgetId: config.id,
            height: height + 40, // Add some padding
          },
          "*"
        );
      }
    };

    // Send initial height
    sendHeight();

    // Create observer to watch for height changes
    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also send height on window resize
    window.addEventListener("resize", sendHeight);

    // Send height periodically to catch any dynamic content changes
    const interval = setInterval(sendHeight, 500);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", sendHeight);
      clearInterval(interval);
    };
  }, [isEmbedded, config.id]);

  if (isEmbedded) {
    return (
      <div ref={containerRef} className="w-full min-h-screen bg-gray-50">
        <WidgetPreview config={config} isPreview={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <WidgetPreview config={config} isPreview={false} />
      </div>
    </div>
  );
}
