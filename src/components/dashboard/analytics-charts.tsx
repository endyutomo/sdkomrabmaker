"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PieChartIcon, BarChart3, TrendingUp, Package } from "lucide-react";

// Color palette that matches the app theme
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#f97316", // orange
  "#06b6d4", // cyan
  "#a855f7", // purple
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

interface CategoryChartItem {
  name: string;
  value: number;
  fill: string;
}

interface MonthlyChartItem {
  month: string;
  year: string;
  fullLabel: string;
  count: number;
}

interface AnalyticsChartsProps {
  projects: any[];
}

export function AnalyticsCharts({ projects }: AnalyticsChartsProps) {
  // Calculate category breakdown (PieChart)
  const categoryData: CategoryChartItem[] = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    projects?.forEach((project: any) => {
      const categories = project.categories || [];
      categories.forEach((cat: any) => {
        const catTotal = (cat.items || []).reduce((sum: number, item: any) => {
          const margin = item.margin || 0;
          const sellingPrice = item.unitPrice * (1 + margin / 100);
          return sum + item.quantity * sellingPrice;
        }, 0);

        if (catTotal > 0) {
          categoryTotals[cat.name] =
            (categoryTotals[cat.name] || 0) + catTotal;
        }
      });
    });

    // Convert to array of {name, value} and sort descending
    const sorted: { name: string; value: number }[] = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Take top 7, group remaining as "Lainnya"
    const top = sorted.slice(0, 7);
    const rest = sorted.slice(7);
    const restTotal = rest.reduce((sum, item) => sum + item.value, 0);

    const result = restTotal > 0
      ? [...top, { name: "Lainnya", value: restTotal }]
      : top;

    return result.map((item, i) => ({
      name: item.name,
      value: item.value,
      fill: COLORS[i % COLORS.length],
    }));
  }, [projects]);

  // Calculate monthly trends (BarChart)
  const monthlyData: MonthlyChartItem[] = useMemo(() => {
    // Generate last 12 months
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, "yyyy-MM");
      months[key] = 0;
    }

    // Count projects per month based on updated_at
    projects?.forEach((project: any) => {
      const dateStr = project.updated_at || project.created_at;
      if (dateStr) {
        try {
          const date = parseISO(dateStr);
          const key = format(date, "yyyy-MM");
          if (key in months) {
            months[key]++;
          }
        } catch {
          // Skip invalid dates
        }
      }
    });

    return Object.entries(months).map(([key, count]) => {
      const [yearStr, monthStr] = key.split("-");
      const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1);
      return {
        month: format(date, "MMM", { locale: localeId }),
        year: yearStr,
        fullLabel: format(date, "MMM yyyy", { locale: localeId }),
        count,
      };
    });
  }, [projects]);

  // Calculate total budget value
  const totalCategoryValue = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.value, 0);
  }, [categoryData]);

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mb-10">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-black text-primary tracking-tight">
          Analitik Proyek
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Category Breakdown */}
        <div className="boq-glass rounded-2xl p-6 border-white/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <PieChartIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Biaya per Kategori
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Total: {formatCurrency(totalCategoryValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1000}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    const percentage = (
                      (data.value / totalCategoryValue) *
                      100
                    ).toFixed(1);
                    return (
                      <div className="rounded-xl border border-white/20 bg-emerald-900/95 backdrop-blur-md px-4 py-3 shadow-xl">
                        <p className="font-bold text-white text-sm">
                          {data.name}
                        </p>
                        <p className="text-white/80 text-xs mt-1">
                          {formatCurrency(data.value)}
                        </p>
                        <p className="text-accent text-xs font-bold mt-0.5">
                          {percentage}%
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryData.map((item, i) => {
              const percentage = ((item.value / totalCategoryValue) * 100).toFixed(1);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs group cursor-default"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground truncate group-hover:text-foreground transition-colors">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground/60 ml-auto font-mono text-[10px]">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart - Monthly Trends */}
        <div className="boq-glass rounded-2xl p-6 border-white/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Tren Proyek per Bulan
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  12 bulan terakhir
                </p>
              </div>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                barSize={32}
                barGap={4}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/20 bg-emerald-900/95 backdrop-blur-md px-4 py-3 shadow-xl">
                        <p className="font-bold text-white text-sm">
                          {data.fullLabel}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="h-3.5 w-3.5 text-accent" />
                          <p className="text-white/80 text-xs">
                            {data.count} proyek
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  animationBegin={400}
                  animationDuration={1000}
                >
                  {monthlyData.map((entry, index) => {
                    const maxCount = Math.max(
                      ...monthlyData.map((d) => d.count),
                      1
                    );
                    const intensity = 0.3 + (entry.count / maxCount) * 0.7;
                    return (
                      <Cell
                        key={`bar-${index}`}
                        fill={
                          entry.count > 0
                            ? `rgba(99, 102, 241, ${intensity})`
                            : "rgba(255,255,255,0.05)"
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Rata-rata per Bulan"
          value={
            monthlyData.length > 0
              ? (
                  monthlyData.reduce((s, m) => s + m.count, 0) /
                  monthlyData.length
                ).toFixed(1)
              : "0"
          }
          suffix="proyek/bln"
        />
        <SummaryCard
          label="Kategori Terbanyak"
          value={
            categoryData.length > 0
              ? categoryData[0].name
              : "-"
          }
          suffix={categoryData.length > 0 && totalCategoryValue > 0
              ? `${(
                  (categoryData[0].value / totalCategoryValue) *
                  100
                ).toFixed(1)}% dari total`
              : ""
          }
        />
        <SummaryCard
          label="Bulan Tersibak"
          value={
            monthlyData.length > 0
              ? monthlyData.reduce((max, m) =>
                  m.count > max.count ? m : max
                ).fullLabel
              : "-"
          }
          suffix={
            monthlyData.length > 0
              ? `${
                  monthlyData.reduce((max, m) =>
                    m.count > max.count ? m : max
                  ).count
                } proyek`
              : ""
          }
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="boq-glass rounded-2xl p-5 border-white/40 hover:-translate-y-0.5 transition-all duration-300">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-foreground truncate">{value}</p>
      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{suffix}</p>
    </div>
  );
}
