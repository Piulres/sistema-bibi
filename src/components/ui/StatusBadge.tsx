import { cn } from "@/lib/utils/cn";
import {
  appointmentStatusClass,
  companyStatusClass,
  invoiceStatusClass,
  statusBadgeClass,
  subscriptionStatusClass,
  timelineActionClass,
} from "@/lib/theme/status-styles";

type StatusMap = "appointment" | "invoice" | "company" | "timeline" | "subscription";

const maps: Record<StatusMap, Record<string, string>> = {
  appointment: appointmentStatusClass,
  invoice: invoiceStatusClass,
  company: companyStatusClass,
  timeline: timelineActionClass,
  subscription: subscriptionStatusClass,
};

type Props = {
  value: string;
  map?: StatusMap;
  label?: string;
  className?: string;
};

export default function StatusBadge({ value, map = "appointment", label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusBadgeClass(maps[map], value),
        className,
      )}
    >
      {label ?? value.replaceAll("_", " ")}
    </span>
  );
}
