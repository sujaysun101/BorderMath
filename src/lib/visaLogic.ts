import { addDays, differenceInDays, differenceInMonths, isAfter, isBefore, isSameDay, subDays, format } from 'date-fns';
import { ItineraryItem, ComplianceResult, UserProfile } from '../types.ts';

/**
 * Calculates Schengen compliance using the 90/180 rolling window rule.
 * 
 * Logic: For any given day, the traveler must not have spent more than 90 days 
 * in the Schengen area within the 180-day period preceding that day.
 */
export function checkSchengenCompliance(itinerary: ItineraryItem[]): ComplianceResult {
  const schengenItems = itinerary.filter(item => item.isSchengen);
  if (schengenItems.length === 0) {
    return { isCompliant: true, overstayDays: 0, notes: ["No Schengen travel detected."] };
  }

  // Sort itinerary by entry date
  const sortedItinerary = [...itinerary].sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
  
  const startDate = sortedItinerary[0].entryDate;
  const endDate = sortedItinerary[sortedItinerary.length - 1].exitDate;
  
  const notes: string[] = [];
  let maxOverstay = 0;
  let criticalDate: Date | undefined;

  // Iterate through each day of the trip
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    // 180-day window ending on day 'd'
    const windowStart = subDays(d, 179);
    
    let daysInSchengen = 0;
    
    // Check how many days in this window were spent in Schengen
    for (const item of sortedItinerary) {
      if (!item.isSchengen) continue;
      
      // Calculate overlap between [item.entryDate, item.exitDate] and [windowStart, d]
      const overlapStart = new Date(Math.max(item.entryDate.getTime(), windowStart.getTime()));
      const overlapEnd = new Date(Math.min(item.exitDate.getTime(), d.getTime()));
      
      if (overlapStart <= overlapEnd) {
        // +1 because entry and exit dates both count as days spent
        daysInSchengen += differenceInDays(overlapEnd, overlapStart) + 1;
      }
    }
    
    if (daysInSchengen > 88) { // 90 days - 2 day buffer for travel delays
      const overstay = daysInSchengen - 88;
      if (overstay > maxOverstay) {
        maxOverstay = overstay;
        criticalDate = new Date(d);
      }
      // Add a note for the first day of overstay found
      if (notes.length === 0 || !notes.some(n => n.includes('Schengen buffer'))) {
        notes.push(`Schengen limit (including 2-day safety buffer) exceeded starting around ${d.toLocaleDateString()}. You have spent ${daysInSchengen} days in the previous 180-day window.`);
      }
    }
  }

  if (maxOverstay > 0) {
    notes.push(`Critical: You have exceeded the 88-day safety limit by ${maxOverstay} days.`);
    if (criticalDate) {
      notes.push(`The 88-day threshold was exceeded on ${criticalDate.toLocaleDateString()} for the 180-day window starting ${subDays(criticalDate, 179).toLocaleDateString()}.`);
    }
    return { isCompliant: false, overstayDays: maxOverstay, criticalDate, notes };
  }

  return { isCompliant: true, overstayDays: 0, notes: ["Schengen compliance verified (88-day safety limit applied)."] };
}

/**
 * Checks for passport expiry risks based on the 6-month rule and user threshold.
 */
export function checkPassportCompliance(profile: UserProfile): { isCritical: boolean; isWarning: boolean; monthsRemaining: number } {
  if (!profile.passportExpiry) return { isCritical: false, isWarning: false, monthsRemaining: 999 };

  const expiry = new Date(profile.passportExpiry);
  const now = new Date();
  const monthsRemaining = differenceInMonths(expiry, now);

  return {
    isCritical: monthsRemaining < 6,
    isWarning: monthsRemaining < profile.passportAlertThresholdMonths,
    monthsRemaining
  };
}

/**
 * Calculates stay compliance for a specific country based on its individual limit.
 */
export function checkCountryStayCompliance(itinerary: ItineraryItem[], countryCode: string): ComplianceResult {
  const countryLegs = itinerary.filter(leg => leg.countryCode === countryCode);
  if (countryLegs.length === 0) return { isCompliant: true, overstayDays: 0, notes: [] };

  let totalOverstay = 0;
  const notes: string[] = [];

  for (const leg of countryLegs) {
    const limit = leg.stayLimitDays || 90; // Default to 90 if not specified
    const stayDuration = differenceInDays(leg.exitDate, leg.entryDate) + 1;
    
    if (stayDuration > limit) {
      const overstay = stayDuration - limit;
      totalOverstay += overstay;
      notes.push(`Overstay in ${leg.countryName}: ${stayDuration} days stay exceeds your ${limit}-day limit (${format(leg.entryDate, 'MMM dd')} - ${format(leg.exitDate, 'MMM dd')}).`);
    }
  }

  return {
    isCompliant: totalOverstay === 0,
    overstayDays: totalOverstay,
    notes
  };
}

/**
 * Calculates cumulative stay logic (e.g., USA 180 days per year).
 */
