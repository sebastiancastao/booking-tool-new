/**
 * Gravity Forms API v1 Integration Service
 *
 * Handles authentication and form submission to Gravity Forms API.
 * Uses HMAC-SHA1 signature-based authentication.
 */

import crypto from "crypto";

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
    entry_id?: number;
  };
  error?: string;
}

interface FormFieldData {
  "contact-name"?: string;
  "contact-email"?: string;
  "contact-phone"?: string;
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
  "contact-email": "input_2",
  "contact-phone": "input_3",
  "origin-location": "input_4",
  "target-location": "input_5",
  "date-selection": "input_6",
  "project-scope": "input_7",
  "service-selection": "input_8",
  "move-time": "input_9",
  estimate: "input_10",
  notes: "input_11",
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

  const fieldData = mapToGravityFormsFields(
    formData,
    customFieldMapping || DEFAULT_FIELD_MAPPING
  );

  console.log("[GravityForms] Submitting to form:", config.formId);
  console.log("[GravityForms] Field data:", fieldData);

  try {
    const response = await fetch(authenticatedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fieldData),
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

    return {
      success: true,
      data: responseData,
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

  const contactName = summary?.contactName
    ? String(summary.contactName)
    : form?.firstName && form?.lastName
    ? `${form.firstName} ${form.lastName}`
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

  const projectScope = [moveType, homeSize].filter(Boolean).join(" - ");

  return {
    "contact-name": contactName,
    "contact-email": form?.email ? String(form.email) : "",
    "contact-phone": form?.phone ? String(form.phone) : "",
    "origin-location": originLocation,
    "target-location": targetLocation,
    "date-selection": form?.moveDate ? String(form.moveDate) : "",
    "project-scope": projectScope,
    "service-selection": serviceType,
    "move-time": form?.moveTime ? String(form.moveTime) : "",
    estimate: summary?.estimateLabel ? String(summary.estimateLabel) : "",
    notes: form?.additionalNotes ? String(form.additionalNotes) : "",
  };
}
