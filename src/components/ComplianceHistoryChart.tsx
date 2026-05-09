import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getSchengenTimelineData } from '../lib/visaLogic';
import { ItineraryItem } from '../types';

interface ComplianceHistoryChartProps {
  itinerary: ItineraryItem[];
}

export default function ComplianceHistoryChart({ itinerary }: ComplianceHistoryChartProps) {
  const data = getSchengenTimelineData(itinerary);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm text-center">
        <p className="text-xs opacity-40 italic">Sync your itinerary to visualize compliance history.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#141414]/10 p-8 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-1">90/180 Compliance Tracker</h3>
          <p className="text-[10px] opacity-40 italic">Visualizing Schengen usage days in rolling 180-day windows.</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-blue-600">Schengen Days</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#9ca3af' }} 
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#9ca3af' }} 
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
            />
            <ReferenceLine y={88} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Safety Limit', fill: '#ef4444', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="daysSpent" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorDays)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
