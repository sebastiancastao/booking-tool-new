/**
 * Gravity Forms API v1 Integration Service
 *
 * Handles authentication and form submission to Gravity Forms API.
 * Uses HMAC-SHA1 signature-based authentication.
 */

import crypto from "crypto";

const GF_INTEGRATION_BUILD = "booking.tool.new-2026-02-18-01";

export interface GravityFormsConfig {
  baseUrl: string;
  publicKey: string;
  privateKey: string;
  formId: string;
}

export interface GravityFormsSubmissionResult {
  success: boolean;
  data?: {
    is_valid?: boolean;
    page_number?: number;
    source_page_number?: number;
    confirmation_message?: string;
    confirmation_redirect?: string | null;
    entry_id?: number | string;
    validation_messages?: Record<string, string>;
    [key: string]: unknown;
  };
  error?: string;
}

interface GravityFormsV1Envelope {
  status?: number;
  response?: unknown;
}

interface GravityFormsField {
  id?: number | string;
  label?: string;
  failed_validation?: boolean;
  validation_message?: string;
}

interface FormFieldData {
  "contact-name"?: string;
  "contact-first-name"?: string;
  "contact-last-name"?: string;
  "contact-email"?: string;
  "contact-phone"?: string;
  "origin-zip"?: string;
  "target-zip"?: string;
  "move-size"?: string;
  "origin-location"?: string;
  "target-location"?: string;
  "date-selection"?: string;
  "project-scope"?: string;
  "service-selection"?: string;
  "move-time"?: string;
  estimate?: string;
  notes?: string;
}

/**
 * Field mapping from widget form fields to Gravity Forms field IDs.
 * Update these IDs to match your Gravity Forms setup:
 * 1. Log into WordPress admin
 * 2. Go to Forms → Your Form → Edit
 * 3. Click on each field to see its Field ID
 */
const DEFAULT_FIELD_MAPPING: Record<string, string> = {
  "contact-name": "input_1",
  "contact-first-name": "input_1.3",
  "contact-last-name": "input_1.6",
  "contact-email": "input_3",
  "contact-phone": "input_4",
  "date-selection": "input_5",
  "move-size": "input_6",
  "origin-zip": "input_8",
  "target-zip": "input_9",
};

function getConfig(): GravityFormsConfig | null {
  const baseUrl = process.env.GRAVITY_FORMS_BASE_URL;
  const publicKey = process.env.GRAVITY_FORMS_PUBLIC_KEY;
  const privateKey = process.env.GRAVITY_FORMS_PRIVATE_KEY;
  const formId = process.env.GRAVITY_FORMS_FORM_ID || "3";

  if (!baseUrl || !publicKey || !privateKey) {
    return null;
  }

  return { baseUrl, publicKey, privateKey, formId };
}

/**
 * Generate HMAC-SHA1 signature for Gravity Forms API authentication
 */
function generateSignature(
  publicKey: string,
  privateKey: string,
  method: string,
  url: string,
  expires: number
): string {
  const stringToSign = `${publicKey}:${method}:${url}:${expires}`;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(stringToSign)
    .digest("base64");
  return encodeURIComponent(signature);
}

/**
 * Build authenticated URL for Gravity Forms API
 */
function buildAuthenticatedUrl(
  config: GravityFormsConfig,
  endpoint: string,
  method: string
): string {
  const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const url = `${config.baseUrl}${endpoint}`;

  const signature = generateSignature(
    config.publicKey,
    config.privateKey,
    method,
    url,
    expires
  );

  return `${url}?api_key=${config.publicKey}&signature=${signature}&expires=${expires}`;
}

/**
 * Map widget form data to Gravity Forms field format
 */
function mapToGravityFormsFields(
  formData: FormFieldData,
  fieldMapping: Record<string, string> = DEFAULT_FIELD_MAPPING
): Record<string, string> {
  const mappedData: Record<string, string> = {};

  for (const [key, value] of Object.entries(formData)) {
    const fieldId = fieldMapping[key];
    if (fieldId && value) {
      mappedData[fieldId] = String(value);
    }
  }

  return mappedData;
}

function extractV1ErrorMessage(response: unknown): string {
  if (typeof response === "string" && response.trim().length > 0) {
    return response;
  }

  if (typeof response === "object" && response !== null) {
    const maybeObject = response as { message?: unknown; code?: unknown };
    if (typeof maybeObject.message === "string" && maybeObject.message.trim().length > 0) {
      return maybeObject.message;
    }
    if (typeof maybeObject.code === "string" && maybeObject.code.trim().length > 0) {
      return maybeObject.code;
    }
  }

  return "Unknown Gravity Forms API error";
}

function buildValidationErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;

  const normalized = payload as {
    validation_messages?: unknown;
    form?: { fields?: unknown };
  };

  const validationMessages =
    typeof normalized.validation_messages === "object" &&
    normalized.validation_messages !== null
      ? Object.values(normalized.validation_messages as Record<string, unknown>).filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0
        )
      : [];

  if (validationMessages.length > 0) {
    return validationMessages[0];
  }

  const failedFields = Array.isArray(normalized.form?.fields)
    ? (normalized.form.fields as GravityFormsField[]).filter(
        (field) => Boolean(field?.failed_validation)
      )
    : [];

  if (failedFields.length === 0) {
    return null;
  }

  const messages = failedFields.map((field) => {
    const label =
      typeof field.label === "string" && field.label.trim().length > 0
        ? field.label.trim()
        : `Field ${String(field.id ?? "").trim()}`.trim();
    const detail =
      typeof field.validation_message === "string" &&
      field.validation_message.trim().length > 0
        ? field.validation_message.trim()
        : "This field is required.";
    return `${label}: ${detail}`;
  });

  return messages.join(" | ");
}

function extractZipCode(value: string): string {
  const match = value.match(/\b\d{5}(?:-\d{4})?\b/);
  return match ? match[0] : "";
}

function formatDateForGravityForms(value: string): string {
  const trimmed = value.trim();
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${month}/${day}/${year}`;
  }
  return trimmed;
}

function formatPhoneForGravityForms(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;

  const normalized =
    digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits.length >= 10
      ? digits.slice(0, 10)
      : digits;

  if (normalized.length === 10) {
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }

  return normalized;
}

function mapMoveSizeToGravityFormsChoice(
  moveType: string,
  homeSize: string,
  storageUnitSize: string
): string {
  if (moveType === "office") {
    return "Office/Commercial";
  }

  if (moveType === "storage") {
    const storageMap: Record<string, string> = {
      "25": "5 x 10 Storage Unit",
      "50": "5 x 10 Storage Unit",
      "75": "5 x 15 Storage Unit",
      "100": "10 x 10 Storage Unit",
      "200": "10 x 20 Storage Unit",
      "300": "10 x 20 Storage Unit",
    };
    return storageMap[storageUnitSize] || "";
  }

  if (moveType === "home") {
    const homeMap: Record<string, string> = {
      studio: "Studio Apartment",
      "1bed": "1 Bedroom Apartment",
      "2bed": "2 Bedroom Apartment",
      "3bed": "3 Bedroom Apartment",
      "4bed": "4 Bedroom House",
      "5bed": "5 Bedroom House",
    };
    return homeMap[homeSize] || "";
  }

  return "";
}

/**
 * Submit form data to Gravity Forms API
 */
export async function submitToGravityForms(
  formData: FormFieldData,
  customFieldMapping?: Record<string, string>
): Promise<GravityFormsSubmissionResult> {
  const config = getConfig();

  if (!config) {
    console.log(
      "[GravityForms] Skipping submission - API not configured (missing environment variables)"
    );
    return {
      success: false,
      error: "Gravity Forms API not configured",
    };
  }

  const endpoint = `/forms/${config.formId}/submissions`;
  const method = "POST";
  const authenticatedUrl = buildAuthenticatedUrl(config, endpoint, method);

  const activeFieldMapping = customFieldMapping || DEFAULT_FIELD_MAPPING;
  const fieldData = mapToGravityFormsFields(formData, activeFieldMapping);

  console.log("[GravityForms] Integration build:", GF_INTEGRATION_BUILD);
  console.log("[GravityForms] Submitting to form:", config.formId);
  console.log("[GravityForms] Active field mapping:", activeFieldMapping);
  console.log("[GravityForms] Field data:", fieldData);

  try {
    const response = await fetch(authenticatedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input_values: fieldData }),
    });

    const responseText = await response.text();
    console.log("[GravityForms] Response status:", response.status);
    console.log("[GravityForms] Response body:", responseText);

    if (!response.ok) {
      return {
        success: false,
        error: `Gravity Forms API request failed: ${response.status} ${response.statusText}`,
      };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    let normalizedData: unknown = responseData;
    if (
      typeof responseData === "object" &&
      responseData !== null &&
      ("status" in responseData || "response" in responseData)
    ) {
      const v1Envelope = responseData as GravityFormsV1Envelope;
      if (
        typeof v1Envelope.status === "number" &&
        v1Envelope.status > 202
      ) {
        const detailedMessage = buildValidationErrorMessage(v1Envelope.response);
        return {
          success: false,
          error: detailedMessage || extractV1ErrorMessage(v1Envelope.response),
          data:
            typeof v1Envelope.response === "object" &&
            v1Envelope.response !== null
              ? (v1Envelope.response as GravityFormsSubmissionResult["data"])
              : undefined,
        };
      }

      if (v1Envelope.response !== undefined) {
        normalizedData = v1Envelope.response;
      }
    }

    if (
      typeof (normalizedData as { is_valid?: unknown })?.is_valid === "boolean" &&
      (normalizedData as { is_valid?: boolean }).is_valid === false
    ) {
      const detailedMessage = buildValidationErrorMessage(normalizedData);

      return {
        success: false,
        data:
          (typeof normalizedData === "object" && normalizedData !== null
            ? (normalizedData as GravityFormsSubmissionResult["data"])
            : undefined) || {},
        error:
          detailedMessage ||
          "Gravity Forms rejected the submission as invalid.",
      };
    }

    return {
      success: true,
      data:
        (typeof normalizedData === "object" && normalizedData !== null
          ? (normalizedData as GravityFormsSubmissionResult["data"])
          : { raw: normalizedData }),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[GravityForms] Submission failed:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Test connection to Gravity Forms API
 */
export async function testGravityFormsConnection(): Promise<boolean> {
  const config = getConfig();

  if (!config) {
    console.log("[GravityForms] Test failed - API not configured");
    return false;
  }

  const endpoint = `/forms/${config.formId}`;
  const method = "GET";
  const authenticatedUrl = buildAuthenticatedUrl(config, endpoint, method);

  try {
    const response = await fetch(authenticatedUrl, { method: "GET" });
    const isConnected = response.ok;
    console.log("[GravityForms] Connection test:", isConnected ? "SUCCESS" : "FAILED");
    return isConnected;
  } catch (error) {
    console.error("[GravityForms] Connection test error:", error);
    return false;
  }
}

/**
 * Transform booking payload to Gravity Forms field data format
 */
export function transformPayloadToGravityFormsData(
  payload: Record<string, unknown>
): FormFieldData {
  const summary = payload.summary as Record<string, unknown> | undefined;
  const form = payload.form as Record<string, unknown> | undefined;
  const selections = payload.selections as Record<string, unknown> | undefined;

  const firstName = form?.firstName ? String(form.firstName).trim() : "";
  const lastName = form?.lastName ? String(form.lastName).trim() : "";
  const contactName = summary?.contactName
    ? String(summary.contactName)
    : firstName && lastName
    ? `${firstName} ${lastName}`
    : "";

  const originLocation = form?.pickupStreet
    ? [
        form.pickupStreet,
        form.pickupUnit,
        form.pickupCity,
        form.pickupState,
        form.pickupZip,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const targetLocation = form?.dropoffStreet
    ? [
        form.dropoffStreet,
        form.dropoffUnit,
        form.dropoffCity,
        form.dropoffState,
        form.dropoffZip,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const serviceType = selections?.serviceType
    ? String(selections.serviceType)
    : "";
  const moveType = selections?.moveType ? String(selections.moveType) : "";
  const homeSize = selections?.homeSize ? String(selections.homeSize) : "";
  const storageUnitSize = selections?.storageUnitSize
    ? String(selections.storageUnitSize)
    : "";

  const projectScope = [moveType, homeSize].filter(Boolean).join(" - ");
  const moveSize = mapMoveSizeToGravityFormsChoice(moveType, homeSize, storageUnitSize);
  const moveDate = form?.moveDate ? formatDateForGravityForms(String(form.moveDate)) : "";
  const formattedPhone = form?.phone ? formatPhoneForGravityForms(String(form.phone)) : "";
  const pickupZip = form?.pickupZip ? String(form.pickupZip).trim() : "";
  const dropoffZip = form?.dropoffZip ? String(form.dropoffZip).trim() : "";
  const derivedPickupZip =
    pickupZip || extractZipCode(originLocation) || originLocation.trim();
  const derivedDropoffZip =
    dropoffZip || extractZipCode(targetLocation) || targetLocation.trim();

  return {
    "contact-name": contactName,
    "contact-first-name": firstName,
    "contact-last-name": lastName,
    "contact-email": form?.email ? String(form.email) : "",
    "contact-phone": formattedPhone,
    "origin-zip": derivedPickupZip,
    "target-zip": derivedDropoffZip,
    "move-size": moveSize,
    "origin-location": originLocation,
    "target-location": targetLocation,
    "date-selection": moveDate,
    "project-scope": projectScope,
    "service-selection": serviceType,
    "move-time": form?.moveTime ? String(form.moveTime) : "",
    estimate: summary?.estimateLabel ? String(summary.estimateLabel) : "",
    notes: form?.additionalNotes ? String(form.additionalNotes) : "",
  };
}