export function checkCumulativeStay(itinerary: ItineraryItem[], countryCode: string, limitDays: number): ComplianceResult {
  const countryItems = itinerary.filter(item => item.countryCode === countryCode);
  if (countryItems.length === 0) return { isCompliant: true, overstayDays: 0, notes: [] };

  const years = new Set(itinerary.flatMap(item => [item.entryDate.getFullYear(), item.exitDate.getFullYear()]));
  
  let maxOverstay = 0;
  const notes: string[] = [];

  for (const year of years) {
    let daysInYear = 0;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    for (const item of countryItems) {
      const overlapStart = new Date(Math.max(item.entryDate.getTime(), yearStart.getTime()));
      const overlapEnd = new Date(Math.min(item.exitDate.getTime(), yearEnd.getTime()));

      if (overlapStart <= overlapEnd) {
        daysInYear += differenceInDays(overlapEnd, overlapStart) + 1;
      }
    }

    if (daysInYear > limitDays) {
      maxOverstay = Math.max(maxOverstay, daysInYear - limitDays);
      notes.push(`Overstay in ${countryCode} for year ${year}: ${daysInYear - limitDays} days over the ${limitDays} limit.`);
    }
  }

  return {
    isCompliant: maxOverstay === 0,
    overstayDays: maxOverstay,
    notes
  };
}

/**
 * Checks trip legs against passport and stored visas for validity.
 */
export function checkItineraryValidityAgainstDocuments(
  itinerary: ItineraryItem[], 
  profile?: UserProfile, 
  visas: any[] = []
): { id: string; type: 'passport' | 'visa'; message: string; severity: 'critical' | 'warning' }[] {
  const issues: { id: string; type: 'passport' | 'visa'; message: string; severity: 'critical' | 'warning' }[] = [];

  itinerary.forEach(leg => {
    // Passport check
    if (profile?.passportExpiry) {
      const passportExpiry = new Date(profile.passportExpiry);
      const sixMonthsBeforeExpiry = subDays(passportExpiry, 180);
      const customThresholdBeforeExpiry = subDays(passportExpiry, (profile.passportAlertThresholdMonths || 9) * 30);

      if (isAfter(leg.entryDate, passportExpiry)) {
        issues.push({ 
          id: leg.id, 
          type: 'passport', 
          message: `CRITICAL: Your passport will be expired when you enter ${leg.countryName} (Expires ${format(passportExpiry, 'MMM dd, yyyy')}).`, 
          severity: 'critical' 
        });
      } else if (isAfter(leg.exitDate, passportExpiry)) {
        issues.push({ 
          id: leg.id, 
          type: 'passport', 
          message: `CRITICAL: Your passport expires DURING your stay in ${leg.countryName} (Expires ${format(passportExpiry, 'MMM dd, yyyy')}).`, 
          severity: 'critical' 
        });
      } else if (isAfter(leg.entryDate, sixMonthsBeforeExpiry)) {
        issues.push({ 
          id: leg.id, 
          type: 'passport', 
          message: `WARNING: Entry to ${leg.countryName} is within 6 months of passport expiry. Many countries require 6 months validity.`, 
          severity: 'warning' 
        });
      } else if (isAfter(leg.entryDate, customThresholdBeforeExpiry)) {
        issues.push({ 
          id: leg.id, 
          type: 'passport', 
          message: `ALERT: Entry to ${leg.countryName} is within your personal alert threshold (${profile.passportAlertThresholdMonths} months).`, 
          severity: 'warning' 
        });
      }
    }

    // Visa check
    const relevantVisas = visas.filter(v => v.countryCode === leg.countryCode);
    if (relevantVisas.length > 0) {
      const validVisa = relevantVisas.find(v => {
        const expiry = new Date(v.expiryDate);
        return isAfter(expiry, leg.exitDate);
      });

      if (!validVisa) {
        issues.push({ 
          id: leg.id, 
          type: 'visa', 
          message: `WARNING: No valid visa found in vault for ${leg.countryName}. Your stay ends ${format(leg.exitDate, 'MMM dd, yyyy')}.`, 
          severity: 'warning' 
        });
      }
    }
  });

  return issues;
}

/**
 * Generates a timeline of Schengen usage days for visualization.
 */
export function getSchengenTimelineData(itinerary: ItineraryItem[]): { date: string, daysSpent: number }[] {
  const sortedItinerary = [...itinerary].sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
  if (sortedItinerary.length === 0) return [];

  const startDate = sortedItinerary[0].entryDate;
  const endDate = sortedItinerary[sortedItinerary.length - 1].exitDate;
  const data: { date: string, daysSpent: number }[] = [];

  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    const windowStart = subDays(d, 179);
    let daysInSchengen = 0;

    for (const item of sortedItinerary) {
      if (!item.isSchengen) continue;
      const overlapStart = new Date(Math.max(item.entryDate.getTime(), windowStart.getTime()));
      const overlapEnd = new Date(Math.min(item.exitDate.getTime(), d.getTime()));
      if (overlapStart <= overlapEnd) {
        daysInSchengen += differenceInDays(overlapEnd, overlapStart) + 1;
      }
    }

    data.push({
      date: format(d, 'MMM dd'),
      daysSpent: daysInSchengen
    });
  }

  // Sample data to make the chart readable (every few days if too many)
  if (data.length > 50) {
    return data.filter((_, i) => i % Math.ceil(data.length / 30) === 0);
  }

  return data;
}

/**
 * Suggests a "Non-Schengen Pivot" if the user is overstaying in Schengen.
 */
export function suggestNonSchengenPivot(itinerary: ItineraryItem[]): string[] {
  const pivots = ["Cyprus", "Turkey", "Georgia", "Albania", "Montenegro", "United Kingdom", "Ireland"];
  return pivots;
}
