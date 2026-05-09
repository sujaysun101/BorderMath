import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, ArrowRightLeft, Globe } from 'lucide-react';
import { ExchangeRate } from '../types';

const MOCK_RATES: ExchangeRate[] = [
  { code: 'USD', rate: 1, name: 'US Dollar', symbol: '$' },
  { code: 'EUR', rate: 0.93, name: 'Euro', symbol: '€' },
  { code: 'GBP', rate: 0.79, name: 'British Pound', symbol: '£' },
  { code: 'THB', rate: 36.5, name: 'Thai Baht', symbol: '฿' },
  { code: 'JPY', rate: 155.2, name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', rate: 83.4, name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', rate: 1.5, name: 'Australian Dollar', symbol: 'A$' },
];

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const fromRate = MOCK_RATES.find(r => r.code === fromCurrency)?.rate || 1;
    const toRate = MOCK_RATES.find(r => r.code === toCurrency)?.rate || 1;
    const converted = (amount / fromRate) * toRate;
    setResult(converted);
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
        <ArrowRightLeft size={16} className="text-blue-500" />
        Currency Converter
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Amount</label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-gray-50 border border-transparent focus:border-[#141414]/20 rounded-2xl px-4 py-3 outline-none font-serif italic text-lg transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">From</label>
            <select 
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full bg-gray-50 border border-transparent focus:border-[#141414]/20 rounded-2xl px-4 py-3 outline-none text-xs font-bold transition-all appearance-none"
            >
              {MOCK_RATES.map(rate => (
                <option key={rate.code} value={rate.code}>{rate.code} - {rate.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">To</label>
            <select 
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full bg-gray-50 border border-transparent focus:border-[#141414]/20 rounded-2xl px-4 py-3 outline-none text-xs font-bold transition-all appearance-none"
            >
              {MOCK_RATES.map(rate => (
                <option key={rate.code} value={rate.code}>{rate.code} - {rate.name}</option>
              ))}
            </select>
          </div>
        </div>

        {result !== null && (
          <div className="pt-4 border-t border-[#141414]/5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-40">Converted Amount</p>
                <p className="text-3xl font-serif italic tracking-tight">
                  {MOCK_RATES.find(r => r.code === toCurrency)?.symbol}
                  {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-xs font-bold opacity-30 uppercase tracking-widest pb-1">
                {toCurrency}
              </p>
            </div>
          </div>
        )}

        <p className="text-[9px] opacity-30 mt-4 italic">
          * Exchange rates are for estimation purposes only and updated periodically.
        </p>
      </div>
    </div>
  );
}
