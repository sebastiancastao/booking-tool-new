"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RefreshCw, Save, Trash2 } from "lucide-react";

const DEFAULT_MOVING_WORDS = [
  "MOVE",
  "MOVER",
  "TRUCK",
  "BOX",
  "PACK",
  "LIFT",
  "SHIFT",
  "HAUL",
  "LOAD",
  "CARRY",
  "RELO",
  "SWIFT",
  "EASY",
  "FAST",
];

type SeparatorOption = "-" | "_" | "";
type DiscountType = "percent" | "fixed";

type GeneratedPromo = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
};

type SavedPromo = {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  uses_count: number;
  created_at?: string;
};

function randomInt(maxExclusive: number) {
  if (maxExclusive <= 0) return 0;
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function randomDigits(length: number) {
  const safeLen = Math.max(1, Math.min(12, Math.floor(length)));
  let out = "";
  for (let i = 0; i < safeLen; i += 1) out += String(randomInt(10));
  return out;
}

function parseCustomWords(input: string) {
  return input
    .split(/[,\n]/g)
    .map((w) => w.trim())
    .filter(Boolean);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function formatDiscount(type: DiscountType, value: number) {
  if (type === "percent") return `${value}% OFF`;
  return `$${value} OFF`;
}

export function PromoCodeGenerator() {
  const [wordSource, setWordSource] = useState<"default" | "custom">("default");
  const [customWords, setCustomWords] = useState("MOVE, TRUCK, BOX, PACK");
  const [separator, setSeparator] = useState<SeparatorOption>("-");
  const [digits, setDigits] = useState(4);
  const [quantity, setQuantity] = useState(10);
  const [uppercase, setUppercase] = useState(true);
  const [animateWord, setAnimateWord] = useState(true);

  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState(10);

  const [generated, setGenerated] = useState<GeneratedPromo[]>([]);
  const [saved, setSaved] = useState<SavedPromo[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [savedStatus, setSavedStatus] = useState<{
    kind: "idle" | "loading" | "error";
    message?: string;
  }>({ kind: "idle" });
  const [copied, setCopied] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    kind: "idle" | "saving" | "success" | "error";
    message?: string;
  }>({ kind: "idle" });

  const words = useMemo(() => {
    const base = wordSource === "custom" ? parseCustomWords(customWords) : DEFAULT_MOVING_WORDS;
    const normalized = base
      .map((w) => (uppercase ? w.toUpperCase() : w))
      .map((w) => w.replace(/\s+/g, ""))
      .filter(Boolean);
    return normalized.length > 0 ? normalized : DEFAULT_MOVING_WORDS;
  }, [customWords, uppercase, wordSource]);

  const [wordTicker, setWordTicker] = useState(() => words[0] ?? "MOVE");
  const tickerIndexRef = useRef(0);

  useEffect(() => {
    setWordTicker(words[0] ?? "MOVE");
    tickerIndexRef.current = 0;
  }, [words]);

  useEffect(() => {
    if (!animateWord) return;
    const id = window.setInterval(() => {
      tickerIndexRef.current = (tickerIndexRef.current + 1) % Math.max(1, words.length);
      setWordTicker(words[tickerIndexRef.current] ?? "MOVE");
    }, 250);
    return () => window.clearInterval(id);
  }, [animateWord, words]);

  const buildOne = () => {
    const word = words[randomInt(words.length)] ?? "MOVE";
    return `${word}${separator}${randomDigits(digits)}`;
  };

  const generate = () => {
    const safeQty = Math.max(1, Math.min(200, Math.floor(quantity)));
    const unique = new Set<string>();
    let attempts = 0;

    while (unique.size < safeQty && attempts < safeQty * 20) {
      unique.add(buildOne());
      attempts += 1;
    }
    const safeDiscountValue =
      discountType === "percent"
        ? clampNumber(Math.floor(discountValue), 1, 100)
        : clampNumber(Math.floor(discountValue), 1, 100000);

    setGenerated(
      Array.from(unique).map((code) => ({
        code,
        discountType,
        discountValue: safeDiscountValue,
      }))
    );
  };

  const clear = () => setGenerated([]);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // If clipboard permissions are blocked, do nothing (user can still select/copy).
    }
  };

  const copyAll = async () => {
    if (generated.length === 0) return;
    await copyText(generated.map((g) => g.code).join("\n"));
  };

  const copyCsv = async () => {
    if (generated.length === 0) return;
    const header = "code,discount_type,discount_value";
    const lines = generated.map((g) => `${g.code},${g.discountType},${g.discountValue}`);
    await copyText([header, ...lines].join("\n"));
  };

  const refreshSaved = async () => {
    try {
      setSavedStatus({ kind: "loading" });
      const response = await fetch("/api/promo-codes?mode=list&limit=200", { cache: "no-store" });
      const data = (await response.json()) as
        | { promos: SavedPromo[]; count?: number | null }
        | { error: string };

      if (!response.ok) {
        const message = "error" in data && data.error ? data.error : "Failed to load promo codes";
        throw new Error(message);
      }

      if ("promos" in data) {
        setSaved(Array.isArray(data.promos) ? data.promos : []);
        setSavedCount(typeof data.count === "number" ? data.count : null);
      } else {
        setSaved([]);
        setSavedCount(null);
      }

      setSavedStatus({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load promo codes";
      setSavedStatus({ kind: "error", message });
    }
  };

  const saveToDatabase = async () => {
    if (generated.length === 0) return;
    try {
      setSaveStatus({ kind: "saving", message: "Saving..." });
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promos: generated.map((g) => ({
            code: g.code,
            discountType: g.discountType,
            discountValue: g.discountValue,
          })),
        }),
      });

      const data = (await response.json()) as { saved?: number; error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "Failed to save promo codes");

      setSaveStatus({
        kind: "success",
        message: `Saved ${data.saved ?? generated.length} promo code${(data.saved ?? generated.length) === 1 ? "" : "s"}.`,
      });
      void refreshSaved();
      window.setTimeout(() => setSaveStatus({ kind: "idle" }), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save promo codes";
      setSaveStatus({ kind: "error", message });
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshSaved();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Promo Code Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Words</label>
              <Select
                value={wordSource}
                onChange={(e) => setWordSource(e.target.value as "default" | "custom")}
              >
                <option value="default">Moving-related (default)</option>
                <option value="custom">Custom list</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Separator</label>
              <Select
                value={separator}
                onChange={(e) => setSeparator(e.target.value as SeparatorOption)}
              >
                <option value="-">Dash (-)</option>
                <option value="_">Underscore (_)</option>
                <option value="">None</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Digits</label>
              <Input
                inputMode="numeric"
                value={digits}
                onChange={(e) => setDigits(Number(e.target.value))}
                min={1}
                max={12}
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Quantity</label>
              <Input
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                max={200}
                type="number"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Discount</label>
              <Select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                {discountType === "percent" ? "Percent off" : "Amount off"}
              </label>
              <Input
                inputMode="numeric"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                min={1}
                max={discountType === "percent" ? 100 : 100000}
                type="number"
              />
            </div>
          </div>

          {wordSource === "custom" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Custom words</label>
              <Input
                value={customWords}
                onChange={(e) => setCustomWords(e.target.value)}
                placeholder="MOVE, TRUCK, BOX, PACK"
              />
              <p className="text-xs text-gray-500">Separate with commas or new lines.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <Checkbox
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              label="Uppercase"
            />
            <Checkbox
              checked={animateWord}
              onChange={(e) => setAnimateWord(e.target.checked)}
              label="Animate word"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={generate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button variant="outline" onClick={copyAll} disabled={generated.length === 0}>
              <Copy className="w-4 h-4 mr-2" />
              Copy codes
            </Button>
            <Button variant="outline" onClick={copyCsv} disabled={generated.length === 0}>
              <Copy className="w-4 h-4 mr-2" />
              Copy CSV
            </Button>
            <Button
              variant="outline"
              onClick={saveToDatabase}
              disabled={generated.length === 0 || saveStatus.kind === "saving"}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveStatus.kind === "saving" ? "Saving..." : "Save to DB"}
            </Button>
            <Button variant="ghost" onClick={clear} disabled={generated.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {saveStatus.kind !== "idle" && saveStatus.message && (
            <div
              className={[
                "rounded-lg border px-3 py-2 text-sm",
                saveStatus.kind === "success" && "border-green-200 bg-green-50 text-green-800",
                saveStatus.kind === "error" && "border-red-200 bg-red-50 text-red-800",
                saveStatus.kind === "saving" && "border-gray-200 bg-gray-50 text-gray-800",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {saveStatus.message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Moving word</div>
                <div className="relative overflow-hidden rounded-md bg-gray-50 px-3 py-2">
                  <span
                    className={animateWord ? "inline-block animate-[promoWord_1.6s_linear_infinite]" : "inline-block"}
                    style={{ willChange: "transform" }}
                  >
                    <span className="font-mono font-semibold text-gray-900">{wordTicker}</span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Example code</div>
                <div className="font-mono font-semibold text-gray-900">
                  {`${wordTicker}${separator}${"0".repeat(Math.max(1, Math.min(12, digits)))}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDiscount(
                    discountType,
                    discountType === "percent"
                      ? clampNumber(Math.floor(discountValue), 1, 100)
                      : clampNumber(Math.floor(discountValue), 1, 100000)
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {generated.length === 0 ? (
              <div className="text-sm text-gray-500">No promo codes yet.</div>
            ) : (
              <div className="grid gap-2">
                {generated.map((promo) => (
                  <button
                    key={promo.code}
                    type="button"
                    onClick={() => copyText(promo.code)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                    title="Click to copy"
                  >
                    <span className="min-w-0">
                      <span className="font-mono text-sm text-gray-900">{promo.code}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatDiscount(promo.discountType, promo.discountValue)}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {copied === promo.code ? "Copied" : "Copy"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              Saved Promo Codes{typeof savedCount === "number" ? ` (${savedCount})` : ""}
            </CardTitle>
            <Button variant="outline" onClick={refreshSaved} disabled={savedStatus.kind === "loading"}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {savedStatus.kind === "loading" ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            These are the promo codes currently stored in your Supabase `promo_codes` table.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedStatus.kind === "error" && savedStatus.message && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {savedStatus.message}
            </div>
          )}

          {savedStatus.kind !== "error" && saved.length === 0 ? (
            <div className="text-sm text-gray-500">No saved promo codes found.</div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {saved.map((promo) => (
                <button
                  key={promo.id ?? promo.code}
                  type="button"
                  onClick={() => copyText(promo.code)}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                  title="Click to copy"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-sm text-gray-900">{promo.code}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {formatDiscount(promo.discount_type, promo.discount_value)}
                      {!promo.is_active ? " - INACTIVE" : ""}
                      {promo.max_uses !== null ? ` - ${promo.uses_count}/${promo.max_uses}` : ""}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {copied === promo.code ? "Copied" : "Copy"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
