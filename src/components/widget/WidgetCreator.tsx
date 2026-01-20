"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { WidgetPreview } from "./WidgetPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Palette,
  Type,
  Settings,
  Code,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  DollarSign,
  Loader2,
} from "lucide-react";
import type { CustomField, WidgetConfig } from "@/types";

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Georgia",
  "Times New Roman",
];

const MOVE_TEAM_OPTIONS = [
  { id: "2-1", label: "2 movers, 1 truck" },
  { id: "3-1", label: "3 movers, 1 truck" },
  { id: "3-2", label: "3 movers, 2 trucks" },
  { id: "4-2", label: "4 movers, 2 trucks" },
] as const;

const LOADER_TEAM_OPTIONS = [
  { id: "loaders-2", label: "2 loaders" },
  { id: "loaders-3", label: "3 loaders" },
] as const;

const UNLOADING_TEAM_OPTIONS = [
  { id: "2-1", label: "2 movers, 1 truck" },
  { id: "3-1", label: "3 movers, 1 truck" },
] as const;

const HOME_ESTIMATE_OPTIONS = [
  { id: "studio", label: "Studio" },
  { id: "1bed", label: "1 Bedroom" },
  { id: "2bed", label: "2 Bedroom" },
  { id: "3bed", label: "3 Bedroom" },
  { id: "4bed", label: "4 Bedroom" },
  { id: "5bed", label: "5+ Bedroom" },
] as const;

const STORAGE_ESTIMATE_OPTIONS = [
  { id: "25", label: "25 sq ft" },
  { id: "50", label: "50 sq ft" },
  { id: "75", label: "75 sq ft" },
  { id: "100", label: "100 sq ft" },
  { id: "200", label: "200 sq ft" },
  { id: "300", label: "300 sq ft" },
] as const;

const OFFICE_ESTIMATE_OPTIONS = [
  { id: "1-4", label: "1 - 4 people" },
  { id: "5-9", label: "5 - 9 people" },
  { id: "10-19", label: "10 - 19 people" },
  { id: "20-49", label: "20 - 49 people" },
  { id: "50-99", label: "50 - 99 people" },
  { id: "over-100", label: "Over 100 people" },
] as const;

interface WidgetCreatorProps {
  widgetId?: string | number;
}

