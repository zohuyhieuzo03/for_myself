/**
 * Utility functions for date and time formatting
 */

/**
 * Format a Date object to YYYY-MM-DD string format (local timezone)
 */
export function formatDate(date: Date): string {
  if (!date) return ""

  try {
    // Use local timezone formatting instead of UTC to avoid date shifting
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}

/**
 * Format date string to Vietnamese local format (dd/MM/yyyy)
 */
export function formatDateLocal(dateString: string): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "Invalid Date"

    return date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

/**
 * Format a UTC datetime string to Vietnamese local time
 */
export function formatDateTime(utcDateTimeString: string): string {
  if (!utcDateTimeString) return "N/A"

  try {
    const date = new Date(utcDateTimeString)

    if (Number.isNaN(date.getTime())) return "Invalid Date"

    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh", // VN timezone
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "Invalid Date"
  }
}

/**
 * Format a UTC datetime string to a shorter format (HH:mm dd/MM/yyyy)
 */
export function formatDateTimeShort(utcDateTimeString: string): string {
  if (!utcDateTimeString) return "N/A"

  try {
    const date = new Date(utcDateTimeString)

    if (Number.isNaN(date.getTime())) return "Invalid Date"

    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "Invalid Date"
  }
}
