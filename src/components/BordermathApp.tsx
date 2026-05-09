import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle, MapPin, Calendar, Plane, Info, User, LogIn, LogOut, Shield, Search, X, HelpCircle, ChevronRight, CheckCircle2, FileText, Bell, CreditCard, RefreshCw, Activity, Globe, Zap } from 'lucide-react';
import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import { ItineraryItem, ComplianceResult, UserProfile, Visa, RegulationChange, VisaApplication } from '../types';
import { checkSchengenCompliance, checkCountryStayCompliance, checkPassportCompliance, checkItineraryValidityAgainstDocuments } from '../lib/visaLogic';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import DocumentVault from './DocumentVault';
import { fetchVisaRequirement } from '../services/visaApiService';
import { fetchRegulationChanges } from '../services/complianceMonitoringService';
import CurrencyConverter from './CurrencyConverter';
import ComplianceHistoryChart from './ComplianceHistoryChart';

export const ALL_COUNTRIES = [
   { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' }, { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' }, { code: 'AQ', name: 'Antarctica' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AW', name: 'Aruba' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' }, { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' }, { code: 'BM', name: 'Bermuda' },
  { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' }, { code: 'BV', name: 'Bouvet Island' }, { code: 'BR', name: 'Brazil' },
  { code: 'IO', name: 'British Indian Ocean Territory' }, { code: 'BN', name: 'Brunei Darussalam' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
  { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' },
  { code: 'CV', name: 'Cape Verde' }, { code: 'KY', name: 'Cayman Islands' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CX', name: 'Christmas Island' }, { code: 'CC', name: 'Cocos (Keeling) Islands' }, { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' }, { code: 'CD', name: 'Congo, the Democratic Republic of the' },
  { code: 'CK', name: 'Cook Islands' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: 'Cote d\'Ivoire' },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'FK', name: 'Falkland Islands (Malvinas)' }, { code: 'FO', name: 'Faroe Islands' }, { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'GF', name: 'French Guiana' },
  { code: 'PF', name: 'French Polynesia' }, { code: 'TF', name: 'French Southern Territories' }, { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' }, { code: 'GI', name: 'Gibraltar' }, { code: 'GR', name: 'Greece' },
  { code: 'GL', name: 'Greenland' }, { code: 'GD', name: 'Grenada' }, { code: 'GP', name: 'Guadeloupe' },
  { code: 'GU', name: 'Guam' }, { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' },
  { code: 'HM', name: 'Heard Island and McDonald Islands' }, { code: 'VA', name: 'Holy See (Vatican City State)' }, { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran, Islamic Republic of' },
  { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' }, { code: 'KP', name: 'Korea, Democratic People\'s Republic of' }, { code: 'KR', name: 'Korea, Republic of' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Lao People\'s Democratic Republic' },
  { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libyan Arab Jamahiriya' }, { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MO', name: 'Macao' },
  { code: 'MK', name: 'Macedonia, the Former Yugoslav Republic of' }, { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' }, { code: 'MH', name: 'Marshall Islands' }, { code: 'MQ', name: 'Martinique' },
  { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' }, { code: 'YT', name: 'Mayotte' },
  { code: 'MX', name: 'Mexico' }, { code: 'FM', name: 'Micronesia, Federated States of' }, { code: 'MD', name: 'Moldova, Republic of' },
  { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' }, { code: 'MS', name: 'Montserrat' },
  { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' }, { code: 'AN', name: 'Netherlands Antilles' }, { code: 'NC', name: 'New Caledonia' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' }, { code: 'NU', name: 'Niue' }, { code: 'NF', name: 'Norfolk Island' },
  { code: 'MP', name: 'Northern Mariana Islands' }, { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' }, { code: 'PS', name: 'Palestinian Territory, Occupied' },
  { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PN', name: 'Pitcairn' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'QA', name: 'Qatar' }, { code: 'RE', name: 'Reunion' }, { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russian Federation' }, { code: 'RW', name: 'Rwanda' }, { code: 'SH', name: 'Saint Helena' },
  { code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'LC', name: 'Saint Lucia' }, { code: 'PM', name: 'Saint Pierre and Miquelon' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' }, { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'Sao Tome and Principe' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' },
  { code: 'CS', name: 'Serbia and Montenegro' }, { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'GS', name: 'South Georgia and the South Sandwich Islands' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SJ', name: 'Svalbard and Jan Mayen' },
  { code: 'SZ', name: 'Swaziland' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syrian Arab Republic' }, { code: 'TW', name: 'Taiwan, Province of China' }, { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania, United Republic of' }, { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' }, { code: 'TK', name: 'Tokelau' }, { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TC', name: 'Turks and Caicos Islands' }, { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'UM', name: 'United States Minor Outlying Islands' },
  { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' }, { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Viet Nam' }, { code: 'VG', name: 'Virgin Islands, British' },
  { code: 'VI', name: 'Virgin Islands, U.s.' }, { code: 'WF', name: 'Wallis and Futuna' }, { code: 'EH', name: 'Western Sahara' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' }
];

const SCHENGEN_COUNTRIES = [
  'Austria', 'Belgium', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Croatia'
];

const NON_SCHENGEN_PIVOTS = ['Cyprus', 'Turkey', 'Georgia', 'Albania', 'Montenegro', 'United Kingdom', 'Ireland', 'Serbia', 'Bosnia and Herzegovina'];

interface BordermathAppProps {
  currentUser: any;
}

export default function BordermathApp({ currentUser }: BordermathAppProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [compliance, setCompliance] = useState<ComplianceResult>({ isCompliant: true, overstayDays: 0, notes: [] });
  const [user, setUser] = useState<any>(currentUser);
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [visas, setVisas] = useState<Visa[]>([]);
  const [visaApplications, setVisaApplications] = useState<VisaApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'vault' | 'tools'>('itinerary');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [regulationChanges, setRegulationChanges] = useState<RegulationChange[]>([]);
  const [isRegulationLoading, setIsRegulationLoading] = useState(false);
  const [isFetchingVisa, setIsFetchingVisa] = useState(false);
  const [lastVisaUpdate, setLastVisaUpdate] = useState<Date | null>(null);

  // Check if it's the first time
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('bordermath_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (profile?.citizenships) {
      setIsRegulationLoading(true);
      fetchRegulationChanges(profile.citizenships).then(changes => {
        setRegulationChanges(changes);
        setIsRegulationLoading(false);
      });
    }
  }, [profile?.citizenships]);

  // Fetch Visa Applications
  useEffect(() => {
    if (profile?.uid) {
      const q = query(collection(db, 'visaApplications'), where('uid', '==', profile.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          applicationDate: (doc.data().applicationDate as any)?.toDate?.() || new Date(doc.data().applicationDate),
          expectedDecisionDate: (doc.data().expectedDecisionDate as any)?.toDate?.() || (doc.data().expectedDecisionDate ? new Date(doc.data().expectedDecisionDate) : undefined)
        })) as VisaApplication[];
        setVisaApplications(apps);
      });
      return unsubscribe;
    }
  }, [profile?.uid]);

  const completeOnboarding = () => {
    localStorage.setItem('bordermath_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const onboardingSteps = [
    {
      title: "Welcome to Bordermath",
      description: "Your intelligent companion for navigating complex visa rules and stay limits across the globe.",
      icon: <Shield className="text-blue-500" size={48} />
    },
    {
      title: "Plan Your Itinerary",
      description: "Add countries and dates. We'll automatically calculate your stay limits and check Schengen 90/180 compliance in real-time.",
      icon: <MapPin className="text-orange-500" size={48} />
    },
    {
      title: "Manage Your Documents",
      description: "Store your passport and visas in the Document Vault. We'll alert you before they expire so you're never caught off guard.",
      icon: <FileText className="text-green-500" size={48} />
    },
    {
      title: "Regional Strategy Engine",
      description: "Manage complex stay limits across different jurisdictions. From Schengen 90/180 rules to US/UK annual limits, we calculate'em all.",
      icon: <CheckCircle2 className="text-purple-500" size={48} />
    }
  ];

  useEffect(() => {
    const u = currentUser;
    setUser(u);
    if (u) {
      // Load profile
      const profileRef = doc(db, 'users', u.uid);
      const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      });

      // Load visas
      const visasQuery = query(collection(db, 'visas'), where('uid', '==', u.uid));
      const unsubscribeVisas = onSnapshot(visasQuery, (snapshot) => {
        setVisas(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Visa)));
      });

      return () => {
        unsubscribeProfile();
        unsubscribeVisas();
      };
    }
  }, [currentUser]);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);
  const saveTrip = async () => {
    if (!user) {
      login();
      return;
    }
    try {
      const tripData = {
        uid: user.uid,
        name: `Trip to ${itinerary[0]?.countryName || 'Unknown'}`,
        itinerary: itinerary.map(leg => ({
          ...leg,
          entryDate: format(leg.entryDate, 'yyyy-MM-dd'),
          exitDate: format(leg.exitDate, 'yyyy-MM-dd')
        })),
        isCompliant: compliance.isCompliant,
        complianceNotes: compliance.notes.join('\n'),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'trips'), tripData);
      alert('Trip saved successfully!');
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const addLeg = () => {
    const lastLeg = itinerary[itinerary.length - 1];
    const entryDate = lastLeg ? addDays(lastLeg.exitDate, 1) : new Date();
    const exitDate = addDays(entryDate, 14);
    
    const newLeg: ItineraryItem = {
      id: Math.random().toString(36).substr(2, 9),
      countryCode: 'FR',
      countryName: 'France',
      entryDate,
      exitDate,
      transportType: 'air',
      isSchengen: true
    };
    setItinerary([...itinerary, newLeg]);
  };

  const removeLeg = (id: string) => {
    setItinerary(itinerary.filter(leg => leg.id !== id));
  };

  const updateLeg = async (id: string, updates: Partial<ItineraryItem>) => {
    const leg = itinerary.find(l => l.id === id);
    if (!leg) return;

    const newLeg = { ...leg, ...updates };
    
    // If country changed, fetch visa requirements
    if (updates.countryName && profile?.citizenships?.length) {
      setIsFetchingVisa(true);
      try {
        const req = await fetchVisaRequirement(profile.citizenships, newLeg.countryCode);
        newLeg.visaRequirement = req.type;
        newLeg.stayLimitDays = req.stayLimitDays || 90;
        newLeg.estimatedCost = req.estimatedCost;
        newLeg.visaNotes = req.notes;
        setLastVisaUpdate(new Date());
      } catch (e) {
        console.error('Visa API Error:', e);
        newLeg.stayLimitDays = 90; // Default fallback
      } finally {
        setIsFetchingVisa(false);
      }
    }

    setItinerary(itinerary.map(l => l.id === id ? newLeg : l));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(itinerary);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setItinerary(items);
  };

  const addCitizenship = async (code: string) => {
    if (!profile || profile.citizenships.includes(code)) return;
    const newCitizenships = [...profile.citizenships, code];
    await updateDoc(doc(db, 'users', profile.uid), { citizenships: newCitizenships });
  };

  const removeCitizenship = async (code: string) => {
    if (!profile || profile.citizenships.length <= 1) return;
    const newCitizenships = profile.citizenships.filter(c => c !== code);
    await updateDoc(doc(db, 'users', profile.uid), { citizenships: newCitizenships });
  };

  useEffect(() => {
    if (itinerary.length > 0) {
      const schengenResult = checkSchengenCompliance(itinerary);
      
      // Check individual country limits
      const countryCodes = Array.from(new Set(itinerary.map(l => l.countryCode))) as string[];
      const countryNotes: string[] = [];
      let isAllCompliant = schengenResult.isCompliant;
      let totalOverstay = schengenResult.overstayDays;

      countryCodes.forEach(code => {
        const res = checkCountryStayCompliance(itinerary, code);
        if (!res.isCompliant) {
          isAllCompliant = false;
          totalOverstay += res.overstayDays;
          countryNotes.push(...res.notes);
        }
      });

      setCompliance({
        isCompliant: isAllCompliant,
        overstayDays: totalOverstay,
        notes: [...schengenResult.notes, ...countryNotes]
      });
    } else {
      setCompliance({ isCompliant: true, overstayDays: 0, notes: [] });
    }
  }, [itinerary]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans p-6 md:p-12">
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#141414]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
                />
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-gray-50 rounded-full">
                  {onboardingSteps[onboardingStep].icon}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif italic">{onboardingSteps[onboardingStep].title}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {onboardingSteps[onboardingStep].description}
                  </p>
                </div>

                <div className="flex w-full gap-4 pt-4">
                  {onboardingStep > 0 && (
                    <button 
                      onClick={() => setOnboardingStep(s => s - 1)}
                      className="flex-1 px-6 py-4 rounded-2xl border border-[#141414]/10 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (onboardingStep < onboardingSteps.length - 1) {
                        setOnboardingStep(s => s + 1);
                      } else {
                        completeOnboarding();
                      }
                    }}
                    className="flex-1 px-6 py-4 rounded-2xl bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all flex items-center justify-center gap-2"
                  >
                    {onboardingStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="max-w-4xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-serif italic tracking-tight mb-2">Bordermath</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm uppercase tracking-widest opacity-50">Global Visa Strategic Planner</p>
            {isFetchingVisa && (
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-1 text-[8px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full"
              >
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                Live API Sync
              </motion.div>
            )}
            {!isFetchingVisa && lastVisaUpdate && (
               <p className="text-[8px] uppercase font-bold opacity-30 mt-0.5">Updated {format(lastVisaUpdate, 'HH:mm')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-[#141414]/5 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('itinerary')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'itinerary' ? "bg-white text-[#141414] shadow-sm" : "text-[#141414]/40 hover:text-[#141414]"
              )}
            >
              <Plane size={14} /> Explorer
            </button>
            <button 
              onClick={() => setActiveTab('vault')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'vault' ? "bg-white text-[#141414] shadow-sm" : "text-[#141414]/40 hover:text-[#141414]"
              )}
            >
              <Shield size={14} /> Vault
            </button>
            <button 
              onClick={() => setActiveTab('tools')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'tools' ? "bg-white text-[#141414] shadow-sm" : "text-[#141414]/40 hover:text-[#141414]"
              )}
            >
              <Activity size={14} /> Tools
            </button>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <button onClick={logout} className="opacity-50 hover:opacity-100 transition-opacity p-2">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={login} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-50 transition-opacity">
              <LogIn size={16} /> Login
            </button>
          )}
          <div className={cn(
            "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-tighter border",
            compliance.isCompliant ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
          )}>
            {compliance.isCompliant ? "Legally Compliant" : "Overstay Risk"}
            <span className="ml-2 opacity-40 text-[9px] font-mono">(90-2 Global Stability Buffer applied)</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Section */}
        <section className="lg:col-span-2 space-y-6">
          {activeTab === 'itinerary' ? (
            <>
              {itinerary.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-40">Trip Timeline</h3>
                  <div className="relative flex items-center justify-between w-full h-12 bg-gray-50 rounded-full px-6">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
                    {itinerary.map((leg, idx) => (
                      <div key={leg.id} className="relative z-10 flex flex-col items-center">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors",
                            leg.isSchengen ? "bg-blue-500" : "bg-orange-500"
                          )}
                        />
                        <span className="absolute top-6 whitespace-nowrap text-[8px] font-bold uppercase tracking-tighter opacity-40">
                          {format(leg.entryDate, 'MMM dd')}
                        </span>
                      </div>
                    ))}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <span className="absolute top-6 whitespace-nowrap text-[8px] font-bold uppercase tracking-tighter opacity-40">
                        {format(itinerary[itinerary.length - 1].exitDate, 'MMM dd')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {regulationChanges.length > 0 && (
                <div className="mb-6 space-y-3">
                  {regulationChanges.map(change => (
                    <motion.div 
                      key={change.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-2xl border flex items-start gap-3 relative overflow-hidden",
                        change.severity === 'critical' ? "bg-red-50 border-red-100 text-red-800" : "bg-blue-50 border-blue-100 text-blue-800"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        change.severity === 'critical' ? "bg-red-100" : "bg-blue-100"
                      )}>
                        <Bell size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">{change.title}</p>
                        <p className="text-xs opacity-80 leading-relaxed">{change.description}</p>
                        <p className="text-[10px] opacity-40 uppercase font-mono mt-2">Detected: {format(change.dateDetected, 'MMM dd, yyyy')}</p>
                      </div>
                      {change.severity === 'critical' && (
                        <div className="absolute top-0 right-0 p-2">
                           <AlertTriangle size={12} className="text-red-300" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-serif italic">Your Itinerary</h2>
                <button 
                  onClick={addLeg}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-50 transition-opacity"
                >
                  <Plus size={16} /> Add Country
                </button>
              </div>

              <div className="space-y-4">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="itinerary">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {itinerary.map((leg, index) => (
                          // @ts-ignore
                          <Draggable key={leg.id} draggableId={leg.id} index={index}>
                            {(provided: any) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <motion.div 
                                  layout
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white border border-[#141414]/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-3">
                                        <CountrySearch 
                                          value={leg.countryName} 
                                          onChange={(c) => updateLeg(leg.id, { 
                                            countryName: c.name, 
                                            countryCode: c.code,
                                            isSchengen: SCHENGEN_COUNTRIES.includes(c.name) 
                                          })} 
                                        />
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Calendar size={18} className="opacity-30" />
                                        <div className="flex items-center gap-2 text-sm font-mono">
                                          <div className="relative group/date">
                                            <input 
                                              type="date" 
                                              value={format(leg.entryDate, 'yyyy-MM-dd')}
                                              onChange={(e) => updateLeg(leg.id, { entryDate: new Date(e.target.value) })}
                                              className="bg-transparent outline-none"
                                            />
                                            {profile?.passportExpiry && isAfter(leg.entryDate, new Date(profile.passportExpiry)) && (
                                              <div className="absolute -top-4 left-0 text-red-500">
                                                <AlertTriangle size={10} />
                                              </div>
                                            )}
                                          </div>
                                          <span className="opacity-30">→</span>
                                          <div className="relative group/date">
                                            <input 
                                              type="date" 
                                              value={format(leg.exitDate, 'yyyy-MM-dd')}
                                              onChange={(e) => updateLeg(leg.id, { exitDate: new Date(e.target.value) })}
                                              className="bg-transparent outline-none"
                                            />
                                            {profile?.passportExpiry && isAfter(leg.exitDate, new Date(profile.passportExpiry)) && (
                                              <div className="absolute -top-4 left-0 text-red-500">
                                                <AlertTriangle size={10} />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-col justify-between items-end">
                                      <div className="text-right space-y-2">
                                        <div className="flex flex-col items-end gap-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <img src={`https://flagcdn.com/w40/${leg.countryCode.toLowerCase()}.png`} alt="" className="w-6 h-auto rounded shadow-sm" />
                                            <span className={cn(
                                              "text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded",
                                              leg.isSchengen ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                            )}>
                                              {leg.isSchengen ? "Schengen Area" : "Non-Schengen"}
                                            </span>
                                          </div>
                                          {leg.visaRequirement && (
                                            <div className="flex flex-col items-end gap-1">
                                              <span className={cn(
                                                "text-[9px] uppercase font-bold tracking-tighter px-1.5 py-0.5 rounded border",
                                                leg.visaRequirement === 'visa-free' ? "border-green-200 text-green-600 bg-green-50" :
                                                leg.visaRequirement === 'visa-on-arrival' ? "border-blue-200 text-blue-600 bg-blue-50" :
                                                leg.visaRequirement === 'e-visa' ? "border-purple-200 text-purple-600 bg-purple-50" :
                                                "border-red-200 text-red-600 bg-red-50"
                                              )}>
                                                {leg.visaRequirement.replace('-', ' ')}
                                              </span>
                                              {leg.estimatedCost !== undefined && leg.estimatedCost > 0 && (
                                                <span className="text-[9px] font-bold text-green-600">
                                                  ${leg.estimatedCost}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-[10px] opacity-40 mt-1 uppercase tracking-tighter flex items-center gap-2">
                                          {differenceInDays(leg.exitDate, leg.entryDate) + 1} Days Stay
                                          {leg.stayLimitDays && (
                                            <>
                                              <span className="opacity-20">/</span>
                                              <span className={cn(
                                                "font-bold",
                                                (differenceInDays(leg.exitDate, leg.entryDate) + 1) > (leg.stayLimitDays - 2) ? "text-red-500" : "text-green-600"
                                              )}>
                                                Limit: {leg.stayLimitDays} Days
                                              </span>
                                            </>
                                          )}
                                        </p>
                                        {leg.stayLimitDays && (
                                          <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${Math.min(((differenceInDays(leg.exitDate, leg.entryDate) + 1) / leg.stayLimitDays) * 100, 100)}%` }}
                                              className={cn(
                                                "h-full transition-colors",
                                                (differenceInDays(leg.exitDate, leg.entryDate) + 1) > (leg.stayLimitDays - 2) ? "bg-red-400" : "bg-green-400"
                                              )}
                                            />
                                          </div>
                                        )}
                                        {leg.visaNotes && (
                                          <p className="text-[10px] text-orange-600/70 mt-2 italic leading-tight max-w-[200px]">
                                            Note: {leg.visaNotes}
                                          </p>
                                        )}
                                      </div>
                                      <button 
                                        onClick={() => removeLeg(leg.id)}
                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {itinerary.length === 0 && (
                  <div className="border-2 border-dashed border-[#141414]/10 rounded-3xl p-12 text-center opacity-30">
                    <p className="font-serif italic text-lg">Start your journey by adding a country.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'vault' ? (
            <DocumentVault 
              userProfile={profile} 
              visas={visas} 
              itinerary={itinerary} 
              visaApplications={visaApplications}
            />
          ) : (
            <div className="space-y-8">
              <CurrencyConverter />
              
              <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <CreditCard size={16} className="text-green-500" />
                  Visa Cost Analysis (Per Leg)
                </h3>
                <p className="text-[10px] opacity-40 mb-6 italic">Calculation based on citizen-destination combinations.</p>
                
                <div className="space-y-4">
                  {itinerary.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        {itinerary.map((leg, idx) => (
                          <div key={leg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group transition-all border border-transparent hover:border-green-100 hover:bg-green-50/10">
                            <div className="flex items-center gap-4">
                              <div className="text-[8px] font-bold opacity-30 w-4">#{idx + 1}</div>
                              <img src={`https://flagcdn.com/w40/${leg.countryCode.toLowerCase()}.png`} alt="" className="w-6 shadow-sm rounded-sm" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold">{leg.countryName}</p>
                                  <span className="text-[8px] opacity-40 font-mono">({format(leg.entryDate, 'MMM dd')} - {format(leg.exitDate, 'MMM dd')})</span>
                                </div>
                                <p className="text-[10px] opacity-40 capitalize">{leg.visaRequirement?.replace('-', ' ') || 'Checking...'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-sm font-mono font-bold block">${leg.estimatedCost || 0}</span>
                                <p className="text-[8px] opacity-30 lowercase">est. fee</p>
                              </div>
                              {(leg.estimatedCost || 0) > 40 && (
                                <button 
                                  onClick={() => window.open(`https://www.google.com/search?q=visa-free+alternative+destinations+for+${profile?.citizenships?.[0]}+citizens+instead+of+${leg.countryName}`, '_blank')}
                                  className="text-[8px] font-bold uppercase text-blue-600 bg-blue-100/50 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                                >
                                  Explore Cheaper
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-6 mt-4 border-t border-[#141414]/5 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase opacity-40 block">Trip Total Strategy</span>
                          <p className="text-[9px] opacity-30 italic max-w-[200px]">Algorithms optimized against real-world visa pricing data 2026.</p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-serif italic text-green-600 block">
                            ${itinerary.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0)}
                          </span>
                          <span className="text-[10px] font-bold uppercase opacity-30 tracking-widest">USD Total</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs opacity-40 italic text-center py-4">Add trip legs to see cost analysis.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Shield size={120} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Shield size={16} className="text-purple-500" />
                  Travel Insurance Integration
                </h3>
                <p className="text-xs opacity-60 mb-8 max-w-sm leading-relaxed">
                  Protect your journey. We've matched your itinerary with top-rated nomadic insurance providers. Get covered in under 2 minutes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 group hover:border-blue-300 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Globe size={24} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended</span>
                    </div>
                    <h4 className="text-lg font-serif italic mb-1">SafetyWing Nomad Insurance</h4>
                    <p className="text-xs opacity-60 mb-4">Starting at $45.08 per 4 weeks. Global coverage including Schengen compliance.</p>
                    <button className="w-full bg-[#141414] text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      Get Quote <ChevronRight size={14} />
                    </button>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100 hover:border-purple-300 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Plane size={24} className="text-purple-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-serif italic mb-1">World Nomads</h4>
                    <p className="text-xs opacity-60 mb-4">Travel insurance for independent travelers from 140 countries. Comprehensive gear protection.</p>
                    <button className="w-full bg-[#141414]/10 text-[#141414] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      Learn More <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Section */}
        <aside className="space-y-8">
          {/* Decision Alerts */}
          {visaApplications.some(a => a.status === 'pending' && a.expectedDecisionDate && differenceInDays(new Date(a.expectedDecisionDate), new Date()) < 5) && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-orange-600 text-white p-6 rounded-[2rem] shadow-xl shadow-orange-100/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <Bell size={20} className="animate-bounce" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Decision Alerts</h4>
              </div>
              <div className="space-y-3">
                {visaApplications
                  .filter(a => a.status === 'pending' && a.expectedDecisionDate && differenceInDays(new Date(a.expectedDecisionDate), new Date()) < 5)
                  .map(app => (
                    <div key={app.id} className="bg-white/10 p-3 rounded-xl border border-white/10">
                      <p className="font-bold text-sm">{app.countryCode} {app.visaType}</p>
                      <p className="text-[10px] opacity-80 mt-1">
                        Expected in {differenceInDays(new Date(app.expectedDecisionDate!), new Date())} days
                      </p>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Compliance History Chart */}
          {itinerary.length > 0 && <ComplianceHistoryChart itinerary={itinerary} />}

          {/* Citizenship Manager */}
          {profile && (
            <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
              <CitizenshipManager 
                profile={profile} 
                onAdd={addCitizenship} 
                onRemove={removeCitizenship} 
              />
            </div>
          )}

          {/* Passport Alert Dashboard Widget */}
          {profile && (
      <div className={cn(
        "p-6 rounded-3xl border transition-all",
        checkPassportCompliance(profile).isCritical ? "bg-red-50 border-red-200 shadow-lg shadow-red-100" :
        checkPassportCompliance(profile).isWarning ? "bg-yellow-50 border-yellow-200 shadow-md shadow-yellow-100" : "bg-white border-[#141414]/10"
      )}>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={14} className={checkPassportCompliance(profile).isCritical ? "text-red-500" : checkPassportCompliance(profile).isWarning ? "text-yellow-500" : "text-green-500"} />
          Passport Status
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-xs opacity-60">Validity</span>
          <span className={cn(
            "text-sm font-serif italic",
            checkPassportCompliance(profile).isCritical ? "text-red-600" : 
            checkPassportCompliance(profile).isWarning ? "text-yellow-600" : "text-green-600"
          )}>
            {checkPassportCompliance(profile).monthsRemaining} Months Left
          </span>
        </div>
        {checkPassportCompliance(profile).isWarning && (
          <div className="mt-3 p-3 bg-white/50 rounded-xl border border-white/20">
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-tighter leading-tight",
              checkPassportCompliance(profile).isCritical ? "text-red-600" : "text-yellow-700"
            )}>
              {checkPassportCompliance(profile).isCritical ? "CRITICAL ALERT" : "PASSPORT ALERT"}
            </p>
            <p className="text-[10px] opacity-70 leading-relaxed mt-1">
              {checkPassportCompliance(profile).isCritical 
                ? "Your passport validity is below the mandatory 6-month international travel requirement." 
                : `You are within your custom ${profile.passportAlertThresholdMonths}-month renewal window.`}
            </p>
          </div>
        )}
      </div>
          )}

          {/* Save Trip Button */}
          {itinerary.length > 0 && (
            <button 
              onClick={saveTrip}
              className="w-full bg-[#141414] text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors shadow-lg"
            >
              Save Itinerary
            </button>
          )}

          {/* Compliance Health Bar */}
          <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <CheckCircle size={16} className={compliance.isCompliant ? "text-green-500" : "text-red-500"} />
              Compliance Health
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] uppercase font-bold mb-2">
                  <span>Regional Stay Compliance (e.g. Schengen)</span>
                  <span>{compliance.isCompliant ? "Safe" : "Overstay Risk"}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: compliance.isCompliant ? '45%' : '100%' }}
                    className={cn(
                      "h-full transition-colors duration-500",
                      compliance.isCompliant ? "bg-blue-400" : "bg-red-400"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {compliance.notes.map((note, i) => (
                  <div key={i} className={cn(
                    "flex gap-3 text-xs leading-relaxed p-3 rounded-xl border",
                    note.includes('Critical') || note.includes('Schengen overstay') || note.includes('Overstay in')
                      ? "bg-red-50 border-red-100 text-red-800" 
                      : "bg-blue-50 border-blue-100 text-blue-800"
                  )}>
                    <Info size={14} className="shrink-0 mt-0.5 opacity-60" />
                    <div>
                      <p className="font-bold mb-0.5">{note.split(':')[0]}</p>
                      <p className="opacity-80">{note.split(':').slice(1).join(':') || note}</p>
                    </div>
                  </div>
                ))}
                {checkItineraryValidityAgainstDocuments(itinerary, profile, visas).map((issue, i) => (
                  <div key={`issue-${i}`} className={cn(
                    "flex gap-3 text-xs leading-relaxed p-3 rounded-xl border",
                    issue.severity === 'critical' ? "bg-red-50 border-red-100 text-red-700" : "bg-orange-50 border-orange-100 text-orange-700"
                  )}>
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p>{issue.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          {!compliance.isCompliant && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#141414] text-white p-8 rounded-3xl shadow-xl"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                Strategic Fixes
              </h3>
              <p className="text-xs opacity-60 mb-6 leading-relaxed">
                Your current route exceeds Schengen limits. Consider a "Non-Schengen Pivot" to reset your rolling window.
              </p>
              <div className="space-y-2">
                {NON_SCHENGEN_PIVOTS.slice(0, 3).map(pivot => (
                  <button 
                    key={pivot}
                    onClick={() => {
                      const lastLeg = itinerary[itinerary.length - 1];
                      const entryDate = lastLeg ? addDays(lastLeg.exitDate, 1) : new Date();
                      const exitDate = addDays(entryDate, 14);
                      const country = ALL_COUNTRIES.find(c => c.name === pivot);
                      if (country) {
                        const newLeg: ItineraryItem = {
                          id: Math.random().toString(36).substr(2, 9),
                          countryCode: country.code,
                          countryName: country.name,
                          entryDate,
                          exitDate,
                          transportType: 'air',
                          isSchengen: false
                        };
                        setItinerary([...itinerary, newLeg]);
                      }
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-medium transition-colors"
                  >
                    Pivot to {pivot}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Global Stability Buffer */}
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">The Stability Buffer</p>
            <p className="text-xs text-blue-700 opacity-80 leading-relaxed">
              We've automatically applied a 2-day safety margin to all calculations to protect you against unforeseen delays, time-zone shifts, and transit discrepancies.
            </p>
          </div>

          {!compliance.isCompliant && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-orange-50 border border-orange-200 p-6 rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-2 text-orange-800">
                <Zap size={16} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Strategic Fixes</p>
              </div>
              <p className="text-xs text-orange-700 opacity-80 leading-relaxed">
                Your current route exceeds calculated limits. Consider a "Regional Pivot" to reset your rolling window legally.
              </p>
              <div className="flex flex-wrap gap-2">
                {NON_SCHENGEN_PIVOTS.slice(0, 4).map(pivot => (
                  <button 
                    key={pivot}
                    onClick={() => {
                      const lastLeg = itinerary[itinerary.length - 1];
                      const country = ALL_COUNTRIES.find(c => c.name === pivot);
                      if (country && lastLeg) {
                        const entryDate = addDays(lastLeg.exitDate, 1);
                        const exitDate = addDays(entryDate, 89);
                        const newLeg: ItineraryItem = {
                          id: Math.random().toString(36).substr(2, 9),
                          countryCode: country.code,
                          countryName: country.name,
                          entryDate,
                          exitDate,
                          transportType: 'air',
                          isSchengen: false,
                          stayLimitDays: 90
                        };
                        setItinerary([...itinerary, newLeg]);
                      } else if (country) {
                        // If no legs, just add as first
                        const entryDate = new Date();
                        const exitDate = addDays(entryDate, 89);
                        const newLeg: ItineraryItem = {
                          id: Math.random().toString(36).substr(2, 9),
                          countryCode: country.code,
                          countryName: country.name,
                          entryDate,
                          exitDate,
                          transportType: 'air',
                          isSchengen: false,
                          stayLimitDays: 90
                        };
                        setItinerary([newLeg]);
                      }
                    }}
                    className="text-[9px] font-bold uppercase bg-white border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Pivot to {pivot}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Visa Cost Tracker */}
          {itinerary.length > 0 && (
            <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <CreditCard size={16} className="text-green-500" />
                Visa Cost Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-60">Total Estimated Cost</span>
                  <span className="text-xl font-serif italic text-green-600">
                    ${itinerary.reduce((acc, leg) => acc + (leg.estimatedCost || 0), 0)}
                  </span>
                </div>
                
                {itinerary.some(leg => leg.visaRequirement !== 'visa-free') && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Optimization Tip</p>
                    <p className="text-[11px] leading-relaxed opacity-70">
                      You are spending money on visas for {itinerary.filter(l => l.visaRequirement !== 'visa-free').length} countries. 
                      Consider swapping high-cost legs for digital nomad-friendly hubs like Georgia or Albania (Visa-Free for many).
                    </p>
                    <div className="pt-2">
                       <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">
                         View Visa-Free Recommendations →
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function CountrySearch({ value, onChange }: { value: string, onChange: (country: { code: string, name: string }) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = ALL_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-3 w-full">
        <MapPin size={18} className="opacity-30 shrink-0" />
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left font-serif italic text-lg outline-none border-b border-transparent focus:border-[#141414]/20 transition-colors py-1"
        >
          {value || "Select Country"}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 w-full mt-2 bg-white border border-[#141414]/10 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-[#141414]/5 flex items-center gap-2">
                <Search size={14} className="opacity-30" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search countries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs font-medium"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filtered.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      onChange(country);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} alt="" className="w-5 h-auto rounded-sm" />
                      <span>{country.name}</span>
                    </div>
                    <span className="opacity-30 group-hover:opacity-100 font-mono">{country.code}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs opacity-30 italic">
                    No countries found.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CitizenshipManager({ profile, onAdd, onRemove }: { profile: UserProfile, onAdd: (code: string) => void, onRemove: (code: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = ALL_COUNTRIES.filter(c => 
    !profile.citizenships.includes(c.code) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <User size={16} className="text-orange-500" />
          Citizenships
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
        >
          {isAdding ? "Cancel" : "Add New"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.citizenships.map(code => {
          const country = ALL_COUNTRIES.find(c => c.code === code);
          return (
              <div key={code} className="flex items-center gap-2 bg-gray-50 border border-[#141414]/5 pl-2 pr-1 py-1 rounded-full group">
                <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" className="w-4 h-auto rounded-sm" />
                <span className="text-[10px] font-bold uppercase tracking-tight">{country?.name || code}</span>
                <button 
                  onClick={() => onRemove(code)}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                <input 
                  type="text" 
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-[#141414]/5 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-[#141414]/20 transition-colors"
                />
              </div>
              <div className="space-y-1">
                {filtered.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      onAdd(country.code);
                      setIsAdding(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-medium hover:bg-gray-50 rounded-lg flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} alt="" className="w-4 h-auto rounded-sm" />
                      <span>{country.name}</span>
                      <Plus size={12} className="opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
