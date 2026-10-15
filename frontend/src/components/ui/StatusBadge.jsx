import React from "react";
import Badge from "./Badge";

/**
 * Standardized status badges across Appointments, Orders, and Prescriptions
 */
export function StatusBadge({ type = "appointment", status = "", size = "md", className = "" }) {
  const normStatus = (status || "").toLowerCase().trim();

  let variant = "default";
  let label = status || "Unknown";

  if (type === "appointment") {
    switch (normStatus) {
      case "confirmed":
        variant = "success";
        label = "Confirmed";
        break;
      case "scheduled":
      case "pending":
        variant = "warning";
        label = "Scheduled";
        break;
      case "in_progress":
      case "in progress":
        variant = "brand";
        label = "In Progress";
        break;
      case "completed":
        variant = "default";
        label = "Completed";
        break;
      case "cancelled":
        variant = "danger";
        label = "Cancelled";
        break;
      default:
        variant = "default";
        label = status || "Scheduled";
    }
  } else if (type === "order") {
    switch (normStatus) {
      case "delivered":
        variant = "success";
        label = "Delivered";
        break;
      case "dispatched":
      case "shipped":
        variant = "info";
        label = "Dispatched";
        break;
      case "processing":
      case "dispensed":
        variant = "brand";
        label = normStatus === "dispensed" ? "Dispensed" : "Processing";
        break;
      case "confirmed":
        variant = "info";
        label = "Confirmed";
        break;
      case "pending":
        variant = "warning";
        label = "Pending";
        break;
      case "cancelled":
        variant = "danger";
        label = "Cancelled";
        break;
      default:
        variant = "default";
        label = status || "Processing";
    }
  } else if (type === "prescription") {
    switch (normStatus) {
      case "active":
        variant = "success";
        label = "Active";
        break;
      case "completed":
        variant = "default";
        label = "Completed";
        break;
      case "expired":
        variant = "warning";
        label = "Expired";
        break;
      case "cancelled":
        variant = "danger";
        label = "Cancelled";
        break;
      default:
        variant = "brand";
        label = status || "Active";
    }
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
}

export default StatusBadge;
