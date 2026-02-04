"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  WidgetConfig,
  PROPERTY_TYPE_LABELS,
  MOVE_SIZE_LABELS,
  INSURANCE_OPTIONS,
  DEFAULT_INVENTORY_ITEMS,
  COMMON_SPECIAL_ITEMS,
  InventoryItem,
  SpecialItem,
  PricingConfig,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  User,
  Home,
  Package,
  Shield,
  Clock,
  Search,
  ChevronDown,
  MoreVertical,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Truck,
  Plus,
  Minus,
  X,
  Users,
  Building2,
  Warehouse,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const bookingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  moveDate: z.string().min(1, "Move date is required"),
  moveTime: z.string().optional(),
  flexibleDates: z.boolean().default(false),
  pickupStreet: z.string().min(1, "Pickup address is required"),
  pickupUnit: z.string().optional(),
  pickupCity: z.string().min(1, "City is required"),
  pickupState: z.string().min(1, "State is required"),
  pickupZip: z.string().min(5, "ZIP code is required"),
  pickupPropertyType: z.string().optional(),
  pickupFloor: z.string().optional(),
  pickupElevator: z.boolean().default(false),
  dropoffStreet: z.string().min(1, "Dropoff address is required"),
  dropoffUnit: z.string().optional(),
  dropoffCity: z.string().min(1, "City is required"),
  dropoffState: z.string().min(1, "State is required"),
  dropoffZip: z.string().min(5, "ZIP code is required"),
  dropoffPropertyType: z.string().optional(),
  dropoffFloor: z.string().optional(),
  dropoffElevator: z.boolean().default(false),
  estimatedSize: z.string().optional(),
  packingService: z.boolean().default(false),
  unpackingService: z.boolean().default(false),
  storageNeeded: z.boolean().default(false),
  storageDuration: z.string().optional(),
  insuranceOption: z.string().optional(),
  declaredValue: z.string().optional(),
  promoCode: z.string().trim().max(50).optional(),
  additionalNotes: z.string().optional(),
});

type BookingFormData = z.input<typeof bookingSchema>;

interface BookingFormProps {
  config: WidgetConfig;
  isPreview?: boolean;
}

type ServiceType = "full_service" | "labor_only" | null;
type MoveType = "home" | "storage" | "office" | null;
type HomeSize = "studio" | "1bed" | "2bed" | "3bed" | "4bed" | "5bed" | null;
type LaborHelpType = "loading_unloading" | "loading_only" | "unloading_only" | null;
type TeamOptionId = "2-1" | "3-1" | "3-2" | "4-2" | "loaders-2" | "loaders-3" | null;
type TeamOptionKey = Exclude<TeamOptionId, null>;
type StorageUnitSize = "25" | "50" | "75" | "100" | "200" | "300" | null;
type OfficeHeadcount = "1-4" | "5-9" | "10-19" | "20-49" | "50-99" | "over-100" | null;
type OriginSuggestion = { description: string; placeId: string };
type CalendarDay = { date: Date; inCurrentMonth: boolean };
type TeamOptionBase = {
  readonly id: TeamOptionKey;
  readonly title: string;
  readonly recommended: boolean;
};
type TeamOptionDisplay = TeamOptionBase & {
  rate: number;
  minimumHours: number;
  rateShort: string;
  detail: string;
  minimumShort: string;
  minimumLong: string;
};
type PromoDiscount = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
};

const HOME_SIZES = [
  { id: "studio", label: "Studio" },
  { id: "1bed", label: "1 Bedroom" },
  { id: "2bed", label: "2 Bedroom" },
  { id: "3bed", label: "3 Bedroom" },
  { id: "4bed", label: "4 Bedroom" },
  { id: "5bed", label: "5+ Bedroom" },
];

const STORAGE_UNIT_SIZES = [
  { id: "25", label: "25 sq ft", detail: "5 x 5 (compare to closet)" },
  { id: "50", label: "50 sq ft", detail: "5 x 10 (compare to small room)" },
  { id: "75", label: "75 sq ft", detail: "5 x 15" },
  { id: "100", label: "100 sq ft", detail: "10 x 10 (1 - 2 rooms)" },
  { id: "200", label: "200 sq ft", detail: "10 x 20 (3+ rooms)" },
  { id: "300", label: "300 sq ft", detail: "10 x 30" },
];

const OFFICE_HEADCOUNT_OPTIONS = [
  { id: "1-4", label: "1 - 4" },
  { id: "5-9", label: "5 - 9" },
  { id: "10-19", label: "10 - 19" },
  { id: "20-49", label: "20 - 49" },
  { id: "50-99", label: "50 - 99" },
  { id: "over-100", label: "Over 100" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TIME_OPTIONS = [
  { id: "morning", label: "8AM-12PM", description: "Morning", value: "08:00" },
  { id: "afternoon", label: "12PM-4PM", description: "Afternoon", value: "12:00" },
];

const LABOR_HELP_OPTIONS = [
  {
    id: "loading_unloading",
    title: "Loading & unloading",
    description: "Our crews help you load at a starting location and unload at a destination location",
  },
  {
    id: "loading_only",
    title: "Loading only",
    description: "We help you load your items",
  },
  {
    id: "unloading_only",
    title: "Unloading only",
    description: "We help you unload previously loaded items",
  },
];

const TEAM_OPTIONS_MOVE = [
  { id: "2-1", title: "2 movers, 1 truck", recommended: true },
  { id: "3-1", title: "3 movers, 1 truck", recommended: false },
  { id: "3-2", title: "3 movers, 2 trucks", recommended: false },
  { id: "4-2", title: "4 movers, 2 trucks", recommended: false },
] as const;

const TEAM_OPTIONS_LOADERS = [
  { id: "loaders-2", title: "2 loaders", recommended: true },
  { id: "loaders-3", title: "3 loaders", recommended: false },
] as const;

const TEAM_OPTIONS_UNLOADING = [
  { id: "2-1", title: "2 movers, 1 truck", recommended: false },
  { id: "3-1", title: "3 movers, 1 truck", recommended: false },
] as const;

const UNLOADING_HOURS_OPTIONS = ["2", "3", "4"];

const ORIGIN_ELEVATOR_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];
const ORIGIN_STAIRS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "1-2", label: "1-2" },
  { value: "3-4", label: "3-4" },
  { value: "5+", label: "5+" },
];
const ORIGIN_WALK_OPTIONS = [
  { value: "short", label: "Short walk (less than 100ft)" },
  { value: "medium", label: "Medium walk (100-300ft)" },
  { value: "long", label: "Long walk (300ft+)" },
];
const BOOKING_REFERENCE = "RDQJBRM";

const STEPS = [
  { id: "contact", label: "Contact Info", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "details", label: "Move Details", icon: Package },
  { id: "services", label: "Services", icon: Truck },
];

