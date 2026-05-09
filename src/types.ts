export type VisaRequirementType = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' | 'e-voa';

export interface ItineraryItem {
  id: string;
  countryCode: string;
  countryName: string;
  entryDate: Date;
  exitDate: Date;
  transportType: 'air' | 'land' | 'sea';
  isSchengen: boolean;
  visaRequirement?: VisaRequirementType;
  stayLimitDays?: number;
  estimatedCost?: number;
  visaNotes?: string;
}

export interface UserProfile {
  uid: string;
  citizenships: string[];
  residencies: string[];
  passportNumber?: string;
  passportExpiry?: Date;
  passportAlertThresholdMonths: number; // User-definable alert period
  passportCopyUrl?: string;
}

export interface Visa {
  id: string;
  uid: string;
  countryCode: string;
  visaType: string;
  expiryDate: Date;
  documentUrl?: string;
}

export interface Trip {
  id: string;
  uid: string;
  name: string;
  itinerary: ItineraryItem[];
  isCompliant: boolean;
  complianceNotes: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  overstayDays: number;
  criticalDate?: Date;
  notes: string[];
}

export interface RegulationChange {
  id: string;
  countryCode: string;
  title: string;
  description: string;
  severity: 'critical' | 'informational' | 'warning';
  dateDetected: Date;
  impactedCitizenships: string[];
}

export interface VisaApplication {
  id: string;
  uid: string;
  countryCode: string;
  visaType: string;
  applicationDate: Date;
  expectedDecisionDate?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  caseNumber?: string;
  notes?: string;
}

export interface ExchangeRate {
  code: string;
  rate: number;
  name: string;
  symbol: string;
}
