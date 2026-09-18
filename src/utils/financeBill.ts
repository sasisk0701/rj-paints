import { settingsService } from "@/services/api";
import type { Toggle } from "@/types/types";
import type { ShopBillBusiness } from "@/utils/billPdf";

export interface FinanceBillSettings {
  business: ShopBillBusiness;
  footerNote?: string;
  terms?: string;
}

export async function getFinanceBillSettings(toggle: Toggle): Promise<FinanceBillSettings> {
  const settings = await settingsService.getSettings();
  const prefix = toggle === "paints" ? "paints" : "interiors";
  const fallbackName = toggle === "paints"
    ? "RJ Paints & Hardwares"
    : "Styleo Interiors & Construction Works";

  return {
    business: {
      name: settings[`${prefix}_company_name`] || fallbackName,
      address: settings[`${prefix}_address`],
      phone: settings[`${prefix}_phone`] || settings["paints_phone"],
      email: settings[`${prefix}_email`],
      gstNumber: settings[`${prefix}_gst`],
      website: settings[`${prefix}_website`],
      proprietor: settings["owner_name"],
    },
    footerNote: settings["invoice_footer_note"],
    terms: settings["invoice_terms"],
  };
}

export const combinedBillNumber = (prefix: string) =>
  `${prefix}-${Date.now().toString().slice(-8)}`;

export const combinedBillDate = (dates: string[]) => {
  const uniqueDates = Array.from(new Set(dates.filter(Boolean)));
  if (uniqueDates.length === 0) return "-";
  if (uniqueDates.length === 1) return uniqueDates[0];
  return "Multiple dates";
};
