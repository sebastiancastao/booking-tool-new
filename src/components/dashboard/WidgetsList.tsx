"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Copy,
  ExternalLink,
  Settings,
  Trash2,
  Check,
  MoreVertical,
} from "lucide-react";
import type { WidgetConfig } from "@/types";
import Link from "next/link";

interface WidgetsListProps {
  widgets: WidgetConfig[];
  onDelete?: (widgetId: string) => void;
}

export function WidgetsList({ widgets, onDelete }: WidgetsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyWidgetLink = (widgetId: string) => {
    const link = `${window.location.origin}/widget/${widgetId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(widgetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Widgets</CardTitle>
          <Link href="/dashboard/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Widget
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {widgets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No widgets created yet</p>
            <p className="text-sm mt-1">Create your first widget to start collecting bookings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <Card key={widget.id} className="overflow-hidden">
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(135deg, ${widget.primaryColor} 0%, ${widget.secondaryColor} 100%)`,
                  }}
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{widget.name}</h3>
                      <p className="text-sm text-gray-700">{widget.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyWidgetLink(widget.id)}
                        title="Copy widget link"
                      >
                        {copiedId === widget.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Link href={`/widget/${widget.id}`} target="_blank">
                        <Button variant="ghost" size="icon" title="Open widget">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {widget.enableInventory && (
                      <Badge variant="secondary">Inventory</Badge>
                    )}
                    {widget.enableSpecialItems && (
                      <Badge variant="secondary">Special Items</Badge>
                    )}
                    {widget.enableInsurance && (
                      <Badge variant="secondary">Insurance</Badge>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Created {new Date(widget.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/edit/${widget.id}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(widget.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
