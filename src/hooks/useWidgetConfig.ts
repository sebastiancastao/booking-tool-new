"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { WidgetConfig, CustomField } from "@/types";
import { DEFAULT_PRICING_CONFIG } from "@/types";

const defaultWidgetConfig: Omit<WidgetConfig, "id" | "createdAt" | "updatedAt" | "userId"> = {
  name: "My Moving Widget",
  companyName: "The Furniture Taxi",
  logo: "",
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  fontFamily: "Inter",
  buttonText: "Get Free Quote",
  successMessage: "Thank you! We will contact you within 24 hours to discuss your move.",
  customFields: [],
  enableInsurance: true,
  enableSpecialItems: true,
  enableInventory: true,
  pricing: DEFAULT_PRICING_CONFIG,
};

export function useWidgetConfig(initialConfig?: Partial<WidgetConfig>) {
  const [config, setConfig] = useState<WidgetConfig>({
    ...defaultWidgetConfig,
    ...initialConfig,
    id: initialConfig?.id || uuidv4(),
    createdAt: initialConfig?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: initialConfig?.userId || "",
  });

  const updateConfig = useCallback((updates: Partial<WidgetConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addCustomField = useCallback((field: Omit<CustomField, "id">) => {
    const newField: CustomField = {
      ...field,
      id: uuidv4(),
    };
    setConfig((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateCustomField = useCallback((fieldId: string, updates: Partial<CustomField>) => {
    setConfig((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const removeCustomField = useCallback((fieldId: string) => {
    setConfig((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((field) => field.id !== fieldId),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({
      ...defaultWidgetConfig,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "",
    });
  }, []);

  return {
    config,
    updateConfig,
    addCustomField,
    updateCustomField,
    removeCustomField,
    resetConfig,
  };
}
