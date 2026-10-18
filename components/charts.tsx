"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SchengenChart({ data }: { data: { date: string; days: number }[] }) {
  const points = data.map((point) => ({ ...point, label: point.date.slice(5) }));
  return (
    <div className="h-64 w-full" data-testid="schengen-chart" role="img" aria-label="Schengen days inside each rolling 180-day window">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis domain={[0, 100]} width={36} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
            labelStyle={{ color: "var(--foreground)" }}
          />
          <ReferenceLine y={88} stroke="var(--accent)" strokeDasharray="3 4" />
          <ReferenceLine y={90} stroke="var(--destructive)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="days" name="Days in window" stroke="var(--sea)" fill="var(--sea)" fillOpacity={0.2} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountryChart({ data }: { data: { name: string; days: number }[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Days planned by country">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval={0} />
          <YAxis width={36} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
          />
          <Bar dataKey="days" name="Days" fill="var(--sea)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
