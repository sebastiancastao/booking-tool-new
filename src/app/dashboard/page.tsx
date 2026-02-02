"use client";

import { useState, useEffect } from "react";
import { WidgetsList } from "@/components/dashboard/WidgetsList";
import { Button } from "@/components/ui/button";
import { Truck, Plus } from "lucide-react";
import Link from "next/link";
import type { WidgetConfig } from "@/types";
import { DEFAULT_PRICING_CONFIG } from "@/types";

// Demo data for when Supabase is not configured
const demoWidgets: WidgetConfig[] = [
  {
    id: "demo-1",
    name: "Main Website Widget",
    companyName: "Swift Movers",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    fontFamily: "Inter",
    buttonText: "Get Free Quote",
    successMessage: "Thank you! We'll contact you within 24 hours.",
    customFields: [],
    enableInsurance: true,
    enableSpecialItems: true,
    enableInventory: true,
    pricing: DEFAULT_PRICING_CONFIG,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    userId: "demo",
  },
  {
    id: "demo-2",
    name: "Landing Page Widget",
    companyName: "Swift Movers",
    primaryColor: "#10B981",
    secondaryColor: "#059669",
    backgroundColor: "#F9FAFB",
    textColor: "#111827",
    fontFamily: "Roboto",
    buttonText: "Request Quote",
    successMessage: "Thanks for your request!",
    customFields: [],
    enableInsurance: true,
    enableSpecialItems: false,
    enableInventory: true,
    pricing: DEFAULT_PRICING_CONFIG,
    createdAt: "2024-01-20T14:30:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    userId: "demo",
  },
];

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  // Fetch widgets from the database
  useEffect(() => {
    async function fetchWidgets() {
      try {
        const response = await fetch("/api/widgets");
        const data = await response.json();
        if (data.widgets && data.widgets.length > 0) {
          // Transform database format to WidgetConfig format
          const transformedWidgets = data.widgets.map((w: Record<string, unknown>) => ({
            id: w.id,
            name: w.name || "Unnamed Widget",
            companyName: w.company_name || "",
            logo: w.logo || "",
            primaryColor: w.primary_color || "#3B82F6",
            secondaryColor: w.secondary_color || "#1E40AF",
            backgroundColor: w.background_color || "#FFFFFF",
            textColor: w.text_color || "#1F2937",
            fontFamily: w.font_family || "Inter",
            buttonText: w.button_text || "Get Free Quote",
            successMessage: w.success_message || "",
            customFields: w.custom_fields || [],
            enableInsurance: w.enable_insurance ?? true,
            enableSpecialItems: w.enable_special_items ?? true,
            enableInventory: w.enable_inventory ?? true,
            pricing: DEFAULT_PRICING_CONFIG,
            createdAt: w.created_at as string,
            updatedAt: w.updated_at as string || w.created_at as string,
            userId: w.user_id as string || "",
          }));
          setWidgets(transformedWidgets);
        } else {
          // Fall back to demo widgets if no widgets in database
          setWidgets(demoWidgets);
        }
      } catch (error) {
        console.error("Error fetching widgets:", error);
        setWidgets(demoWidgets);
      }
    }
    fetchWidgets();
  }, []);

  const handleDeleteWidget = async (widgetId: string) => {
    const isConfirmed = window.confirm("Delete this widget? This cannot be undone.");
    if (!isConfirmed) return;

    const widgetIdValue = String(widgetId);

    if (widgetIdValue.startsWith("demo-")) {
      setWidgets((prev) => prev.filter((widget) => String(widget.id) !== widgetIdValue));
      return;
    }

    try {
      const response = await fetch(`/api/widgets?id=${encodeURIComponent(widgetIdValue)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete widget");
      }

      setWidgets((prev) => prev.filter((widget) => String(widget.id) !== widgetIdValue));
    } catch (error) {
      console.error("Error deleting widget:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Moving Widget Creator</h1>
                <p className="text-sm text-gray-700">Manage your booking widgets</p>
              </div>
            </div>
            <Link href="/dashboard/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Widget
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <WidgetsList widgets={widgets} onDelete={handleDeleteWidget} />
      </main>
    </div>
  );
}
