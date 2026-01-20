"use client";

import { useState, useEffect } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { BookingsTable } from "@/components/dashboard/BookingsTable";
import { WidgetsList } from "@/components/dashboard/WidgetsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Truck, LayoutDashboard, Settings, Plus } from "lucide-react";
import Link from "next/link";
import type { WidgetConfig, BookingStatus } from "@/types";
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

const demoBookings = [
  {
    id: "1",
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    move_date: "2024-02-15",
    status: "pending" as BookingStatus,
    pickup_city: "New York",
    pickup_state: "NY",
    dropoff_city: "Los Angeles",
    dropoff_state: "CA",
    estimated_size: "2br",
    created_at: "2024-01-25T09:00:00Z",
    packing_service: true,
    storage_needed: false,
  },
  {
    id: "2",
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    move_date: "2024-02-20",
    status: "confirmed" as BookingStatus,
    pickup_city: "Chicago",
    pickup_state: "IL",
    dropoff_city: "Miami",
    dropoff_state: "FL",
    estimated_size: "3br",
    created_at: "2024-01-24T14:30:00Z",
    packing_service: true,
    storage_needed: true,
  },
  {
    id: "3",
    first_name: "Mike",
    last_name: "Williams",
    email: "mike.w@example.com",
    phone: "(555) 456-7890",
    move_date: "2024-02-10",
    status: "completed" as BookingStatus,
    pickup_city: "Seattle",
    pickup_state: "WA",
    dropoff_city: "Portland",
    dropoff_state: "OR",
    estimated_size: "1br",
    created_at: "2024-01-20T11:00:00Z",
    packing_service: false,
    storage_needed: false,
  },
  {
    id: "4",
    first_name: "Emily",
    last_name: "Brown",
    email: "emily.b@example.com",
    phone: "(555) 321-0987",
    move_date: "2024-03-01",
    status: "pending" as BookingStatus,
    pickup_city: "Boston",
    pickup_state: "MA",
    dropoff_city: "Philadelphia",
    dropoff_state: "PA",
    estimated_size: "studio",
    created_at: "2024-01-26T16:45:00Z",
    packing_service: false,
    storage_needed: false,
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [bookings, setBookings] = useState(demoBookings);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

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
      } finally {
        setLoadingWidgets(false);
      }
    }
    fetchWidgets();
  }, []);

  // Calculate stats
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
    thisMonthBookings: bookings.filter((b) => {
      const bookingDate = new Date(b.created_at);
      const now = new Date();
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  const handleStatusChange = (bookingId: string, status: BookingStatus) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
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
                <h1 className="text-xl font-bold">Moving Widget Creator</h1>
                <p className="text-sm text-gray-500">Manage your booking widgets</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="widgets">
              <Settings className="w-4 h-4 mr-2" />
              Widgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <StatsCards {...stats} />
            <BookingsTable
              bookings={bookings}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="widgets">
            <WidgetsList widgets={widgets} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
