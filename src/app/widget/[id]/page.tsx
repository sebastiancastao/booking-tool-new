import { EmbeddedWidget } from "@/components/widget/EmbeddedWidget";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { WidgetConfig } from "@/types";
import { DEFAULT_PRICING_CONFIG } from "@/types";
import { Suspense } from "react";

interface WidgetPageProps {
  params: Promise<{ id: string }>;
}

// Demo widget config for when Supabase is not configured
const demoWidgetConfig: WidgetConfig = {
  id: "demo",
  name: "Demo Widget",
  companyName: "Demo Moving Co.",
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  fontFamily: "Inter",
  buttonText: "Get Free Quote",
  successMessage: "Thank you! We will contact you within 24 hours.",
  customFields: [],
  enableInsurance: true,
  enableSpecialItems: true,
  enableInventory: true,
  pricing: DEFAULT_PRICING_CONFIG,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: "",
};

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { id } = await params;

  // For demo purposes, return demo widget if no Supabase configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || id === "demo") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
        <EmbeddedWidget config={demoWidgetConfig} />
      </Suspense>
    );
  }

  try {
    const supabase = await createClient();

    const { data: widget, error } = await supabase
      .from("widgets")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !widget) {
      notFound();
    }

    const widgetConfig: WidgetConfig = {
      id: widget.id,
      name: widget.name,
      companyName: widget.company_name,
      logo: widget.logo,
      primaryColor: widget.primary_color,
      secondaryColor: widget.secondary_color,
      backgroundColor: widget.background_color,
      textColor: widget.text_color,
      fontFamily: widget.font_family,
      buttonText: widget.button_text,
      successMessage: widget.success_message,
      customFields: widget.custom_fields || [],
      enableInsurance: widget.enable_insurance,
      enableSpecialItems: widget.enable_special_items,
      enableInventory: widget.enable_inventory,
      pricing: DEFAULT_PRICING_CONFIG,
      createdAt: widget.created_at,
      updatedAt: widget.updated_at,
      userId: widget.user_id,
    };

    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
        <EmbeddedWidget config={widgetConfig} />
      </Suspense>
    );
  } catch {
    // If Supabase fails, show demo widget
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
        <EmbeddedWidget config={demoWidgetConfig} />
      </Suspense>
    );
  }
}
