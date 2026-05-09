import React, { useState } from 'react';
import { FileText, Shield, Clock, AlertCircle, Settings, Bell, CheckCircle2, Upload, ExternalLink, Download, FileJson, FileSpreadsheet, CreditCard, Plus, Calendar, Info, Trash2, Search, X, RefreshCw } from 'lucide-react';
import { format, differenceInMonths, isAfter, isBefore, addMonths, differenceInDays } from 'date-fns';
import { Visa, UserProfile, VisaApplication } from '../types.ts';
import { db, storage } from '../firebase';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_COUNTRIES } from './BordermathApp';

interface DocumentVaultProps {
  userProfile?: UserProfile;
  visas: Visa[];
  itinerary?: any[];
  visaApplications?: VisaApplication[];
}

function CountrySelect({ value, onChange, placeholder = "Select Country" }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selected = ALL_COUNTRIES.find(c => c.code === value);
  const filtered = ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold flex justify-between items-center"
      >
        <span>{selected ? selected.name : placeholder}</span>
        <Search size={12} className="opacity-40" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 mt-1 w-full bg-white border border-[#141414]/10 rounded-xl shadow-xl max-h-48 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
              <input 
                autoFocus
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 rounded-lg px-2 py-1 text-[10px] outline-none"
              />
            </div>
            {filtered.map(c => (
              <button 
                key={c.code}
                onClick={() => { onChange(c.code); setIsOpen(false); setSearch(''); }}
                className="w-full text-left px-3 py-2 text-[10px] hover:bg-gray-50 flex items-center gap-2"
              >
                <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} className="w-4" alt="" />
                {c.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocumentVault({ userProfile, visas, itinerary = [], visaApplications = [] }: DocumentVaultProps) {
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [isEditingPassport, setIsEditingPassport] = useState(false);
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [showAddVisa, setShowAddVisa] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appTypeFilter, setAppTypeFilter] = useState<string>('');
  
  const [newApp, setNewApp] = useState<Partial<VisaApplication>>({
    countryCode: '',
    status: 'pending',
    visaType: 'Tourist',
    applicationDate: new Date(),
    caseNumber: '',
    notes: ''
  });

  const [newVisa, setNewVisa] = useState<Partial<Visa & { file?: File }>>({
    countryCode: '',
    visaType: 'Tourist',
    expiryDate: addMonths(new Date(), 6)
  });

  const [tempThreshold, setTempThreshold] = useState(userProfile?.passportAlertThresholdMonths || 9);
  const [tempPassportNumber, setTempPassportNumber] = useState(userProfile?.passportNumber || '');

  const passportExpiry = userProfile?.passportExpiry;
  const monthsRemaining = passportExpiry ? differenceInMonths(new Date(passportExpiry), new Date()) : 999;
  const isPassportExpiringSoon = monthsRemaining < 6;
  const isWithinAlertThreshold = monthsRemaining < (userProfile?.passportAlertThresholdMonths || 9);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPassport, setIsUploadingPassport] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateAppForm = () => {
    const errors: Record<string, string> = {};
    if (!newApp.countryCode) errors.countryCode = 'Required';
    if (!newApp.visaType) errors.visaType = 'Required';
    if (!newApp.applicationDate) errors.applicationDate = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateVisaForm = () => {
    const errors: Record<string, string> = {};
    if (!newVisa.countryCode) errors.countryCode = 'Required';
    if (!newVisa.visaType) errors.visaType = 'Required';
    if (!newVisa.expiryDate) errors.expiryDate = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;

    setIsUploadingPassport(true);
    try {
      const storageRef = ref(storage, `passports/${userProfile.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', userProfile.uid), {
        passportCopyUrl: url
      });
    } catch (error) {
      console.error('Passport upload error:', error);
    } finally {
      setIsUploadingPassport(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, visaId: string) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `visas/${userProfile.uid}/${visaId}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'visas', visaId), {
        documentUrl: url
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const saveThreshold = async () => {
    if (!userProfile?.uid) return;
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        passportAlertThresholdMonths: tempThreshold
      });
      setIsEditingThreshold(false);
    } catch (e) {
      console.error(e);
    }
  };

  const savePassportNumber = async () => {
    if (!userProfile?.uid) return;
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        passportNumber: tempPassportNumber
      });
      setIsEditingPassport(false);
    } catch (e) {
      console.error(e);
    }
  };

  const addApplication = async () => {
    if (!userProfile?.uid || !validateAppForm()) return;
    try {
      await addDoc(collection(db, 'visaApplications'), {
        ...newApp,
        uid: userProfile.uid,
        applicationDate: new Date(newApp.applicationDate || new Date()),
        expectedDecisionDate: newApp.expectedDecisionDate ? new Date(newApp.expectedDecisionDate) : null
      });
      setShowAddApplication(false);
      setNewApp({
        countryCode: '',
        status: 'pending',
        visaType: 'Tourist',
        applicationDate: new Date(),
        caseNumber: '',
        notes: ''
      });
      setFormErrors({});
    } catch (e) {
      console.error(e);
    }
  };

  const addVisaDoc = async () => {
    if (!userProfile?.uid || !validateVisaForm()) return;
    try {
      const docRef = await addDoc(collection(db, 'visas'), {
        countryCode: newVisa.countryCode,
        visaType: newVisa.visaType,
        expiryDate: new Date(newVisa.expiryDate || new Date()),
        uid: userProfile.uid,
        createdAt: new Date()
      });

      if (newVisa.file) {
        setIsUploading(true);
        const storageRef = ref(storage, `visas/${userProfile.uid}/${docRef.id}_${newVisa.file.name}`);
        await uploadBytes(storageRef, newVisa.file);
        const url = await getDownloadURL(storageRef);
        await updateDoc(docRef, { documentUrl: url });
      }

      setShowAddVisa(false);
      setNewVisa({
        countryCode: '',
        visaType: 'Tourist',
        expiryDate: addMonths(new Date(), 6)
      });
      setFormErrors({});
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'visaApplications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const exportData = (formatType: 'json' | 'csv') => {
    const data = {
      profile: userProfile,
      visas: visas,
      itinerary: itinerary
    };

    if (formatType === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bordermath_data_${format(new Date(), 'yyyyMMdd')}.json`;
      a.click();
    } else {
      let csv = 'Type,ID,Country,Details,Entry/Expiry,Exit\n';
      // Profile
      csv += `Profile,${userProfile?.uid},N/A,Passport: ${userProfile?.passportNumber || 'N/A'},${userProfile?.passportExpiry ? format(new Date(userProfile.passportExpiry), 'yyyy-MM-dd') : 'N/A'},N/A\n`;
      // Visas
      visas.forEach(v => {
        csv += `Visa,${v.id},${v.countryCode},${v.visaType},${format(new Date(v.expiryDate), 'yyyy-MM-dd')},N/A\n`;
      });
      // Itinerary
      itinerary.forEach((leg: any) => {
        csv += `TripLeg,${leg.id},${leg.countryCode},${leg.countryName},${format(new Date(leg.entryDate), 'yyyy-MM-dd')},${format(new Date(leg.exitDate), 'yyyy-MM-dd')}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bordermath_data_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
    }
  };

  const expiringVisas = visas.filter(v => {
    const expiry = new Date(v.expiryDate);
    const monthsToExpiry = differenceInMonths(expiry, new Date());
    return monthsToExpiry <= (userProfile?.passportAlertThresholdMonths || 9);
  });

  const filteredApplications = visaApplications.filter(app => {
    const statusMatch = appStatusFilter === 'all' || app.status === appStatusFilter;
    const typeMatch = !appTypeFilter || app.visaType.toLowerCase().includes(appTypeFilter.toLowerCase());
    return statusMatch && typeMatch;
  });

  const exportToCSV = () => {
    // 1. Visas
    const visaHeaders = ['Category', 'Country Code', 'Type', 'Expiry Date', 'Status/Ref', 'Notes'];
    const visaRows = visas.map(v => [
      'Active Visa', 
      v.countryCode, 
      v.visaType, 
      format(new Date(v.expiryDate), 'yyyy-MM-dd'),
      'Active',
      ''
    ]);
    
    // 2. Applications
    const appRows = visaApplications.map(a => [
      'Visa Application', 
      a.countryCode, 
      a.visaType, 
      a.expectedDecisionDate ? format(new Date(a.expectedDecisionDate), 'yyyy-MM-dd') : 'N/A',
      `${a.status}${a.caseNumber ? ` (Ref: ${a.caseNumber})` : ''}`,
      a.notes || ''
    ]);

    // 3. Passport (if available)
    const passportRow = userProfile?.passportExpiry ? 
      [['Passport', 'Global', 'Primary', format(new Date(userProfile.passportExpiry), 'yyyy-MM-dd'), userProfile.passportNumber || 'N/A', '']] : [];

    const allRows = [
      visaHeaders,
      ...passportRow,
      ...visaRows,
      ...appRows
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + allRows.map(e => e.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bordermath_global_data_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Navigation / Export */}
      <div className="flex justify-between items-center bg-white border border-[#141414]/10 p-4 px-8 rounded-3xl shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest opacity-40">Document Intelligence</h2>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all"
        >
          <Download size={14} />
          Export Data (CSV)
        </button>
      </div>

      {/* Passport Status */}
      <div className={cn(
        "bg-white border p-8 rounded-3xl shadow-sm transition-colors",
        isPassportExpiringSoon ? "border-red-500/30 bg-red-50/10" : 
        isWithinAlertThreshold ? "border-yellow-500/30 bg-yellow-50/10" : "border-[#141414]/10"
      )}>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} className={isPassportExpiringSoon ? "text-red-500" : isWithinAlertThreshold ? "text-yellow-500" : "text-green-500"} />
            Passport Status
          </h3>
          <button 
            onClick={() => setIsEditingThreshold(!isEditingThreshold)}
            className="text-[10px] uppercase font-bold tracking-widest opacity-40 hover:opacity-100 flex items-center gap-1"
          >
            <Settings size={12} /> Alert Settings
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {passportExpiry ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-tighter mb-1">Expires on</p>
                    <p className="text-2xl font-serif italic">{format(new Date(passportExpiry), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-50 uppercase tracking-tighter mb-1">Passport No.</p>
                    {isEditingPassport ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={tempPassportNumber}
                          onChange={(e) => setTempPassportNumber(e.target.value)}
                          className="bg-gray-50 border border-[#141414]/10 rounded px-2 py-1 text-xs font-mono w-32"
                        />
                        <button onClick={savePassportNumber} className="text-[10px] font-bold uppercase text-blue-600">Save</button>
                      </div>
                    ) : (
                      <p className="text-sm font-mono flex items-center gap-2 justify-end">
                        {userProfile?.passportNumber || 'Not set'}
                        <button onClick={() => setIsEditingPassport(true)} className="opacity-30 hover:opacity-100"><Settings size={12} /></button>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                {isPassportExpiringSoon ? (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-red-100 animate-pulse">
                    <AlertCircle size={12} /> Critical: 6-Month Rule Risk
                  </div>
                ) : isWithinAlertThreshold ? (
                  <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-yellow-100">
                    <Bell size={12} /> Warning: Approaching Expiry
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-green-100">
                    <CheckCircle2 size={12} /> Valid
                  </div>
                )}
                
                {userProfile?.passportCopyUrl ? (
                  <a 
                    href={userProfile.passportCopyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink size={12} /> View Copy
                  </a>
                ) : (
                  <label className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload size={12} /> {isUploadingPassport ? 'Uploading...' : 'Upload PDF'}
                    <input type="file" className="hidden" accept=".pdf" onChange={handlePassportUpload} disabled={isUploadingPassport} />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs opacity-40 italic">No passport details provided.</p>
          )}
        </div>

          {isEditingThreshold && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] text-white p-6 rounded-2xl space-y-4"
            >
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Alert Threshold (Months)</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="6" 
                  max="24" 
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="text-sm font-mono">{tempThreshold}m</span>
              </div>
              <button 
                onClick={saveThreshold}
                className="w-full bg-white text-black py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              >
                Save Settings
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Visa Notifications */}
      <AnimatePresence>
        {(expiringVisas.length > 0 || visaApplications.some(a => a.status === 'pending')) && (
          <div className="space-y-4">
            {expiringVisas.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 border-2 border-red-200 p-8 rounded-[40px] shadow-xl shadow-red-100/50"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif italic text-red-900">Visa Expiry Warnings</h3>
                    <p className="text-xs text-red-700/60 font-medium">Critical action required for {expiringVisas.length} documents.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {expiringVisas.map(v => (
                    <div key={v.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                          <img src={`https://flagcdn.com/w40/${v.countryCode.toLowerCase()}.png`} alt="" className="w-6 h-auto rounded-sm" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{v.countryCode} {v.visaType}</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-red-500">
                            Expires in {differenceInMonths(new Date(v.expiryDate), new Date())} months
                          </p>
                        </div>
                      </div>
                        <div className="flex items-center justify-between md:justify-end gap-6">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold opacity-30">Expiry Date</p>
                            <p className="text-xs font-mono font-bold">{format(new Date(v.expiryDate), 'MMM dd, yyyy')}</p>
                          </div>
                          <button 
                            onClick={() => window.open(`https://www.google.com/search?q=${v.countryCode}+visa+renewal+portal`, '_blank')}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            Renew <ExternalLink size={12} />
                          </button>
                        </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {visaApplications.filter(a => a.status === 'pending').map(app => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 p-6 rounded-3xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Application Pending: {app.countryCode}</h4>
                    <p className="text-xs text-blue-700/60">
                      Applied on {format(new Date(app.applicationDate), 'MMM dd')} 
                      {app.expectedDecisionDate && ` • Expected by ${format(new Date(app.expectedDecisionDate), 'MMM dd')}`}
                    </p>
                  </div>
                </div>
                {app.expectedDecisionDate && differenceInDays(new Date(app.expectedDecisionDate), new Date()) < 3 && (
                   <div className="flex items-center gap-2 text-red-600 bg-white px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-red-100">
                     <AlertCircle size={12} /> Decision expected soon
                   </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Visa Application Tracker */}
      <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              Visa Application Tracker
            </h3>
          </div>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30" />
                <input 
                  type="text" 
                  placeholder="Search Visa Type..." 
                  value={appTypeFilter}
                  onChange={(e) => setAppTypeFilter(e.target.value)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 border border-transparent rounded-lg pl-7 pr-2 py-1 outline-none w-32 focus:border-[#141414]/10 transition-all"
                />
              </div>
              <select 
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 border border-transparent rounded-lg px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="all">Statuses (All)</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <button 
                onClick={() => setShowAddApplication(!showAddApplication)}
                className={cn(
                  "p-2 rounded-full transition-all",
                  showAddApplication ? "bg-red-50 text-red-500 scale-90" : "bg-[#141414] text-white hover:scale-105"
                )}
              >
                {showAddApplication ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
        </div>

        {showAddApplication && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Country</label>
                <CountrySelect 
                  value={newApp.countryCode || ''} 
                  onChange={(val) => setNewApp({...newApp, countryCode: val})} 
                  placeholder="Select Destination"
                />
                {formErrors.countryCode && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase italic">{formErrors.countryCode}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Visa Type</label>
                <input 
                  type="text" 
                  placeholder="e.g. E-Visa" 
                  value={newApp.visaType}
                  onChange={(e) => setNewApp({...newApp, visaType: e.target.value})}
                  className={cn(
                    "w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold",
                    formErrors.visaType ? "border-red-400" : "border-gray-200"
                  )}
                />
                {formErrors.visaType && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase italic">{formErrors.visaType}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Case Number</label>
                <input 
                  type="text" 
                  placeholder="Application ID" 
                  value={newApp.caseNumber}
                  onChange={(e) => setNewApp({...newApp, caseNumber: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Status</label>
                <select 
                  value={newApp.status}
                  onChange={(e) => setNewApp({...newApp, status: e.target.value as any})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Application Date</label>
                <input 
                  type="date" 
                  onChange={(e) => setNewApp({...newApp, applicationDate: new Date(e.target.value)})}
                  className={cn(
                    "w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold",
                    formErrors.applicationDate ? "border-red-400" : "border-gray-200"
                  )}
                />
                {formErrors.applicationDate && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase italic">{formErrors.applicationDate}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Expected Decision</label>
                <input 
                  type="date" 
                  onChange={(e) => setNewApp({...newApp, expectedDecisionDate: new Date(e.target.value)})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Detailed Notes</label>
              <textarea 
                placeholder="Interview dates, additional documents requested..."
                value={newApp.notes}
                onChange={(e) => setNewApp({...newApp, notes: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium h-20 outline-none"
              />
            </div>
            <button 
              onClick={addApplication}
              className="w-full bg-[#141414] text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
              Add Tracker
            </button>
          </motion.div>
        )}

        <div className="space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map(app => (
              <div key={app.id} className="p-4 border border-[#141414]/5 rounded-2xl space-y-3 group hover:border-[#141414]/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[10px]">
                      {app.countryCode}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{app.visaType}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                          app.status === 'approved' ? "bg-green-100 text-green-700" :
                          app.status === 'rejected' ? "bg-red-100 text-red-700" :
                          app.status === 'withdrawn' ? "bg-gray-100 text-gray-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {app.status}
                        </span>
                        {app.caseNumber && (
                          <span className="text-[9px] font-mono opacity-40">Ref: {app.caseNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold opacity-30">Applied</p>
                      <p className="text-[10px] font-mono">{format(new Date(app.applicationDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <button 
                      onClick={() => deleteApplication(app.id)}
                      className="text-red-200 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {app.notes && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] leading-relaxed opacity-60 italic">{app.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs opacity-40 italic">No applications match your filters.</p>
          )}
        </div>
      </div>

      {/* Active Visas */}
      <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            Active Visas & E-Visas
          </h3>
          <button 
            onClick={() => setShowAddVisa(!showAddVisa)}
            className="p-2 bg-[#141414] text-white rounded-full hover:scale-105 transition-transform"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {showAddVisa && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Country</label>
                <CountrySelect 
                  value={newVisa.countryCode || ''} 
                  onChange={(val) => setNewVisa({...newVisa, countryCode: val})} 
                />
                {formErrors.countryCode && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase italic">{formErrors.countryCode}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Visa Type</label>
                <input 
                  type="text" 
                  placeholder="e.g. 10-Year Multi" 
                  value={newVisa.visaType}
                  onChange={(e) => setNewVisa({...newVisa, visaType: e.target.value})}
                  className={cn(
                    "w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold",
                    formErrors.visaType ? "border-red-400" : "border-gray-200"
                  )}
                />
                {formErrors.visaType && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase italic">{formErrors.visaType}</p>}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Expiry Date</label>
              <input 
                type="date" 
                onChange={(e) => setNewVisa({...newVisa, expiryDate: new Date(e.target.value)})}
                className={cn(
                  "w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold",
                  formErrors.expiryDate ? "border-red-400" : "border-gray-200"
                )}
              />
              {formErrors.expiryDate && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase italic">{formErrors.expiryDate}</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Document (PDF)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setNewVisa({...newVisa, file: e.target.files?.[0]})}
                  className="hidden" 
                  id="visa-file-upload"
                />
                <label 
                  htmlFor="visa-file-upload"
                  className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="opacity-60">{newVisa.file ? newVisa.file.name : 'Select PDF...'}</span>
                  <Upload size={14} className="opacity-40" />
                </label>
              </div>
            </div>
            <button 
              onClick={addVisaDoc}
              disabled={isUploading}
              className="w-full bg-[#141414] text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {isUploading ? 'Creating & Uploading...' : 'Add Visa Document'}
            </button>
          </motion.div>
        )}
        
        <div className="space-y-4">
          {visas.length > 0 ? (
            visas.map(visa => (
              <div key={visa.id} className="flex justify-between items-center p-4 border border-[#141414]/5 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">{visa.countryCode} {visa.visaType}</p>
                  <p className="text-[10px] opacity-40">Expires {format(new Date(visa.expiryDate), 'MMM dd, yyyy')}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {differenceInMonths(new Date(visa.expiryDate), new Date()) <= (userProfile?.passportAlertThresholdMonths || 9) && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`https://www.google.com/search?q=${visa.countryCode}+visa+renewal+portal+official+site`, '_blank')}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-red-700 shadow-sm flex items-center gap-1.5"
                    >
                      <RefreshCw size={10} className="animate-spin-slow" />
                      Renew Now
                    </motion.button>
                  )}
                  {visa.documentUrl ? (
                    <a 
                      href={visa.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <label className="cursor-pointer p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors">
                      <Upload size={14} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, visa.id)}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs opacity-40 italic">No active visas stored.</p>
          )}
        </div>
      </div>
      {/* Data Export */}
      <div className="bg-[#141414] text-white p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <Download size={16} className="text-blue-400" />
            Export Your Data
          </h3>
          <p className="text-xs opacity-60">Download your itinerary and visa records for offline access or backup.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => exportData('json')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <FileJson size={14} /> JSON
          </button>
          <button 
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <FileSpreadsheet size={14} /> CSV
          </button>
        </div>
      </div>
    </div>
  );
}
