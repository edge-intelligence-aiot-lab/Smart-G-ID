import { ContactInteraction } from "@/types/database";

const STORAGE_KEY = "smart_gid_buyer_inquiries";

/**
 * Retrieves all stored buyer-farmer contact interactions from localStorage.
 * Safe for Next.js SSR (returns empty array if window is undefined).
 */
export function getContactInteractions(): ContactInteraction[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to parse inquiry history from localStorage:", err);
    return [];
  }
}

/**
 * Saves a new contact interaction to localStorage.
 * Deduplicates by goatId, moving the most recent contact to the top.
 */
export function saveContactInteraction(interaction: ContactInteraction): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getContactInteractions();
    // Remove previous entry for this goat if exists
    const filtered = existing.filter((item) => item.goatId !== interaction.goatId);
    // Add to top of list
    const updated = [interaction, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event so listeners (e.g. Header badge) update immediately
    window.dispatchEvent(new Event("smart-gid-inquiry-updated"));
  } catch (err) {
    console.error("Failed to save contact interaction to localStorage:", err);
  }
}

/**
 * Checks if a specific goat's contact number was already revealed in this browser.
 */
export function isGoatContactRevealed(goatId: string): boolean {
  if (typeof window === "undefined") return false;
  const interactions = getContactInteractions();
  return interactions.some((item) => item.goatId === goatId);
}

/**
 * Removes a single goat from the interaction history.
 */
export function removeContactInteraction(goatId: string): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getContactInteractions();
    const updated = existing.filter((item) => item.goatId !== goatId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("smart-gid-inquiry-updated"));
  } catch (err) {
    console.error("Failed to remove contact interaction:", err);
  }
}

/**
 * Clears the entire inquiry history.
 */
export function clearContactInteractions(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("smart-gid-inquiry-updated"));
  } catch (err) {
    console.error("Failed to clear inquiry history:", err);
  }
}
