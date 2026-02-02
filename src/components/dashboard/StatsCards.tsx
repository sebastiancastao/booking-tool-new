"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface StatsCardsProps {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  thisMonthBookings: number;
}

export function StatsCards({
  totalBookings,
  pendingBookings,
  completedBookings,
  thisMonthBookings,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: CalendarCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Pending",
      value: pendingBookings,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Completed",
      value: completedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "This Month",
      value: thisMonthBookings,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
