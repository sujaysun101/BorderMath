import { VisaRequirementType } from '../types.ts';

/**
 * Mock Visa API Service.
 * In a production environment, this would integrate with IATA, Sherpa, or SkyScanner.
 */
export interface VisaRequirementData {
  type: VisaRequirementType;
  stayLimitDays: number;
  notes: string;
  estimatedCost: number; // in USD
  portalUrl?: string;
}

const MOCK_VISA_DATABASE: Record<string, Record<string, VisaRequirementData>> = {
  'US': { // US Citizen
    'FR': { type: 'visa-free', stayLimitDays: 90, notes: 'Schengen Area rules apply.', estimatedCost: 0 },
    'TH': { type: 'visa-on-arrival', stayLimitDays: 30, notes: 'Available at major airports.', estimatedCost: 60, portalUrl: 'https://www.thaievisa.go.th/' },
    'VN': { type: 'e-visa', stayLimitDays: 30, notes: 'Must apply 3 days in advance.', estimatedCost: 25, portalUrl: 'https://evisa.xuatnhapcanh.gov.vn/' },
    'CN': { type: 'visa-required', stayLimitDays: 30, notes: 'Requires embassy visit.', estimatedCost: 140, portalUrl: 'https://www.visaforchina.cn/' },
    'TR': { type: 'e-visa', stayLimitDays: 90, notes: 'Apply at evisa.gov.tr', estimatedCost: 50, portalUrl: 'https://www.evisa.gov.tr/' },
    'GE': { type: 'visa-free', stayLimitDays: 365, notes: '1 year visa-free for US citizens.', estimatedCost: 0, portalUrl: 'https://www.evisa.gov.ge/' },
    'MY': { type: 'visa-free', stayLimitDays: 90, notes: 'Tourist visit up to 90 days.', estimatedCost: 0 },
    'ID': { type: 'e-voa', stayLimitDays: 30, notes: 'Upgradeable once for another 30 days.', estimatedCost: 35, portalUrl: 'https://molina.imigrasi.go.id/' }
  },
  'IN': { // Indian Citizen
    'TH': { type: 'visa-on-arrival', stayLimitDays: 15, notes: 'Fee applies.', estimatedCost: 60, portalUrl: 'https://www.thaievisa.go.th/' },
    'VN': { type: 'e-visa', stayLimitDays: 30, notes: 'Apply online.', estimatedCost: 25, portalUrl: 'https://evisa.xuatnhapcanh.gov.vn/' },
    'FR': { type: 'visa-required', stayLimitDays: 90, notes: 'Schengen Visa required.', estimatedCost: 85, portalUrl: 'https://france-visas.gouv.fr/' },
    'GE': { type: 'e-visa', stayLimitDays: 90, notes: 'Apply via Georgia e-visa portal.', estimatedCost: 20, portalUrl: 'https://www.evisa.gov.ge/' },
    'TR': { type: 'visa-required', stayLimitDays: 30, notes: 'Embassy visit required unless holding valid US/UK/Schengen visa.', estimatedCost: 60, portalUrl: 'https://www.evisa.gov.tr/' },
    'MY': { type: 'visa-free', stayLimitDays: 30, notes: 'Visa-free entry for up to 30 days (as of 2024 policy).', estimatedCost: 0 },
    'ID': { type: 'visa-on-arrival', stayLimitDays: 30, notes: 'Pay at the counter upon arrival.', estimatedCost: 35 }
  },
  'GB': { // UK Citizen
    'FR': { type: 'visa-free', stayLimitDays: 90, notes: 'Schengen Area rules apply.', estimatedCost: 0 },
    'TH': { type: 'visa-free', stayLimitDays: 30, notes: 'Exemption for UK citizens.', estimatedCost: 0 },
    'VN': { type: 'visa-free', stayLimitDays: 45, notes: 'UK citizens enjoy 45 days visa-free entry.', estimatedCost: 0 },
    'TR': { type: 'visa-free', stayLimitDays: 90, notes: 'UK citizens enjoy 90 days visa-free entry.', estimatedCost: 0 },
    'ID': { type: 'e-voa', stayLimitDays: 30, notes: 'Apply online before arrival.', estimatedCost: 35, portalUrl: 'https://molina.imigrasi.go.id/' }
  }
};

export async function fetchVisaRequirement(citizenships: string[], destination: string): Promise<VisaRequirementData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const results: VisaRequirementData[] = [];

  for (const citizenship of citizenships) {
    const countryData = MOCK_VISA_DATABASE[citizenship];
    if (countryData && countryData[destination]) {
      results.push(countryData[destination]);
    } else {
      results.push({
        type: 'visa-required',
        stayLimitDays: 30,
        notes: 'Please check with the local embassy for requirements.',
        estimatedCost: 100
      });
    }
  }

  if (results.length === 0) {
    return {
      type: 'visa-required',
      stayLimitDays: 30,
      notes: 'Please check with the local embassy for requirements.',
      estimatedCost: 100
    };
  }

  // Rank requirements: visa-free (0) > visa-on-arrival (1) > e-visa (2) > visa-required (3)
  const rank = (type: VisaRequirementType) => {
    switch (type) {
      case 'visa-free': return 0;
      case 'visa-on-arrival': return 1;
      case 'e-visa': return 2;
      case 'visa-required': return 3;
      default: return 4;
    }
  };

  return results.sort((a, b) => rank(a.type) - rank(b.type))[0];
}
