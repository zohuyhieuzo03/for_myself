/**
 * Utility functions for date and time formatting
 */

/**
 * Format a UTC datetime string to Vietnamese local time
 */
export function formatDateTime(utcDateTimeString: string): string {
    if (!utcDateTimeString) return 'N/A';
    
    try {
      // Đảm bảo string luôn có Z để JS hiểu đây là UTC
      const normalized = utcDateTimeString.endsWith('Z')
        ? utcDateTimeString
        : utcDateTimeString + 'Z';
  
      const date = new Date(normalized);
      
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', // VN timezone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'Invalid Date';
    }
  }
  
  /**
   * Format a UTC datetime string to a shorter format (HH:mm dd/MM/yyyy)
   */
  export function formatDateTimeShort(utcDateTimeString: string): string {
    if (!utcDateTimeString) return 'N/A';
    
    try {
      const normalized = utcDateTimeString.endsWith('Z')
        ? utcDateTimeString
        : utcDateTimeString + 'Z';
  
      const date = new Date(normalized);
      
      if (isNaN(date.getTime())) return 'Invalid Date';
  
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'Invalid Date';
    }
  }
  