export function WidgetCreator({ widgetId }: WidgetCreatorProps = {}) {
  const router = useRouter();
  const {
    config,
    updateConfig,
    addCustomField,
    updateCustomField,
    removeCustomField,
  } = useWidgetConfig();

  const [activeTab, setActiveTab] = useState("branding");
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newFieldType, setNewFieldType] = useState<CustomField["type"]>("text");
  const [loading, setLoading] = useState(!!widgetId);
  const [currentWidgetId, setCurrentWidgetId] = useState<string | number | null>(widgetId || null);

  // Load existing widget data if widgetId is provided
  useEffect(() => {
    if (widgetId) {
      setLoading(true);
      fetch(`/api/widgets/${widgetId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.widget) {
            updateConfig(data.widget);
            setCurrentWidgetId(widgetId);
          }
        })
        .catch((err) => {
          console.error("Error loading widget:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [widgetId, updateConfig]);

  const updateTeamPricing = (
    group: "move" | "loaders" | "unloading",
    id: string,
    field: "rate" | "minimumHours",
    value: number
  ) => {
    const teamGroup = { ...config.pricing.teams[group] };
    const currentOption = teamGroup[id as keyof typeof teamGroup] as { rate: number; minimumHours: number };
    updateConfig({
      pricing: {
        ...config.pricing,
        teams: {
          ...config.pricing.teams,
          [group]: {
            ...teamGroup,
            [id]: {
              ...currentOption,
              [field]: value,
            },
          },
        },
      },
    });
  };

  const updateEstimateLabor = (
    group: "home" | "storage" | "office",
    id: string,
    field: "minLabor" | "maxLabor",
    value: number
  ) => {
    const rangeGroup = { ...config.pricing.estimateLabor[group] };
    const currentRange = rangeGroup[id as keyof typeof rangeGroup] as { minLabor: number; maxLabor: number };
    updateConfig({
      pricing: {
        ...config.pricing,
        estimateLabor: {
          ...config.pricing.estimateLabor,
          [group]: {
            ...rangeGroup,
            [id]: {
              ...currentRange,
              [field]: value,
            },
          },
        },
      },
    });
  };

  const updateTravelRate = (value: number) => {
    updateConfig({
      pricing: {
        ...config.pricing,
        travelRate: value,
      },
    });
  };

  const updatePricePerMile = (value: number) => {
    updateConfig({
      pricing: {
        ...config.pricing,
        pricePerMile: value,
      },
    });
  };

  const updateProtectionCharge = (value: number) => {
    updateConfig({
      pricing: {
        ...config.pricing,
        protectionCharge: value,
      },
    });
  };

  const updateAccessibility = (
    field: "noElevatorCharge" | "stairsCharge" | "walkingDistance",
    key: string | null,
    value: number
  ) => {
    if (field === "noElevatorCharge") {
      updateConfig({
        pricing: {
          ...config.pricing,
          accessibility: {
            ...config.pricing.accessibility,
            noElevatorCharge: value,
          },
        },
      });
    } else if (field === "stairsCharge" && key) {
      updateConfig({
        pricing: {
          ...config.pricing,
          accessibility: {
            ...config.pricing.accessibility,
            stairsCharge: {
              ...config.pricing.accessibility.stairsCharge,
              [key]: value,
            },
          },
        },
      });
    } else if (field === "walkingDistance" && key) {
      updateConfig({
        pricing: {
          ...config.pricing,
          accessibility: {
            ...config.pricing.accessibility,
            walkingDistance: {
              ...config.pricing.accessibility.walkingDistance,
              [key]: value,
            },
          },
        },
      });
    }
  };

  const handleAddCustomField = () => {
    addCustomField({
      label: "New Field",
      type: newFieldType,
      required: false,
      placeholder: "",
      options: newFieldType === "select" ? ["Option 1", "Option 2"] : undefined,
    });
  };

  const generateEmbedCode = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<!-- Moving Quote Widget -->
<div id="moving-widget-${config.id}"></div>
<script src="${baseUrl}/widget.js" data-widget-id="${config.id}"></script>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveWidget = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const isUpdate = !!currentWidgetId;
      const url = isUpdate ? "/api/widgets" : "/api/widgets";
      const method = isUpdate ? "PUT" : "POST";

      const payload = {
        ...(isUpdate && { id: currentWidgetId }),
        name: config.name,
        companyName: config.companyName,
        logo: config.logo,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        fontFamily: config.fontFamily,
        buttonText: config.buttonText,
        successMessage: config.successMessage,
        customFields: config.customFields,
        enableInsurance: config.enableInsurance,
        enableSpecialItems: config.enableSpecialItems,
        enableInventory: config.enableInventory,
        pricing: config.pricing,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save widget");
      }

      // If this was a new widget, redirect to the edit page
      if (!isUpdate && data.id) {
        setCurrentWidgetId(data.id);
        setSaveSuccess(true);
        // Redirect to edit page so subsequent saves update the same widget
        router.push(`/dashboard/edit/${data.id}`);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save widget");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading widget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentWidgetId ? "Edit Widget" : "Create Widget"}
            </h1>
            <p className="text-gray-500">Customize your moving quote widget</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>
            <Button onClick={handleSaveWidget} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Widget"}
            </Button>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="branding">
                    <Palette className="w-4 h-4 mr-2" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger value="style">
                    <Type className="w-4 h-4 mr-2" />
                    Style
                  </TabsTrigger>
                  <TabsTrigger value="fields">
                    <Settings className="w-4 h-4 mr-2" />
                    Fields
                  </TabsTrigger>
                  <TabsTrigger value="pricing">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="embed">
                    <Code className="w-4 h-4 mr-2" />
                    Embed
                  </TabsTrigger>
                </TabsList>

                {/* Branding Tab */}
                <TabsContent value="branding" className="mt-6 space-y-6">
                  <div>
                    <Label>Widget Name</Label>
                    <Input
                      value={config.name}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                      placeholder="My Moving Widget"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Internal name for your reference</p>
                  </div>

                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={config.companyName}
                      onChange={(e) => updateConfig({ companyName: e.target.value })}
                      placeholder="Your Moving Company"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={config.logo || ""}
                      onChange={(e) => updateConfig({ logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL to your company logo (PNG, JPG, or SVG)
                    </p>
                  </div>

                  <div>
                    <Label>Button Text</Label>
                    <Input
                      value={config.buttonText}
                      onChange={(e) => updateConfig({ buttonText: e.target.value })}
                      placeholder="Get Free Quote"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Success Message</Label>
                    <Textarea
                      value={config.successMessage}
                      onChange={(e) => updateConfig({ successMessage: e.target.value })}
                      placeholder="Thank you for your submission!"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style" className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={config.primaryColor}
                      onChange={(value) => updateConfig({ primaryColor: value })}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={config.secondaryColor}
                      onChange={(value) => updateConfig({ secondaryColor: value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Background Color"
                      value={config.backgroundColor}
                      onChange={(value) => updateConfig({ backgroundColor: value })}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={config.textColor}
                      onChange={(value) => updateConfig({ textColor: value })}
                    />
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={config.fontFamily}
                      onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                      className="mt-1"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </Select>
                  </div>
                </TabsContent>

                {/* Fields Tab */}
                <TabsContent value="fields" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Default Features</h3>
                    <div className="space-y-3">
                      <Checkbox
                        checked={config.enableInventory}
                        onChange={(e) =>
                          updateConfig({ enableInventory: e.target.checked })
                        }
                        label="Enable Inventory List"
                      />
                      <Checkbox
                        checked={config.enableSpecialItems}
                        onChange={(e) =>
                          updateConfig({ enableSpecialItems: e.target.checked })
                        }
                        label="Enable Special Items"
                      />
                      <Checkbox
                        checked={config.enableInsurance}
                        onChange={(e) =>
                          updateConfig({ enableInsurance: e.target.checked })
                        }
                        label="Enable Insurance Options"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Custom Fields</h3>
                      <div className="flex items-center gap-2">
                        <Select
                          value={newFieldType}
                          onChange={(e) =>
                            setNewFieldType(e.target.value as CustomField["type"])
                          }
                          className="w-32"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Dropdown</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="number">Number</option>
                        </Select>
                        <Button size="sm" onClick={handleAddCustomField}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Field
                        </Button>
                      </div>
                    </div>

                    {config.customFields.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No custom fields added yet. Add fields to collect additional
                        information from customers.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {config.customFields.map((field) => (
                          <Card key={field.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <Label>Label</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) =>
                                      updateCustomField(field.id, { label: e.target.value })
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Placeholder</Label>
                                  <Input
                                    value={field.placeholder || ""}
                                    onChange={(e) =>
                                      updateCustomField(field.id, {
                                        placeholder: e.target.value,
                                      })
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                {field.type === "select" && (
                                  <div>
                                    <Label>Options (one per line)</Label>
                                    <Textarea
                                      value={field.options?.join("\n") || ""}
                                      onChange={(e) =>
                                        updateCustomField(field.id, {
                                          options: e.target.value.split("\n").filter(Boolean),
                                        })
                                      }
                                      className="mt-1"
                                      rows={3}
                                    />
                                  </div>
                                )}
                                <Checkbox
                                  checked={field.required}
                                  onChange={(e) =>
                                    updateCustomField(field.id, { required: e.target.checked })
                                  }
                                  label="Required field"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomField(field.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Team rates</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Configure hourly rates and minimums used to calculate the estimate.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Full service
                        </h4>
                        <div className="space-y-3">
                          {MOVE_TEAM_OPTIONS.map((option) => {
                            const team = config.pricing.teams.move[option.id];
                            return (
                              <div
                                key={option.id}
                                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px_140px] gap-3 items-end"
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {option.label}
                                </div>
                                <div>
                                  <Label className="text-xs">Rate / hr</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={team.rate}
                                    onChange={(event) =>
                                      updateTeamPricing(
                                        "move",
                                        option.id,
                                        "rate",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Minimum hours</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={team.minimumHours}
                                    onChange={(event) =>
                                      updateTeamPricing(
                                        "move",
                                        option.id,
                                        "minimumHours",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Loading only
                        </h4>
                        <div className="space-y-3">
                          {LOADER_TEAM_OPTIONS.map((option) => {
                            const team = config.pricing.teams.loaders[option.id];
                            return (
                              <div
                                key={option.id}
                                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px_140px] gap-3 items-end"
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {option.label}
                                </div>
                                <div>
                                  <Label className="text-xs">Rate / hr</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={team.rate}
                                    onChange={(event) =>
                                      updateTeamPricing(
                                        "loaders",
                                        option.id,
                                        "rate",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Minimum hours</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={team.minimumHours}
                                    onChange={(event) =>
                                      updateTeamPricing(
                                        "loaders",
                                        option.id,
                                        "minimumHours",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Unloading only
                        </h4>
                        <div className="space-y-3">
                          {UNLOADING_TEAM_OPTIONS.map((option) => {
                            const team = config.pricing.teams.unloading[option.id];
                            return (
                              <div
                                key={option.id}
                                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px_140px] gap-3 items-end"
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {option.label}
                                </div>
                                <div>
                                  <Label className="text-xs">Rate / hr</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={team.rate}
                                    onChange={(event) =>
                                      updateTeamPricing(
                                        "unloading",
                                        option.id,
                                        "rate",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Minimum hours</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={team.minimumHours}
                                    onChange={(event) =>
                                      updateTeamPricing(
                                        "unloading",
                                        option.id,
                                        "minimumHours",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="font-medium">Estimated labor time</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Set labor time ranges (loading/unloading) - travel time is calculated separately based on distance.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Homes
                        </h4>
                        <div className="space-y-3">
                          {HOME_ESTIMATE_OPTIONS.map((option) => {
                            const range = config.pricing.estimateLabor.home[option.id];
                            return (
                              <div
                                key={option.id}
                                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_120px] gap-3 items-end"
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {option.label}
                                </div>
                                <div>
                                  <Label className="text-xs">Min labor (hrs)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={range.minLabor}
                                    onChange={(event) =>
                                      updateEstimateLabor(
                                        "home",
                                        option.id,
                                        "minLabor",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Max labor (hrs)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={range.maxLabor}
                                    onChange={(event) =>
                                      updateEstimateLabor(
                                        "home",
                                        option.id,
                                        "maxLabor",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Storage units
                        </h4>
                        <div className="space-y-3">
                          {STORAGE_ESTIMATE_OPTIONS.map((option) => {
                            const range = config.pricing.estimateLabor.storage[option.id];
                            return (
                              <div
                                key={option.id}
                                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_120px] gap-3 items-end"
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {option.label}
                                </div>
                                <div>
                                  <Label className="text-xs">Min labor (hrs)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={range.minLabor}
                                    onChange={(event) =>
                                      updateEstimateLabor(
                                        "storage",
                                        option.id,
                                        "minLabor",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Max labor (hrs)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={range.maxLabor}
                                    onChange={(event) =>
                                      updateEstimateLabor(
                                        "storage",
                                        option.id,
                                        "maxLabor",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Offices
                        </h4>
                        <div className="space-y-3">
                          {OFFICE_ESTIMATE_OPTIONS.map((option) => {
                            const range = config.pricing.estimateLabor.office[option.id];
                            return (
                              <div
                                key={option.id}
                                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_120px] gap-3 items-end"
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {option.label}
                                </div>
                                <div>
                                  <Label className="text-xs">Min labor (hrs)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={range.minLabor}
                                    onChange={(event) =>
                                      updateEstimateLabor(
                                        "office",
                                        option.id,
                                        "minLabor",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Max labor (hrs)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={range.maxLabor}
                                    onChange={(event) =>
                                      updateEstimateLabor(
                                        "office",
                                        option.id,
                                        "maxLabor",
                                        Number(event.target.value)
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="font-medium">Distance & Travel</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Configure how distance affects pricing.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <Label className="text-xs">Travel rate multiplier</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={config.pricing.travelRate}
                          onChange={(event) =>
                            updateTravelRate(Number(event.target.value))
                          }
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          % of hourly rate for travel time (e.g., 0.75 = 75%)
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Price per mile ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={config.pricing.pricePerMile}
                          onChange={(event) =>
                            updatePricePerMile(Number(event.target.value))
                          }
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Additional charge per mile traveled
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-3">
                    <h3 className="font-medium">Protection</h3>
                    <div className="max-w-xs">
                      <Label className="text-xs">Protection charge (flat)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={config.pricing.protectionCharge}
                        onChange={(event) =>
                          updateProtectionCharge(Number(event.target.value))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="font-medium">Accessibility Charges</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Extra charges based on location accessibility (applied per location).
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="max-w-xs">
                        <Label className="text-xs">No elevator charge ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="5"
                          value={config.pricing.accessibility.noElevatorCharge}
                          onChange={(event) =>
                            updateAccessibility("noElevatorCharge", null, Number(event.target.value))
                          }
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Charged when elevator is not available
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Flights of stairs</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2 max-w-md">
                          <div>
                            <Label className="text-xs">1-2 flights ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={config.pricing.accessibility.stairsCharge["1-2"]}
                              onChange={(event) =>
                                updateAccessibility("stairsCharge", "1-2", Number(event.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">3-4 flights ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={config.pricing.accessibility.stairsCharge["3-4"]}
                              onChange={(event) =>
                                updateAccessibility("stairsCharge", "3-4", Number(event.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">5+ flights ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={config.pricing.accessibility.stairsCharge["5+"]}
                              onChange={(event) =>
                                updateAccessibility("stairsCharge", "5+", Number(event.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Walking distance from parking</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2 max-w-md">
                          <div>
                            <Label className="text-xs">Short &lt;100ft ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={config.pricing.accessibility.walkingDistance.short}
                              onChange={(event) =>
                                updateAccessibility("walkingDistance", "short", Number(event.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Medium 100-300ft ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={config.pricing.accessibility.walkingDistance.medium}
                              onChange={(event) =>
                                updateAccessibility("walkingDistance", "medium", Number(event.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Long 300ft+ ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={config.pricing.accessibility.walkingDistance.long}
                              onChange={(event) =>
                                updateAccessibility("walkingDistance", "long", Number(event.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Embed Tab */}
                <TabsContent value="embed" className="mt-6 space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Embed Code</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Copy and paste this code into your website where you want the
                      widget to appear.
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateEmbedCode()}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={copyEmbedCode}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-2">Direct Link</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Share this link directly with customers to access the booking
                      form.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/widget/${config.id}`}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/widget/${config.id}`
                          );
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-2">Widget ID</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Use this ID to reference your widget in API calls.
                    </p>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {config.id}
                    </code>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                    <WidgetPreview config={config} isPreview={true} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