export function BookingForm({ config, isPreview = false }: BookingFormProps) {
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [moveType, setMoveType] = useState<MoveType>(null);
  const [homeSize, setHomeSize] = useState<HomeSize>(null);
  const [storageUnitSize, setStorageUnitSize] = useState<StorageUnitSize>(null);
  const [officeHeadcount, setOfficeHeadcount] = useState<OfficeHeadcount>(null);
  const [laborHelpType, setLaborHelpType] = useState<LaborHelpType>(null);
  const [teamOption, setTeamOption] = useState<TeamOptionId>(null);
  const [showUnloadingHoursPage, setShowUnloadingHoursPage] = useState(false);
  const [unloadingHours, setUnloadingHours] = useState("2");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [specialItems, setSpecialItems] = useState<SpecialItem[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});
  const [showMoveDatePage, setShowMoveDatePage] = useState(false);
  const [showMoveTimePage, setShowMoveTimePage] = useState(false);
  const [showOriginPage, setShowOriginPage] = useState(false);
  const [showOriginDetails, setShowOriginDetails] = useState(false);
  const [showDestinationPage, setShowDestinationPage] = useState(false);
  const [showDestinationDetails, setShowDestinationDetails] = useState(false);
  const [showTeamPage, setShowTeamPage] = useState(false);
  const [showServicesPage, setShowServicesPage] = useState(false);
  const [showStoragePage, setShowStoragePage] = useState(false);
  const [showProtectionPage, setShowProtectionPage] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showPromoCodePage, setShowPromoCodePage] = useState(false);
  const [showNextStepsPage, setShowNextStepsPage] = useState(false);
  const [showContactPage, setShowContactPage] = useState(false);
  const confirmationSentRef = useRef(false);
  const lastValidatedPromoCodeRef = useRef<string | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<OriginSuggestion[]>([]);
  const [originSuggestionsLoading, setOriginSuggestionsLoading] = useState(false);
  const [originUnit, setOriginUnit] = useState("");
  const [originElevator, setOriginElevator] = useState("no");
  const [originStairs, setOriginStairs] = useState("none");
  const [originWalk, setOriginWalk] = useState("short");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState<OriginSuggestion[]>([]);
  const [destinationSuggestionsLoading, setDestinationSuggestionsLoading] = useState(false);
  const [destinationUnit, setDestinationUnit] = useState("");
  const [destinationElevator, setDestinationElevator] = useState("no");
  const [destinationStairs, setDestinationStairs] = useState("none");
  const [destinationWalk, setDestinationWalk] = useState("short");
  const [storagePageWasEnabled, setStoragePageWasEnabled] = useState(false);
  const [storageMoveOutDate, setStorageMoveOutDate] = useState("");
  const [storagePlan, setStoragePlan] = useState("1_week");
  const [protectionDeductible, setProtectionDeductible] = useState("250");
  const [protectionDeclaredValue, setProtectionDeclaredValue] = useState("0");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [distanceInfo, setDistanceInfo] = useState<{
    miles: number;
    travelHours: number;
    text: string;
  } | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [promoValidation, setPromoValidation] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    promo?: PromoDiscount;
    message?: string;
  }>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
    getValues,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      flexibleDates: false,
      pickupElevator: false,
      dropoffElevator: false,
      packingService: false,
      unpackingService: false,
      storageNeeded: false,
    },
  });

  const storageNeeded = watch("storageNeeded");
  const moveDateValue = watch("moveDate");
  const moveTimeValue = watch("moveTime");
  const insuranceOptionValue = watch("insuranceOption");
  const storageDurationValue = watch("storageDuration");
  const promoCodeValue = watch("promoCode");
  const firstNameValue = watch("firstName");
  const lastNameValue = watch("lastName");
  const emailValue = watch("email");
  const phoneValue = watch("phone");
  const declaredValueValue = watch("declaredValue");
  const pickupStreet = watch("pickupStreet");
  const pickupCity = watch("pickupCity");
  const pickupState = watch("pickupState");
  const pickupZip = watch("pickupZip");
  const dropoffStreet = watch("dropoffStreet");
  const dropoffCity = watch("dropoffCity");
  const dropoffState = watch("dropoffState");
  const dropoffZip = watch("dropoffZip");

  useEffect(() => {
    const normalized = String(promoCodeValue || "").trim().toUpperCase();
    if (normalized && lastValidatedPromoCodeRef.current === normalized) return;
    setPromoValidation({ status: "idle" });
  }, [promoCodeValue]);

  useEffect(() => {
    if (!showOriginPage || showOriginDetails) {
      setOriginSuggestions([]);
      setOriginSuggestionsLoading(false);
      return;
    }
    const query = originQuery.trim();
    if (query.length < 3) {
      setOriginSuggestions([]);
      setOriginSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setOriginSuggestionsLoading(true);
        const response = await fetch(
          `/api/places?input=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }
        const data = await response.json();
        if (Array.isArray(data.predictions)) {
          setOriginSuggestions(data.predictions);
        } else {
          setOriginSuggestions([]);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setOriginSuggestions([]);
      } finally {
        setOriginSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [originQuery, showOriginDetails, showOriginPage]);

  useEffect(() => {
    if (!showDestinationPage || showDestinationDetails) {
      setDestinationSuggestions([]);
      setDestinationSuggestionsLoading(false);
      return;
    }
    const query = destinationQuery.trim();
    if (query.length < 3) {
      setDestinationSuggestions([]);
      setDestinationSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setDestinationSuggestionsLoading(true);
        const response = await fetch(
          `/api/places?input=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }
        const data = await response.json();
        if (Array.isArray(data.predictions)) {
          setDestinationSuggestions(data.predictions);
        } else {
          setDestinationSuggestions([]);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setDestinationSuggestions([]);
      } finally {
        setDestinationSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [destinationQuery, showDestinationDetails, showDestinationPage]);

  // Fetch distance when both origin and destination are set
  useEffect(() => {
    const origin = originQuery.trim();
    const destination = destinationQuery.trim();

    if (!origin || !destination || origin.length < 3 || destination.length < 3) {
      setDistanceInfo(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setDistanceLoading(true);
        const response = await fetch(
          `/api/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch distance");
        }
        const data = await response.json();
        if (data.distance && data.duration) {
          setDistanceInfo({
            miles: data.distance.miles,
            travelHours: data.duration.hours,
            text: data.distance.text,
          });
        } else {
          setDistanceInfo(null);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setDistanceInfo(null);
      } finally {
        setDistanceLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [originQuery, destinationQuery]);

  const selectedMoveDate = moveDateValue ? parseDateValue(moveDateValue) : null;
  const calendarDays = getCalendarDays(calendarMonth);
  const monthLabel = `${MONTH_LABELS[calendarMonth.getMonth()]}, ${calendarMonth.getFullYear()}`;
  const preferredDateLabel = selectedMoveDate
    ? selectedMoveDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Select a date";
  const originQueryTrimmed = originQuery.trim();
  const originLabel = originQueryTrimmed || "Origin location";
  const originQuestionLabel =
    serviceType === "labor_only" ? "Where do you want to load from?" : "Where are you moving from?";
  const originMapPreviewUrl = originQueryTrimmed
    ? `/api/map?address=${encodeURIComponent(originQueryTrimmed)}`
    : "";
  const destinationQueryTrimmed = destinationQuery.trim();
  const destinationLabel = destinationQueryTrimmed || "Destination location";
  const destinationQuestionLabel = "Where are you moving to?";
  const destinationMapPreviewUrl = destinationQueryTrimmed
    ? `/api/map?address=${encodeURIComponent(destinationQueryTrimmed)}`
    : "";
  const servicesHeading =
    serviceType === "labor_only"
      ? "Select all that applies to your load service"
      : "Select all that applies to your move";
  const pricingConfig = config.pricing;
  const moveTeamOptions = TEAM_OPTIONS_MOVE.map((option) =>
    buildTeamOption(option, pricingConfig.teams.move[option.id])
  );
  const loaderTeamOptions = TEAM_OPTIONS_LOADERS.map((option) =>
    buildTeamOption(option, pricingConfig.teams.loaders[option.id])
  );
  const unloadingTeamOptions = TEAM_OPTIONS_UNLOADING.map((option) =>
    buildTeamOption(option, pricingConfig.teams.unloading[option.id])
  );
  const teamOptions =
    serviceType === "labor_only" && laborHelpType === "loading_only"
      ? loaderTeamOptions
      : serviceType === "labor_only" && laborHelpType === "unloading_only"
        ? unloadingTeamOptions
        : moveTeamOptions;
  const selectedTeamOption =
    teamOptions.find((option) => option.id === teamOption) ?? teamOptions[0];
  const laborerCountLabel = getLaborerCountLabel(laborHelpType, selectedTeamOption.title);
  const additionalTimeRate = formatCurrency(selectedTeamOption.rate);
  const laborHelpLabel = getLaborHelpLabel(laborHelpType);
  const moveActivityLabel = getMoveActivityLabel(serviceType, laborHelpType);
  const additionalProtectionSelected =
    !!insuranceOptionValue && insuranceOptionValue !== "none";
  const storageMoveOutValue =
    typeof customFieldValues.storageMoveOutDate === "string"
      ? customFieldValues.storageMoveOutDate
      : "";
  const storageChecked = storageNeeded || showStoragePage;
  const moveDateFullLabel = selectedMoveDate ? formatFullDate(selectedMoveDate) : "Select date";
  const storageMoveOutLabel = storageMoveOutDate
    ? formatFullDate(parseDateValue(storageMoveOutDate) ?? new Date())
    : "Tap to select date";
  const pickupSummary = formatLocation({
    street: pickupStreet,
    city: pickupCity,
    state: pickupState,
    zip: pickupZip,
    fallback: originLabel,
  });
  const dropoffSummary = formatLocation({
    street: dropoffStreet,
    city: dropoffCity,
    state: dropoffState,
    zip: dropoffZip,
    fallback: destinationLabel,
  });
  const shortDateLabel = selectedMoveDate ? formatShortDate(selectedMoveDate) : "Date TBD";
  const longDateLabel = selectedMoveDate ? formatLongDate(selectedMoveDate) : "your selected date";
  const timeRangeLabel = formatTimeRangeLabel(moveTimeValue);
  const timeSlotDescription = getTimeSlotDescription(moveTimeValue);
  const moveSummaryLabel = getMoveSummaryLabel(moveType, homeSize);
  const moveTypeSummary = getMoveTypeSummary(moveType, homeSize);
  const estimateLaborRange = getEstimateLaborRange({
    serviceType,
    laborHelpType,
    moveType,
    homeSize,
    storageUnitSize,
    officeHeadcount,
    selectedHours: unloadingHours,
    minimumHours: selectedTeamOption.minimumHours,
    pricing: pricingConfig,
  });

  // Calculate travel time and distance costs
  const travelHours = distanceInfo?.travelHours ?? 0;
  const distanceMiles = distanceInfo?.miles ?? 0;

  // Labor cost = labor hours * hourly rate
  const minLaborCost = estimateLaborRange.minLabor * selectedTeamOption.rate;
  const maxLaborCost = estimateLaborRange.maxLabor * selectedTeamOption.rate;

  // Travel cost = travel hours * hourly rate * travel rate multiplier
  const travelCost = travelHours * selectedTeamOption.rate * pricingConfig.travelRate;

  // Distance cost = miles * price per mile
  const distanceCost = distanceMiles * pricingConfig.pricePerMile;

  // Accessibility costs (origin)
  const originElevatorCost = originElevator === "no" ? pricingConfig.accessibility.noElevatorCharge : 0;
  const originStairsCost = originStairs !== "none"
    ? pricingConfig.accessibility.stairsCharge[originStairs as "1-2" | "3-4" | "5+"] ?? 0
    : 0;
  const originWalkCost = pricingConfig.accessibility.walkingDistance[originWalk as "short" | "medium" | "long"] ?? 0;

  // Accessibility costs (destination)
  const destinationElevatorCost = destinationElevator === "no" ? pricingConfig.accessibility.noElevatorCharge : 0;
  const destinationStairsCost = destinationStairs !== "none"
    ? pricingConfig.accessibility.stairsCharge[destinationStairs as "1-2" | "3-4" | "5+"] ?? 0
    : 0;
  const destinationWalkCost = pricingConfig.accessibility.walkingDistance[destinationWalk as "short" | "medium" | "long"] ?? 0;

  // Total accessibility cost
  const accessibilityCost =
    originElevatorCost + originStairsCost + originWalkCost +
    destinationElevatorCost + destinationStairsCost + destinationWalkCost;

  // Protection charge
  const protectionCost = additionalProtectionSelected ? pricingConfig.protectionCharge : 0;

  // Total estimates
  const estimateMinTotal = minLaborCost + travelCost + distanceCost + accessibilityCost + protectionCost;
  const estimateMaxTotal = maxLaborCost + travelCost + distanceCost + accessibilityCost + protectionCost;
  const estimateLabel = formatEstimateRange(estimateMinTotal, estimateMaxTotal);
  const appliedPromo = promoValidation.status === "valid" ? promoValidation.promo : undefined;
  const discountedMinTotal = appliedPromo ? applyPromoDiscount(estimateMinTotal, appliedPromo) : estimateMinTotal;
  const discountedMaxTotal = appliedPromo ? applyPromoDiscount(estimateMaxTotal, appliedPromo) : estimateMaxTotal;
  const finalEstimateLabel = formatEstimateRange(discountedMinTotal, discountedMaxTotal);
  const promoSavingsMin = Math.max(0, estimateMinTotal - discountedMinTotal);
  const promoSavingsMax = Math.max(0, estimateMaxTotal - discountedMaxTotal);

  // Breakdown for display
  const laborLabel = `${estimateLaborRange.minLabor}-${estimateLaborRange.maxLabor} hrs labor`;
  const travelLabel = travelHours > 0 ? `${Math.round(travelHours * 60)} min travel` : null;
  const distanceLabel = distanceMiles > 0 ? `${distanceMiles} mi` : null;
  const accessibilityLabel = accessibilityCost > 0 ? `+${formatCurrency(accessibilityCost)} access` : null;
  const contactName =
    [firstNameValue, lastNameValue].filter(Boolean).join(" ").trim() || "Your move";
  const contactSummaryLine = [moveTypeSummary, phoneValue, emailValue]
    .filter(Boolean)
    .join(" - ");
  const routeSummary = `${pickupSummary} - ${dropoffSummary}`;
  const moveDateSummary = `${longDateLabel}${
    timeRangeLabel ? `, ${timeRangeLabel}` : ""
  }${timeSlotDescription ? ` (${timeSlotDescription.toLowerCase()})` : ""}`;
  const bookingProgressWidth = `${Math.round(((currentStep + 1) / STEPS.length) * 100)}%`;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Calculate progress for the progress bar across all pages.
  // Total steps: ~13 pages for a typical flow (contact moved to step 4)
  const getProgressWidth = () => {
    const totalSteps = 13;

    // Step 1: Service Selection
    if (!serviceType) return "0%";

    // Step 2: Labor Help (labor only) or Move Type
    if (serviceType === "labor_only" && !laborHelpType) return `${Math.round((1 / totalSteps) * 100)}%`;
    if (!moveType) return `${Math.round((1 / totalSteps) * 100)}%`;

    // Step 3: Size selection (home/storage/office)
    if (moveType === "home" && !homeSize) return `${Math.round((2 / totalSteps) * 100)}%`;
    if (moveType === "storage" && !storageUnitSize) return `${Math.round((2 / totalSteps) * 100)}%`;
    if (moveType === "office" && !officeHeadcount) return `${Math.round((2 / totalSteps) * 100)}%`;

    // Step 4: Contact Info (moved earlier)
    if (showContactPage) return `${Math.round((3 / totalSteps) * 100)}%`;

    // Step 5: Move Date
    if (showMoveDatePage && !showMoveTimePage && !showOriginPage) return `${Math.round((4 / totalSteps) * 100)}%`;

    // Step 6: Move Time
    if (showMoveTimePage && !showOriginPage) return `${Math.round((5 / totalSteps) * 100)}%`;

    // Step 7: Origin Location
    if (showOriginPage && !showOriginDetails) return `${Math.round((6 / totalSteps) * 100)}%`;

    // Step 8: Origin Details
    if (showOriginDetails && !showDestinationPage) return `${Math.round((7 / totalSteps) * 100)}%`;

    // Step 9: Destination Location
    if (showDestinationPage && !showDestinationDetails) return `${Math.round((8 / totalSteps) * 100)}%`;

    // Step 10: Destination Details
    if (showDestinationDetails && !showTeamPage) return `${Math.round((9 / totalSteps) * 100)}%`;

    // Step 11: Team Selection
    if (showTeamPage && !showServicesPage) return `${Math.round((10 / totalSteps) * 100)}%`;

    // Step 12: Services
    if (showServicesPage && !showReviewPage) return `${Math.round((11 / totalSteps) * 100)}%`;

    // Step 13: Promo code
    if (showPromoCodePage && !showNextStepsPage) return `${Math.round((12 / totalSteps) * 100)}%`;

    // Final step: Confirmation
    if (showNextStepsPage) return "100%";

    return `${Math.round((4 / totalSteps) * 100)}%`;
  };

    const nextStep = async () => {
      const fieldsToValidate = getFieldsForStep(currentStep);
      const isValid = await trigger(fieldsToValidate as (keyof BookingFormData)[]);
      if (!isValid) {
        return;
      }
      if (currentStep === 0) {
        setShowNextStepsPage(true);
        return;
      }
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      return;
    }
    setShowMoveDatePage(false);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(true);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const goBackToMoveSelection = () => {
    if (moveType === "home" && homeSize) {
      setHomeSize(null);
    } else if (moveType === "storage" && storageUnitSize) {
      setStorageUnitSize(null);
    } else if (moveType === "office" && officeHeadcount) {
      setOfficeHeadcount(null);
    } else if (moveType) {
      setMoveType(null);
    } else if (serviceType === "labor_only") {
      setLaborHelpType(null);
    }
    setShowMoveDatePage(true);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const goBackToContact = () => {
    setShowMoveDatePage(false);
    setShowContactPage(true);
  };

  const goBackToMoveType = () => {
    setMoveType(null);
    setHomeSize(null);
    setStorageUnitSize(null);
    setOfficeHeadcount(null);
    setShowMoveDatePage(true);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const goBackToLaborHelpSelection = () => {
    setLaborHelpType(null);
    setMoveType(null);
    setHomeSize(null);
    setTeamOption(null);
    setStorageUnitSize(null);
    setOfficeHeadcount(null);
    setShowMoveDatePage(true);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const goBackToServiceSelection = () => {
    setServiceType(null);
    setMoveType(null);
    setHomeSize(null);
    setLaborHelpType(null);
    setTeamOption(null);
    setStorageUnitSize(null);
    setOfficeHeadcount(null);
    setShowMoveDatePage(true);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToDateSelection = () => {
    setShowMoveTimePage(false);
    setShowMoveDatePage(true);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToMoveTime = () => {
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowMoveTimePage(true);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToOriginSearch = () => {
    setShowOriginDetails(false);
  };

  const goBackToDestinationSearch = () => {
    setShowDestinationDetails(false);
  };

  const goBackToOriginFromDestination = () => {
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowOriginPage(true);
    setShowOriginDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToOriginPage = () => {
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    if (serviceType === "labor_only") {
      if (laborHelpType === "loading_only" || laborHelpType === "unloading_only") {
        setShowUnloadingHoursPage(true);
        setShowTeamPage(false);
      } else {
        setShowTeamPage(true);
        setShowUnloadingHoursPage(false);
      }
      setShowDestinationPage(false);
      setShowDestinationDetails(false);
      setShowOriginPage(false);
    } else {
      setShowDestinationPage(true);
      setShowDestinationDetails(false);
      setShowOriginPage(false);
      setShowUnloadingHoursPage(false);
    }
    setShowOriginDetails(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToServicesPage = () => {
    setShowReviewPage(false);
    setShowServicesPage(true);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowNextStepsPage(false);
  };

  const handleLaborHelpSelect = (value: LaborHelpType) => {
    setLaborHelpType(value);
    setTeamOption(null);
    setStorageUnitSize(null);
    setOfficeHeadcount(null);
    setShowMoveDatePage(true);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleDateSelect = (date: Date) => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (normalizedDate < todayStart) {
      return;
    }
    setValue("moveDate", formatDateValue(normalizedDate), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("moveTime", "", { shouldDirty: true });
    setCalendarMonth(new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1));
    setShowMoveDatePage(false);
    setShowMoveTimePage(true);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleTimeSelect = (value: string) => {
    setValue("moveTime", value, { shouldDirty: true });
    setShowMoveTimePage(false);
    setShowOriginPage(true);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleOriginSelect = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }
    setOriginQuery(trimmedValue);
    setOriginSuggestions([]);
    setOriginSuggestionsLoading(false);
    setValue("pickupStreet", trimmedValue, { shouldDirty: true });
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowOriginDetails(true);
  };

  const handleConfirmOrigin = () => {
    setValue("pickupUnit", originUnit, { shouldDirty: true });
    setValue("pickupElevator", originElevator === "yes", { shouldDirty: true });
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(true);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleDestinationSelect = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }
    setDestinationQuery(trimmedValue);
    setDestinationSuggestions([]);
    setDestinationSuggestionsLoading(false);
    setValue("dropoffStreet", trimmedValue, { shouldDirty: true });
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowDestinationDetails(true);
  };

  const handleConfirmDestination = () => {
    setValue("dropoffUnit", destinationUnit, { shouldDirty: true });
    setValue("dropoffElevator", destinationElevator === "yes", { shouldDirty: true });
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    if (serviceType === "labor_only") {
      setShowTeamPage(true);
      setShowServicesPage(false);
      setShowUnloadingHoursPage(false);
    } else {
      setShowTeamPage(false);
      setShowUnloadingHoursPage(false);
      setShowServicesPage(true);
    }
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToTeamPage = () => {
    setShowTeamPage(false);
    setShowDestinationPage(true);
    setShowDestinationDetails(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleTeamSelect = (value: TeamOptionId) => {
    setTeamOption(value);
    setShowTeamPage(false);
    if (
      serviceType === "labor_only" &&
      (laborHelpType === "loading_only" || laborHelpType === "unloading_only")
    ) {
      setShowUnloadingHoursPage(true);
      setShowServicesPage(false);
    } else {
      setShowUnloadingHoursPage(false);
      setShowServicesPage(true);
    }
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleStorageUnitSelect = (value: StorageUnitSize) => {
    setStorageUnitSize(value);
    setShowContactPage(true);
    setShowMoveDatePage(false);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const handleOfficeHeadcountSelect = (value: OfficeHeadcount) => {
    setOfficeHeadcount(value);
    setShowContactPage(true);
    setShowMoveDatePage(false);
    setShowMoveTimePage(false);
    setShowOriginPage(false);
    setShowOriginDetails(false);
    setShowDestinationPage(false);
    setShowDestinationDetails(false);
    setShowTeamPage(false);
    setShowUnloadingHoursPage(false);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowNextStepsPage(false);
  };

  const goBackToSizeSelection = () => {
    setShowContactPage(false);
    // Reset size selections so user can re-select
    if (moveType === "home") {
      setHomeSize(null);
    } else if (moveType === "storage") {
      setStorageUnitSize(null);
    } else if (moveType === "office") {
      setOfficeHeadcount(null);
    }
  };

  const handleContactContinue = async () => {
    // Validate contact fields before continuing
    const isValid = await trigger(["firstName", "lastName", "email", "phone"]);
    if (!isValid) return;

    // Save contact info to database
    try {
      const contactData = {
        widgetId: config.id,
        firstName: watch("firstName"),
        lastName: watch("lastName"),
        email: watch("email"),
        phone: watch("phone"),
      };

      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });
    } catch (error) {
      console.error("Error saving contact:", error);
      // Continue anyway - don't block the user flow
    }

    setShowContactPage(false);
    setShowMoveDatePage(true);
  };

  const goBackToUnloadingHours = () => {
    setShowUnloadingHoursPage(false);
    setShowTeamPage(true);
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const handleUnloadingHoursContinue = () => {
    setShowUnloadingHoursPage(false);
    setShowServicesPage(true);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const handleServicesContinue = () => {
    setShowServicesPage(false);
    setShowStoragePage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(true);
    setShowNextStepsPage(false);
  };

  const handlePromoCodeBack = () => {
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
    setShowServicesPage(true);
  };

  const validatePromoCode = async (promoCode: string) => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return null;

    setPromoValidation({ status: "checking", message: "Checking promo code..." });

    try {
      const response = await fetch(`/api/promo-codes?code=${encodeURIComponent(code)}`);
      const data = (await response.json()) as
        | { valid: true; promo: PromoDiscount }
        | { valid: false; reason?: string };

      if (response.ok && "valid" in data && data.valid && "promo" in data && data.promo) {
        lastValidatedPromoCodeRef.current = data.promo.code.toUpperCase();
        setPromoValidation({
          status: "valid",
          promo: data.promo,
          message: `Applied ${data.promo.code} (${formatPromoLabel(data.promo)}).`,
        });
        return data.promo;
      }

      lastValidatedPromoCodeRef.current = null;
      setPromoValidation({
        status: "invalid",
        message: "That promo code was not found or is not active.",
      });
      return null;
    } catch {
      lastValidatedPromoCodeRef.current = null;
      setPromoValidation({
        status: "invalid",
        message: "Could not validate promo code. Please try again.",
      });
      return null;
    }
  };

  const handlePromoCodeContinue = async () => {
    const promoCode = String(getValues("promoCode") || "").trim().toUpperCase();

    if (promoCode) {
      const promo = await validatePromoCode(promoCode);
      if (!promo) return;

      setValue("promoCode", promoCode, { shouldDirty: true });
      setCustomFieldValues((prev) => ({
        ...prev,
        promoCode,
        promoDiscountType: promo.discountType,
        promoDiscountValue: String(promo.discountValue),
      }));
    } else {
      lastValidatedPromoCodeRef.current = null;
      setPromoValidation({ status: "idle" });
      setCustomFieldValues((prev) => {
        const next = { ...(prev as Record<string, string | boolean>) };
        delete next.promoCode;
        delete next.promoDiscountType;
        delete next.promoDiscountValue;
        return next;
      });
    }

    setShowPromoCodePage(false);
    setShowNextStepsPage(true);
  };

  const handleSkipPromoCode = () => {
    lastValidatedPromoCodeRef.current = null;
    setPromoValidation({ status: "idle" });
    setValue("promoCode", "", { shouldDirty: true });
    setCustomFieldValues((prev) => {
      const next = { ...(prev as Record<string, string | boolean>) };
      delete next.promoCode;
      delete next.promoDiscountType;
      delete next.promoDiscountValue;
      return next;
    });
    setShowPromoCodePage(false);
    setShowNextStepsPage(true);
  };

    const handleReviewContinue = () => {
      setShowReviewPage(false);
      setShowPromoCodePage(false);
      setShowNextStepsPage(false);
      setCurrentStep(0);
    };

    const handleConfirmReservation = async () => {
    if (confirmationSentRef.current) {
      setIsSubmitted(true);
      return;
    }

    confirmationSentRef.current = true;

    const formValues = getValues();
    const payload = {
      widgetId: config.id,
      widgetName: config.name,
      companyName: config.companyName,
      summary: {
        contactName,
        contactSummaryLine,
        routeSummary,
        moveDateSummary,
        team: selectedTeamOption.title,
        estimateLabel: finalEstimateLabel,
      },
      selections: {
        serviceType,
        laborHelpType,
        moveType,
        homeSize,
        storageUnitSize,
        officeHeadcount,
        teamOption,
      },
      form: formValues,
      extras: {
        inventory,
        specialItems,
        customFieldValues,
      },
      estimate: {
        minLaborHours: estimateLaborRange.minLabor,
        maxLaborHours: estimateLaborRange.maxLabor,
        hourlyRate: selectedTeamOption.rate,
        travelHours,
        distanceMiles,
        travelRate: pricingConfig.travelRate,
        pricePerMile: pricingConfig.pricePerMile,
        accessibilityCost,
        protectionCost,
        minLaborCost,
        maxLaborCost,
        travelCost,
        distanceCost,
        estimateMinTotal,
        estimateMaxTotal,
        discountedMinTotal,
        discountedMaxTotal,
        promo: appliedPromo
          ? {
              code: appliedPromo.code,
              discountType: appliedPromo.discountType,
              discountValue: appliedPromo.discountValue,
            }
          : null,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send confirmation email");
      }
      } catch (error) {
        console.error("Confirmation email failed:", error);
      }

      setIsSubmitted(true);
    };

  const openStoragePage = () => {
    setStoragePageWasEnabled(storageNeeded ?? false);
    setStorageMoveOutDate(storageMoveOutValue || "");
    setStoragePlan(storageDurationValue || "1_week");
    setShowStoragePage(true);
    setShowServicesPage(false);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const handleStorageCancel = () => {
    if (!storagePageWasEnabled) {
      setValue("storageNeeded", false, { shouldDirty: true });
      setValue("storageDuration", "", { shouldDirty: true });
      setCustomFieldValues((prev) => ({ ...prev, storageMoveOutDate: "" }));
    }
    setStorageMoveOutDate(storageMoveOutValue || "");
    setStoragePlan(storageDurationValue || "1_week");
    setShowStoragePage(false);
    setShowServicesPage(true);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const handleStorageSave = () => {
    setValue("storageNeeded", true, { shouldDirty: true });
    setValue("storageDuration", storagePlan, { shouldDirty: true });
    setCustomFieldValues((prev) => ({
      ...prev,
      storageMoveOutDate: storageMoveOutDate,
    }));
    setShowStoragePage(false);
    setShowServicesPage(true);
    setShowProtectionPage(false);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const handleToggleStorage = (checked: boolean) => {
    if (checked) {
      openStoragePage();
      return;
    }
    setValue("storageNeeded", false, { shouldDirty: true });
    setValue("storageDuration", "", { shouldDirty: true });
    setCustomFieldValues((prev) => ({ ...prev, storageMoveOutDate: "" }));
    setStorageMoveOutDate("");
    setStoragePlan("1_week");
    setShowStoragePage(false);
  };

  const handleProtectionCancel = () => {
    setShowProtectionPage(false);
    setShowStoragePage(false);
    setShowServicesPage(true);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const handleProtectionSave = () => {
    setValue("insuranceOption", `deductible_${protectionDeductible}`, {
      shouldDirty: true,
    });
    setValue("declaredValue", protectionDeclaredValue, { shouldDirty: true });
    setShowProtectionPage(false);
    setShowStoragePage(false);
    setShowServicesPage(true);
    setShowReviewPage(false);
    setShowPromoCodePage(false);
    setShowNextStepsPage(false);
  };

  const goToNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const onSubmit = async (data: BookingFormData) => {
    if (isPreview) {
      setIsSubmitted(true);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          widgetId: config.id,
          serviceType,
          moveType,
          homeSize,
          inventory,
          specialItems,
          customFieldValues,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Failed to submit booking:", error);
    }
  };

  const addInventoryItem = (name: string, category: string) => {
    const existing = inventory.find((item) => item.name === name);
    if (existing) {
      setInventory(
        inventory.map((item) =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setInventory([
        ...inventory,
        { id: uuidv4(), name, quantity: 1, category: category as InventoryItem["category"] },
      ]);
    }
  };

  const updateInventoryQuantity = (id: string, delta: number) => {
    setInventory(
      inventory
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const toggleSpecialItem = (name: string) => {
    const existing = specialItems.find((item) => item.name === name);
    if (existing) {
      setSpecialItems(specialItems.filter((item) => item.name !== name));
    } else {
      setSpecialItems([
        ...specialItems,
        { id: uuidv4(), name, requiresSpecialHandling: true },
      ]);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: config.primaryColor }}
        />
        <h3 className="text-xl font-semibold mb-2">Quote Request Submitted!</h3>
        <p className="text-gray-600">{config.successMessage}</p>
      </div>
    );
  }

  // Page 1: Service Selection
  if (!serviceType) {
    return (
      <div className="py-4">
        {/* Header with avatar */}
        <div className="flex items-center gap-4 mb-8">
          {config.logo ? (
            <img
              src={config.logo}
              alt=""
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: config.primaryColor }}
            >
              {config.companyName.charAt(0)}
            </div>
          )}
          <h2 className="text-xl text-gray-700">How can we help?</h2>
        </div>

        {/* Service Options */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setServiceType("full_service")}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.primaryColor}15` }}
              >
                <Truck className="w-5 h-5" style={{ color: config.primaryColor }} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Full service moving services</div>
                <div className="text-sm text-gray-500">We bring the crew and the trucks</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button
            type="button"
            onClick={() => setServiceType("labor_only")}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.primaryColor}15` }}
              >
                <Users className="w-5 h-5" style={{ color: config.primaryColor }} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Labor only services</div>
                <div className="text-sm text-gray-500">Our professionals help you load and/or unload into your own truck</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Existing Booking Link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            className="text-sm font-medium hover:underline"
            style={{ color: config.primaryColor }}
          >
            
          </button>
        </div>
      </div>
    );
  }

  // Page 2: Labor Help Selection (labor only)
  if (serviceType === "labor_only" && !laborHelpType) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={
              serviceType === "labor_only"
                ? goBackToLaborHelpSelection
                : goBackToServiceSelection
            }
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">What do you need help with?</h2>

        {/* Labor Help Options */}
        <div className="space-y-1">
          {LABOR_HELP_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleLaborHelpSelect(option.id as LaborHelpType)}
              className="w-full flex items-start justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
            >
              <div>
                <div className="text-gray-900 font-medium">{option.title}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 mt-1" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Page 2: Move Type Selection
  if (!moveType) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToServiceSelection}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">What are you moving?</h2>

        {/* Move Type Options */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setMoveType("home")}
            className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <Home className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">A home...</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => setMoveType("storage")}
            className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <Warehouse className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">Storage unit...</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => setMoveType("office")}
            className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">An office...</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  // Page 3: Home Size Selection (only for home moves)
  if (moveType === "home" && !homeSize) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToMoveType}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">What type of home?</h2>

        {/* Home Size Options */}
        <div className="space-y-1">
          {HOME_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => { setHomeSize(size.id as HomeSize); setShowContactPage(true); }}
              className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
            >
              <span className="text-gray-900">{size.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Page 4: Storage Unit Size Selection
  if (moveType === "storage" && !storageUnitSize) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToMoveType}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">What type of storage unit?</h2>

        {/* Storage unit options */}
        <div className="space-y-1">
          {STORAGE_UNIT_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => handleStorageUnitSelect(size.id as StorageUnitSize)}
              className="w-full flex items-start justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{size.label}</div>
                <div className="text-xs text-gray-500">{size.detail}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 mt-1" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Page 5: Office Headcount Selection
  if (moveType === "office" && !officeHeadcount) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToMoveType}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">How many people in the office?</h2>

        {/* Office headcount options */}
        <div className="space-y-1">
          {OFFICE_HEADCOUNT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOfficeHeadcountSelect(option.id as OfficeHeadcount)}
              className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
            >
              <span className="text-sm font-medium text-gray-900">{option.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Page 6: Contact Information (moved earlier in flow)
  if (showContactPage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToSizeSelection}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">Please give us your contact info</h2>

        {/* Contact Form */}
        <div className="space-y-6">
          <div>
            <Label className="text-xs font-medium" style={{ color: config.primaryColor }}>
              First name
            </Label>
            <Input
              {...register("firstName")}
              className="mt-2 border-0 border-b border-gray-200 rounded-none px-0 focus:ring-0 focus:border-transparent"
              style={{ borderBottomColor: config.primaryColor }}
              error={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-normal text-gray-700">Last name</Label>
            <Input
              {...register("lastName")}
              className="mt-2 border-0 border-b border-gray-200 rounded-none px-0 focus:ring-0 focus:border-transparent"
              error={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-normal text-gray-700">Email</Label>
            <Input
              {...register("email")}
              type="email"
              className="mt-2 border-0 border-b border-gray-200 rounded-none px-0 focus:ring-0 focus:border-transparent"
              error={!!errors.email}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-normal text-gray-700">Phone</Label>
            <div className="mt-2 flex items-center gap-3 border-b border-gray-200 pb-2">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-gray-700"
              >
                <span className="text-xs">US</span>
                <span>+1</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <Input
                {...register("phone")}
                type="tel"
                className="border-0 rounded-none px-0 py-0 h-8 focus:ring-0 focus:border-transparent"
                error={!!errors.phone}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleContactContinue}
          style={{ backgroundColor: config.primaryColor }}
          className="w-full text-white hover:opacity-90 mt-10"
        >
          Continue
        </Button>
      </div>
    );
  }

  // Page 7: Move Date Selection
  if (showMoveDatePage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToContact}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">When are you moving?</h2>

        {/* Month */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" style={{ color: config.primaryColor }} />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center text-xs font-medium mb-2">
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              key={label}
              className={index === 0 ? "text-red-400" : "text-gray-500"}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {calendarDays.map((day) => {
            const isSelected = selectedMoveDate
              ? isSameDay(day.date, selectedMoveDate)
              : false;
            const isPast = day.date < todayStart;
            const isDisabled = !day.inCurrentMonth || isPast;

            return (
              <button
                key={day.date.getTime()}
                type="button"
                onClick={() => handleDateSelect(day.date)}
                disabled={isDisabled}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isSelected
                    ? "text-white"
                    : isDisabled
                      ? "text-gray-300 cursor-default"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
                style={isSelected ? { backgroundColor: config.primaryColor } : undefined}
                aria-label={day.date.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Page 7: Preferred Start Time
  if (showMoveTimePage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToDateSelection}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-2">
          What&apos;s your preferred start time?
        </h2>
        <div className="text-sm text-gray-400 mb-4">{preferredDateLabel}</div>

        {/* Time options */}
        <div className="space-y-1">
          {TIME_OPTIONS.map((option) => {
            const isSelected = moveTimeValue === option.value;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleTimeSelect(option.value)}
                className={`w-full flex items-center justify-between py-4 px-2 border-b border-gray-100 text-left transition-colors ${
                  isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Page 8: Origin Location
  if (showOriginPage) {
    return (
      <div className="py-4">
        {!showOriginDetails ? (
          <>
            {/* Header with back button and progress */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={goBackToMoveTime}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: getProgressWidth(),
                      background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                      boxShadow: `0 0 10px ${config.primaryColor}50`
                    }}
                  />
                </div>
              </div>
              <button type="button" className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Question */}
            <h2 className="text-xl text-gray-700 mt-8 mb-6">{originQuestionLabel}</h2>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={originQuery}
                onChange={(event) => {
                  setOriginQuery(event.target.value);
                  setOriginSuggestions([]);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleOriginSelect(originQuery);
                  }
                }}
                placeholder="Address, city or postal code"
                className="pl-9 bg-gray-100 border-transparent focus:border-gray-200"
              />
            </div>

            {(originSuggestionsLoading || originSuggestions.length > 0) && (
              <div className="border-b border-gray-100">
                {originSuggestionsLoading && (
                  <div className="py-3 px-2 text-xs text-gray-400">Searching...</div>
                )}
                {originSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    onClick={() => handleOriginSelect(suggestion.description)}
                    className="w-full flex items-center gap-2 py-3 px-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{suggestion.description}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 mb-4 border-b">
              <span className="text-sm font-semibold text-gray-900">
                Origin location details
              </span>
              <button
                type="button"
                onClick={goBackToOriginSearch}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 py-3 border-b border-gray-100 text-sm text-gray-700">
              <MapPin className="w-4 h-4" style={{ color: config.primaryColor }} />
              <span>{originLabel}</span>
            </div>

            <div className="h-36 rounded-md border border-gray-100 overflow-hidden bg-gray-100 my-4">
              {originMapPreviewUrl ? (
                <img
                  src={originMapPreviewUrl}
                  alt={`Map preview for ${originLabel}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  Map preview
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Building / apartment number</Label>
                <Input
                  value={originUnit}
                  onChange={(event) => setOriginUnit(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Elevator access?</Label>
                <Select
                  value={originElevator}
                  onChange={(event) => setOriginElevator(event.target.value)}
                  className="mt-1"
                >
                  {ORIGIN_ELEVATOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Flights of stairs to entrance</Label>
                <Select
                  value={originStairs}
                  onChange={(event) => setOriginStairs(event.target.value)}
                  className="mt-1"
                >
                  {ORIGIN_STAIRS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Walking distance from parking to entrance:</Label>
                <Select
                  value={originWalk}
                  onChange={(event) => setOriginWalk(event.target.value)}
                  className="mt-1"
                >
                  {ORIGIN_WALK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConfirmOrigin}
              style={{ backgroundColor: config.primaryColor }}
              className="w-full text-white hover:opacity-90 mt-6"
            >
              CONFIRM ORIGIN LOCATION
            </Button>
          </>
        )}
      </div>
    );
  }

  // Page 9: Destination Location
  if (showDestinationPage) {
    return (
      <div className="py-4">
        {!showDestinationDetails ? (
          <>
            {/* Header with back button and progress */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={goBackToOriginFromDestination}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: getProgressWidth(),
                      background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                      boxShadow: `0 0 10px ${config.primaryColor}50`
                    }}
                  />
                </div>
              </div>
              <button type="button" className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Question */}
            <h2 className="text-xl text-gray-700 mt-8 mb-6">{destinationQuestionLabel}</h2>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={destinationQuery}
                onChange={(event) => {
                  setDestinationQuery(event.target.value);
                  setDestinationSuggestions([]);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleDestinationSelect(destinationQuery);
                  }
                }}
                placeholder="Address, city or postal code"
                className="pl-9 bg-gray-100 border-transparent focus:border-gray-200"
              />
            </div>

            {(destinationSuggestionsLoading || destinationSuggestions.length > 0) && (
              <div className="border-b border-gray-100">
                {destinationSuggestionsLoading && (
                  <div className="py-3 px-2 text-xs text-gray-400">Searching...</div>
                )}
                {destinationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    onClick={() => handleDestinationSelect(suggestion.description)}
                    className="w-full flex items-center gap-2 py-3 px-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{suggestion.description}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 mb-4 border-b">
              <span className="text-sm font-semibold text-gray-900">
                Destination location details
              </span>
              <button
                type="button"
                onClick={goBackToDestinationSearch}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 py-3 border-b border-gray-100 text-sm text-gray-700">
              <MapPin className="w-4 h-4" style={{ color: config.primaryColor }} />
              <span>{destinationLabel}</span>
            </div>

            <div className="h-36 rounded-md border border-gray-100 overflow-hidden bg-gray-100 my-4">
              {destinationMapPreviewUrl ? (
                <img
                  src={destinationMapPreviewUrl}
                  alt={`Map preview for ${destinationLabel}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  Map preview
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Building / apartment number</Label>
                <Input
                  value={destinationUnit}
                  onChange={(event) => setDestinationUnit(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Elevator access?</Label>
                <Select
                  value={destinationElevator}
                  onChange={(event) => setDestinationElevator(event.target.value)}
                  className="mt-1"
                >
                  {ORIGIN_ELEVATOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Flights of stairs to entrance</Label>
                <Select
                  value={destinationStairs}
                  onChange={(event) => setDestinationStairs(event.target.value)}
                  className="mt-1"
                >
                  {ORIGIN_STAIRS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Walking distance from parking to entrance:</Label>
                <Select
                  value={destinationWalk}
                  onChange={(event) => setDestinationWalk(event.target.value)}
                  className="mt-1"
                >
                  {ORIGIN_WALK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConfirmDestination}
              style={{ backgroundColor: config.primaryColor }}
              className="w-full text-white hover:opacity-90 mt-6"
            >
              CONFIRM DESTINATION LOCATION
            </Button>
          </>
        )}
      </div>
    );
  }

  // Page 10: Select Team
  if (showTeamPage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToTeamPage}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-6">Select team</h2>

        <div className="space-y-1">
          {teamOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleTeamSelect(option.id as TeamOptionId)}
              className="w-full flex items-start justify-between py-4 px-2 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{option.title}</div>
                <div className="text-xs text-gray-500">{option.detail}</div>
                {option.recommended && (
                  <span className="inline-flex items-center text-[10px] font-semibold bg-gray-900 text-white px-2 py-0.5 rounded mt-2">
                    Recommended
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 mt-1 group-hover:text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Page 11: Unloading Hours
  if (showUnloadingHoursPage) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToUnloadingHours}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <h2 className="text-xl text-gray-700 mt-8 mb-4">Choose hours needed</h2>

        <div className="text-center space-y-1 mb-6">
          <div className="text-lg font-medium text-gray-900">
            {selectedTeamOption.title}
          </div>
          <div className="text-sm text-gray-400">{selectedTeamOption.detail}</div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="relative flex items-center justify-between border-b border-gray-100 py-3">
            <div>
              <div className="font-medium text-gray-900">{unloadingHours} Hours</div>
              <div className="text-xs text-gray-500">Choose number of hours needed.</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
            <select
              value={unloadingHours}
              onChange={(event) => setUnloadingHours(event.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Choose number of hours needed"
            >
              {UNLOADING_HOURS_OPTIONS.map((hours) => (
                <option key={hours} value={hours}>
                  {hours} Hours
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start justify-between border-b border-gray-100 py-3">
            <div>
              <div className="font-medium text-gray-900">{laborerCountLabel}</div>
              <div className="text-xs text-gray-500">
                Additional time is {additionalTimeRate} per hour (if required)
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {additionalTimeRate}
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleUnloadingHoursContinue}
          style={{ backgroundColor: config.primaryColor }}
          className="w-full text-white hover:opacity-90 mt-10"
        >
          CHOOSE {unloadingHours} HOURS
        </Button>
      </div>
    );
  }

  // Page 12: Storage Services
  if (showStoragePage) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-6">
          <button type="button" onClick={handleStorageCancel}>
            CANCEL
          </button>
          <div className="text-sm font-semibold text-gray-700">Storage services</div>
          <button
            type="button"
            onClick={handleStorageSave}
            style={{ color: config.primaryColor }}
          >
            SAVE
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="border-b border-gray-100 pb-4">
            <div className="text-xs text-gray-500">
              Move to storage date (same as your loading date)
            </div>
            <div className="text-sm font-medium text-gray-900 mt-2">
              {moveDateFullLabel}
            </div>
          </div>

          <div className="relative flex items-center justify-between border-b border-gray-100 py-3">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Move out of storage date
              </div>
              <div className="text-xs text-gray-500">{storageMoveOutLabel}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={storageMoveOutDate}
              min={moveDateValue || undefined}
              onChange={(event) => setStorageMoveOutDate(event.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Move out of storage date"
            />
          </div>

          <div className="border-b border-gray-100 pb-4">
            <Label>Storage plan</Label>
            <Select
              value={storagePlan}
              onChange={(event) => setStoragePlan(event.target.value)}
              className="mt-2"
            >
              <option value="1_week">1 Week</option>
              <option value="2_weeks">2 Weeks</option>
              <option value="1_month">1 Month</option>
              <option value="2_months">2 Months</option>
              <option value="3_months">3+ Months</option>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  // Page 13: Additional Protection
  if (showProtectionPage) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-6">
          <button type="button" onClick={handleProtectionCancel}>
            CANCEL
          </button>
          <div className="text-sm font-semibold text-gray-700">Additional protection</div>
          <button
            type="button"
            onClick={handleProtectionSave}
            style={{ color: config.primaryColor }}
          >
            SAVE
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Select your deductible level (the amount you pay in the event there is a
          claim) and enter your declared liability amount (your estimated value of all
          the items in your load service to calculate your protection charge)
        </p>

        <div className="space-y-4 mt-6 text-sm">
          <div className="border-b border-gray-100 pb-4">
            <Label>Deductible level</Label>
            <Select
              value={protectionDeductible}
              onChange={(event) => setProtectionDeductible(event.target.value)}
              className="mt-2"
            >
              <option value="250">$250</option>
              <option value="500">$500</option>
              <option value="1000">$1,000</option>
            </Select>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <Label>Declared liability amount</Label>
            <Input
              type="number"
              value={protectionDeclaredValue}
              onChange={(event) => setProtectionDeclaredValue(event.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Protection charge</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(pricingConfig.protectionCharge)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Page 13: Move Services
  if (showServicesPage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToOriginPage}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-xl text-gray-700 mt-8 mb-4">{servicesHeading}</h2>

        <div className="space-y-1">
          <div
            className="flex items-start justify-between gap-3 py-4 px-2 border-b border-gray-100 cursor-pointer"
            onClick={openStoragePage}
          >
            <Checkbox
              checked={storageChecked}
              onChange={(event) => handleToggleStorage(event.target.checked)}
              onClick={(event) => event.stopPropagation()}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Storage services</div>
              <div className="text-xs text-gray-500">
                Need to store all or some of your items before they are delivered? We
                can help
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleServicesContinue}
          style={{ backgroundColor: config.primaryColor }}
          className="w-full text-white hover:opacity-90 mt-6"
        >
          CONTINUE
        </Button>
      </div>
    );
  }

  // Legacy: Review (unused)
  if (showReviewPage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={goBackToServicesPage}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="text-sm text-gray-500">{selectedTeamOption.title}</div>
          <div className="text-3xl font-semibold text-gray-900">
            {selectedTeamOption.rateShort}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Billed in 15 minute increments. Includes loading, travel time and
            unloading. {selectedTeamOption.minimumLong}
          </p>
          <Button
            type="button"
            onClick={handleReviewContinue}
            style={{ backgroundColor: config.primaryColor }}
            className="w-full text-white hover:opacity-90 mt-2"
          >
            BOOK MY MOVE
          </Button>
        </div>

        <div className="border-t pt-4 mt-6 space-y-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">{shortDateLabel}</div>
            <div className="text-xs text-gray-500">
              {moveSummaryLabel} on {longDateLabel}
              {timeRangeLabel ? ` starting between ${timeRangeLabel}` : ""} from{" "}
              {pickupSummary} to {dropoffSummary}
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <div className="font-medium text-gray-900">{laborHelpLabel}</div>
              <div className="text-xs text-gray-500">
                {selectedTeamOption.title}, {selectedTeamOption.minimumShort}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {selectedTeamOption.rateShort}
            </div>
          </div>

          </div>
        </div>
      );
    }

  // Page 14: Promo code
  if (showPromoCodePage) {
    return (
      <div className="py-4">
        {/* Header with back button and progress */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handlePromoCodeBack}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: getProgressWidth(),
                  background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 0 10px ${config.primaryColor}50`,
                }}
              />
            </div>
          </div>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <h2 className="text-xl text-gray-700 mt-8 mb-4">Do you have a promo code?</h2>

        <div className="space-y-2">
          <Label htmlFor="promoCode">Promo code (optional)</Label>
          <Input
            id="promoCode"
            placeholder="e.g. MOVE10"
            autoCapitalize="characters"
            {...register("promoCode")}
          />
          <p className="text-xs text-gray-500">
            If your code is valid, we&apos;ll apply it during confirmation.
          </p>
          {promoValidation.status !== "idle" && promoValidation.message && (
            <div
              className={[
                "mt-2 rounded-md border px-3 py-2 text-xs",
                promoValidation.status === "valid" && "border-green-200 bg-green-50 text-green-800",
                promoValidation.status === "invalid" && "border-red-200 bg-red-50 text-red-800",
                promoValidation.status === "checking" && "border-gray-200 bg-gray-50 text-gray-800",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {promoValidation.message}
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={handlePromoCodeContinue}
          style={{ backgroundColor: config.primaryColor }}
          className="w-full text-white hover:opacity-90 mt-6"
          disabled={promoValidation.status === "checking"}
        >
          {promoValidation.status === "checking" ? "CHECKING..." : "CONTINUE"}
        </Button>

        <button
          type="button"
          onClick={handleSkipPromoCode}
          className="w-full text-sm text-gray-500 hover:text-gray-700 mt-3"
        >
          I don&apos;t have a promo code
        </button>
      </div>
    );
  }

  // Page 15: Next Steps
  if (showNextStepsPage) {
    return (
      <div className="py-4">
        <div className="rounded-lg overflow-hidden border border-gray-100">
          <div
            className="px-4 py-3 text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{config.companyName}</div>
              <button
                type="button"
                className="p-1 rounded hover:bg-white/10"
                aria-label="More"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs opacity-90 mt-1">
              Booking reference: {BOOKING_REFERENCE}
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="rounded-md bg-amber-50 border border-amber-100 text-amber-900 text-xs px-3 py-2">
                  <span className="font-semibold">Almost done.</span> Review your reservation and confirm.
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <div className="font-medium text-gray-900">{contactName}</div>
                  <div className="text-xs text-gray-500">{contactSummaryLine}</div>
                </div>

              <div className="border-b border-gray-100 pb-3 text-sm text-gray-700">
                {routeSummary}
              </div>

              <div className="border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500">{moveActivityLabel}</div>
                <div className="font-medium text-gray-900">{moveDateSummary}</div>
                <div className="text-xs text-gray-500">{selectedTeamOption.title}</div>
                <div className="text-xs text-gray-500">Hourly rate: {selectedTeamOption.rateShort}</div>
              </div>

                <div className="border-b border-gray-100 pb-3">
                  <div className="text-xs text-gray-500">Estimate</div>
                  <div className="font-medium text-gray-900">{finalEstimateLabel}</div>
                  {appliedPromo && (
                    <div className="text-xs text-green-700 mt-1">
                      Promo {appliedPromo.code}: {formatPromoLabel(appliedPromo)} (saves{" "}
                      {formatEstimateRange(promoSavingsMin, promoSavingsMax)})
                    </div>
                  )}
                  {!appliedPromo && promoCodeValue && promoValidation.status === "invalid" && (
                    <div className="text-xs text-red-600 mt-1">Promo code not applied.</div>
                  )}
                  {appliedPromo && (
                    <div className="text-xs text-gray-500 mt-1">Original: {estimateLabel}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    how the estimate is calculated
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                    <span>{laborLabel}</span>
                    {travelLabel && <span>+ {travelLabel}</span>}
                    {distanceLabel && <span>({distanceLabel})</span>}
                    {accessibilityLabel && <span>{accessibilityLabel}</span>}
                    {distanceLoading && <span className="animate-pulse">calculating route...</span>}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleConfirmReservation}
                style={{ backgroundColor: config.primaryColor }}
                className="w-full text-white hover:opacity-90"
              >
                CONFIRM
              </Button>
            </div>
          </div>
        </div>
      );
  }

  // Main Form with Steps
  return (
    <div>
      {/* Progress Steps */}
      {currentStep > 0 && (
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive || isCompleted
                        ? "text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                    style={{
                      backgroundColor: isActive || isCompleted ? config.primaryColor : undefined,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      index < currentStep ? "" : "bg-gray-200"
                    }`}
                    style={{
                      backgroundColor: index < currentStep ? config.primaryColor : undefined,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("moveDate")} />
        <input type="hidden" {...register("moveTime")} />
        {/* Step 1: Contact Info */}
        {currentStep === 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={prevStep}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: bookingProgressWidth,
                      background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                      boxShadow: `0 0 10px ${config.primaryColor}50`
                    }}
                  />
                </div>
              </div>
              <button type="button" className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <h2 className="text-lg text-gray-700 mt-8">Please give us your contact info</h2>

            <div className="space-y-6">
              <div>
                <Label className="text-xs font-medium" style={{ color: config.primaryColor }}>
                  First name
                </Label>
                <Input
                  {...register("firstName")}
                  className="mt-2 border-0 border-b border-gray-200 rounded-none px-0 focus:ring-0 focus:border-transparent"
                  style={{ borderBottomColor: config.primaryColor }}
                  error={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-normal text-gray-700">Last name</Label>
                <Input
                  {...register("lastName")}
                  className="mt-2 border-0 border-b border-gray-200 rounded-none px-0 focus:ring-0 focus:border-transparent"
                  error={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-normal text-gray-700">Email</Label>
                <Input
                  {...register("email")}
                  type="email"
                  className="mt-2 border-0 border-b border-gray-200 rounded-none px-0 focus:ring-0 focus:border-transparent"
                  error={!!errors.email}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-normal text-gray-700">Phone</Label>
                <div className="mt-2 flex items-center gap-3 border-b border-gray-200 pb-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-gray-700"
                  >
                    <span className="text-xs">US</span>
                    <span>+1</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  <Input
                    {...register("phone")}
                    type="tel"
                    className="border-0 rounded-none px-0 py-0 h-8 focus:ring-0 focus:border-transparent"
                    error={!!errors.phone}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={nextStep}
              style={{ backgroundColor: config.primaryColor }}
              className="w-full text-white hover:opacity-90 mt-10"
            >
              CONTINUE
            </Button>
          </div>
        )}

        {/* Step 2: Addresses */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Pickup Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: config.primaryColor }} />
                Pickup Location
              </h3>
              <div className="space-y-4">
                <div>
                  <Label required>Street Address</Label>
                  <Input
                    {...register("pickupStreet")}
                    placeholder="123 Main Street"
                    className="mt-1"
                    error={!!errors.pickupStreet}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Unit/Apt</Label>
                    <Input {...register("pickupUnit")} placeholder="Apt 4B" className="mt-1" />
                  </div>
                  <div>
                    <Label required>City</Label>
                    <Input
                      {...register("pickupCity")}
                      placeholder="New York"
                      className="mt-1"
                      error={!!errors.pickupCity}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>State</Label>
                    <Input
                      {...register("pickupState")}
                      placeholder="NY"
                      className="mt-1"
                      error={!!errors.pickupState}
                    />
                  </div>
                  <div>
                    <Label required>ZIP Code</Label>
                    <Input
                      {...register("pickupZip")}
                      placeholder="10001"
                      className="mt-1"
                      error={!!errors.pickupZip}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Property Type</Label>
                    <Select {...register("pickupPropertyType")} className="mt-1">
                      <option value="">Select type</option>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Floor</Label>
                    <Input
                      {...register("pickupFloor")}
                      type="number"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Checkbox {...register("pickupElevator")} label="Elevator available" />
              </div>
            </div>

            {/* Dropoff Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" style={{ color: config.primaryColor }} />
                Dropoff Location
              </h3>
              <div className="space-y-4">
                <div>
                  <Label required>Street Address</Label>
                  <Input
                    {...register("dropoffStreet")}
                    placeholder="456 Oak Avenue"
                    className="mt-1"
                    error={!!errors.dropoffStreet}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Unit/Apt</Label>
                    <Input {...register("dropoffUnit")} placeholder="Suite 100" className="mt-1" />
                  </div>
                  <div>
                    <Label required>City</Label>
                    <Input
                      {...register("dropoffCity")}
                      placeholder="Los Angeles"
                      className="mt-1"
                      error={!!errors.dropoffCity}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>State</Label>
                    <Input
                      {...register("dropoffState")}
                      placeholder="CA"
                      className="mt-1"
                      error={!!errors.dropoffState}
                    />
                  </div>
                  <div>
                    <Label required>ZIP Code</Label>
                    <Input
                      {...register("dropoffZip")}
                      placeholder="90001"
                      className="mt-1"
                      error={!!errors.dropoffZip}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Property Type</Label>
                    <Select {...register("dropoffPropertyType")} className="mt-1">
                      <option value="">Select type</option>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Floor</Label>
                    <Input
                      {...register("dropoffFloor")}
                      type="number"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Checkbox {...register("dropoffElevator")} label="Elevator available" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Move Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Move Details</h3>

            <Checkbox {...register("flexibleDates")} label="My dates are flexible" />

            <div>
              <Label>Estimated Move Size</Label>
              <Select {...register("estimatedSize")} className="mt-1">
                <option value="">Select size</option>
                {Object.entries(MOVE_SIZE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Inventory Section */}
            {config.enableInventory && (
              <div>
                <h4 className="font-medium mb-3">Inventory (Optional)</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {DEFAULT_INVENTORY_ITEMS.slice(0, 12).map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => addInventoryItem(item.name, item.category)}
                        className="text-left text-sm px-3 py-2 rounded border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {item.name}
                      </button>
                    ))}
                  </div>
                  {inventory.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-medium mb-2">Selected Items:</h5>
                      <div className="space-y-2">
                        {inventory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-white rounded px-3 py-2"
                          >
                            <span className="text-sm">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateInventoryQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateInventoryQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Special Items */}
            {config.enableSpecialItems && (
              <div>
                <h4 className="font-medium mb-3">Special Items</h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SPECIAL_ITEMS.map((item) => {
                    const isSelected = specialItems.some((s) => s.name === item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSpecialItem(item)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isSelected && <X className="w-3 h-3 inline mr-1" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Services */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Additional Services</h3>

            <div className="space-y-3">
              <Checkbox {...register("packingService")} label="Packing Service" />
              <Checkbox {...register("unpackingService")} label="Unpacking Service" />
              <Checkbox {...register("storageNeeded")} label="Storage Needed" />
            </div>

            {storageNeeded && (
              <div>
                <Label>Storage Duration</Label>
                <Select {...register("storageDuration")} className="mt-1">
                  <option value="">Select duration</option>
                  <option value="1_week">1 Week</option>
                  <option value="2_weeks">2 Weeks</option>
                  <option value="1_month">1 Month</option>
                  <option value="2_months">2 Months</option>
                  <option value="3_months">3+ Months</option>
                </Select>
              </div>
            )}

            {/* Insurance Options */}
            {config.enableInsurance && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{ color: config.primaryColor }} />
                  Insurance Coverage
                </h4>
                <div className="space-y-2">
                  {Object.entries(INSURANCE_OPTIONS).map(([value, { label, description }]) => (
                    <label
                      key={value}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300"
                    >
                      <input
                        type="radio"
                        {...register("insuranceOption")}
                        value={value}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-gray-500">{description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {config.customFields.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Additional Information</h4>
                {config.customFields.map((field) => (
                  <div key={field.id}>
                    <Label required={field.required}>{field.label}</Label>
                    {field.type === "text" && (
                      <Input
                        value={(customFieldValues[field.id] as string) || ""}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                        }
                        placeholder={field.placeholder}
                        className="mt-1"
                      />
                    )}
                    {field.type === "textarea" && (
                      <Textarea
                        value={(customFieldValues[field.id] as string) || ""}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                        }
                        placeholder={field.placeholder}
                        className="mt-1"
                      />
                    )}
                    {field.type === "select" && (
                      <Select
                        value={(customFieldValues[field.id] as string) || ""}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })
                        }
                        className="mt-1"
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    )}
                    {field.type === "checkbox" && (
                      <div className="mt-1">
                        <Checkbox
                          checked={!!customFieldValues[field.id]}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.id]: e.target.checked,
                            })
                          }
                          label={field.placeholder || field.label}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                {...register("additionalNotes")}
                placeholder="Any special instructions or requests..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep > 0 && (
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                style={{ backgroundColor: config.primaryColor }}
                className="text-white hover:opacity-90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                style={{ backgroundColor: config.primaryColor }}
                className="text-white hover:opacity-90"
              >
                {config.buttonText}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 0:
      return ["firstName", "lastName", "email", "phone"];
    case 1:
      return [
        "pickupStreet",
        "pickupCity",
        "pickupState",
        "pickupZip",
        "dropoffStreet",
        "dropoffCity",
        "dropoffState",
        "dropoffZip",
      ];
    case 2:
      return ["moveDate"];
    case 3:
      return [];
    default:
      return [];
  }
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstOfMonth.getDay();
  const startDate = new Date(year, monthIndex, 1 - startOffset);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const endOffset = 6 - lastOfMonth.getDay();
  const endDate = new Date(year, monthIndex, lastOfMonth.getDate() + endOffset);
  const days: CalendarDay[] = [];

  for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor);
    days.push({ date, inCurrentMonth: date.getMonth() === monthIndex });
  }

  return days;
}

function formatLocation({
  street,
  city,
  state,
  zip,
  fallback,
}: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  fallback: string;
}): string {
  if (city && state) {
    return `${city}, ${state}${zip ? ` ${zip}` : ""}`;
  }
  if (city) {
    return city;
  }
  if (state) {
    return `${state}${zip ? ` ${zip}` : ""}`;
  }
  if (street) {
    return street;
  }
  return fallback;
}

function getLaborerCountLabel(laborHelpType: LaborHelpType, teamTitle: string): string {
  const match = teamTitle.match(/\d+/);
  const count = match ? match[0] : "2";
  if (laborHelpType === "loading_only") {
    return `${count} Loaders`;
  }
  if (laborHelpType === "unloading_only") {
    return `${count} Unloaders`;
  }
  return `${count} Movers`;
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const hasDecimals = Math.abs(value % 1) > Number.EPSILON;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(value);
}

function formatHourLabel(hours: number, short = false): string {
  const normalized = Number.isFinite(hours) ? hours : 0;
  if (short) {
    return `${normalized} hr`;
  }
  const unit = normalized === 1 ? "hour" : "hours";
  return `${normalized} ${unit}`;
}

function buildTeamOption(
  option: TeamOptionBase,
  pricing: { rate: number; minimumHours: number }
): TeamOptionDisplay {
  const rate = pricing?.rate ?? 0;
  const minimumHours = pricing?.minimumHours ?? 0;
  const minimumShort = `${formatHourLabel(minimumHours, true)} minimum`;
  const minimumLong = `${formatHourLabel(minimumHours)} minimum`;
  return {
    ...option,
    rate,
    minimumHours,
    rateShort: `${formatCurrency(rate)} / hr`,
    detail: `${formatCurrency(rate)}/hour. ${minimumLong}.`,
    minimumShort,
    minimumLong,
  };
}

function getEstimateLaborRange({
  serviceType,
  laborHelpType,
  moveType,
  homeSize,
  storageUnitSize,
  officeHeadcount,
  selectedHours,
  minimumHours,
  pricing,
}: {
  serviceType: ServiceType;
  laborHelpType: LaborHelpType;
  moveType: MoveType;
  homeSize: HomeSize;
  storageUnitSize: StorageUnitSize;
  officeHeadcount: OfficeHeadcount;
  selectedHours: string;
  minimumHours: number;
  pricing: PricingConfig;
}): { minLabor: number; maxLabor: number } {
  const selectedHoursValue = Number(selectedHours);
  if (
    serviceType === "labor_only" &&
    (laborHelpType === "loading_only" || laborHelpType === "unloading_only")
  ) {
    const hours = Number.isFinite(selectedHoursValue) && selectedHoursValue > 0
      ? selectedHoursValue
      : minimumHours;
    const adjustedHours = Math.max(hours, minimumHours);
    return { minLabor: adjustedHours, maxLabor: adjustedHours };
  }

  let range: { minLabor: number; maxLabor: number } | undefined;
  if (moveType === "home" && homeSize) {
    range = pricing.estimateLabor.home[homeSize];
  } else if (moveType === "storage" && storageUnitSize) {
    range = pricing.estimateLabor.storage[storageUnitSize];
  } else if (moveType === "office" && officeHeadcount) {
    range = pricing.estimateLabor.office[officeHeadcount];
  }

  const minLabor = Math.max(range?.minLabor ?? minimumHours, minimumHours);
  const maxLabor = Math.max(range?.maxLabor ?? minLabor, minLabor);
  return { minLabor, maxLabor };
}

function formatEstimateRange(minValue: number, maxValue: number): string {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return formatCurrency(0);
  }
  if (Math.abs(minValue - maxValue) < 0.01) {
    return formatCurrency(maxValue);
  }
  return `${formatCurrency(minValue)}-${formatCurrency(maxValue)}`;
}

function applyPromoDiscount(total: number, promo: PromoDiscount): number {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const value = Number.isFinite(promo.discountValue) ? promo.discountValue : 0;

  if (promo.discountType === "percent") {
    const percent = Math.min(100, Math.max(0, value));
    return Math.max(0, safeTotal * (1 - percent / 100));
  }

  return Math.max(0, safeTotal - Math.max(0, value));
}

function formatPromoLabel(promo: PromoDiscount): string {
  if (promo.discountType === "percent") return `${promo.discountValue}% off`;
  return `${formatCurrency(promo.discountValue)} off`;
}

function getLaborHelpLabel(laborHelpType: LaborHelpType): string {
  if (laborHelpType === "loading_only") {
    return "Loading only";
  }
  if (laborHelpType === "unloading_only") {
    return "Unloading only";
  }
  return "Loading and unloading";
}

function getMoveActivityLabel(serviceType: ServiceType, laborHelpType: LaborHelpType): string {
  if (serviceType !== "labor_only") {
    return "Move (loading, travel, unloading)";
  }
  return `Move (${getLaborHelpLabel(laborHelpType).toLowerCase()})`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRangeLabel(value?: string): string {
  if (!value) return "";
  const option = TIME_OPTIONS.find((entry) => entry.value === value);
  if (!option) return "";
  return option.label;
}

function getMoveSummaryLabel(moveType: MoveType, homeSize: HomeSize): string {
  if (moveType === "home") {
    const sizeLabel = HOME_SIZES.find((size) => size.id === homeSize)?.label;
    return sizeLabel ? `${sizeLabel} home move` : "Home move";
  }
  if (moveType === "office") {
    return "Office move";
  }
  if (moveType === "storage") {
    return "Storage move";
  }
  return "Move";
}

function getMoveTypeSummary(moveType: MoveType, homeSize: HomeSize): string {
  if (moveType === "home") {
    const sizeLabel = HOME_SIZES.find((size) => size.id === homeSize)?.label;
    return sizeLabel ? `${sizeLabel} home` : "Home";
  }
  if (moveType === "office") {
    return "Office move";
  }
  if (moveType === "storage") {
    return "Storage move";
  }
  return "Move";
}

function getTimeSlotDescription(value?: string): string {
  if (!value) return "";
  const option = TIME_OPTIONS.find((entry) => entry.value === value);
  return option ? option.description : "";
}
