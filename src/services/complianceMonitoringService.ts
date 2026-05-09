import { RegulationChange } from '../types';

export async function fetchRegulationChanges(userCitizenships: string[]): Promise<RegulationChange[]> {
  const REGULATION_DATABASE: RegulationChange[] = [
    {
      id: 'reg_2026_001',
      countryCode: 'TH',
      title: 'Destination Thailand Visa (DTV) Expansion',
      description: 'The 180-day remote work visa now includes additional professional categories.',
      severity: 'informational',
      dateDetected: new Date('2026-03-15'),
      impactedCitizenships: ['US', 'GB', 'DE', 'IN', 'AU', 'CA']
    },
    {
      id: 'reg_2026_002',
      countryCode: 'EU',
      title: 'EES Biometric Entry/Exit System Live',
      description: 'Automated logging of all entries and exits in Schengen area. Rolling window math will be strictly enforced via biometric data.',
      severity: 'critical',
      dateDetected: new Date('2026-05-01'),
      impactedCitizenships: ['US', 'CA', 'AU', 'GB', 'NZ']
    },
    {
      id: 'reg_2026_003',
      countryCode: 'VN',
      title: '90-Day Multiple Entry E-Visa Standardized',
      description: 'Vietnam has formalized the 90-day multiple entry e-visa for 80 countries including India and China.',
      severity: 'informational',
      dateDetected: new Date('2026-04-10'),
      impactedCitizenships: ['IN', 'CN', 'US', 'GB']
    },
    {
      id: 'reg_2026_004',
      countryCode: 'MY',
      title: 'Digital Nomad DE RANTAU Pass Refresh',
      description: 'Income requirements for the professional remote work pass have been adjusted for 2026.',
      severity: 'warning',
      dateDetected: new Date('2026-02-20'),
      impactedCitizenships: ['US', 'GB', 'DE', 'AU']
    }
  ];

  // Simulate remote verification
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return REGULATION_DATABASE.filter(change => 
    change.impactedCitizenships.some(c => userCitizenships.includes(c))
  );
}
