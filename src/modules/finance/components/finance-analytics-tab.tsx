// src/modules/finance/components/finance-analytics-tab.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { FinanceTransaction, FinanceCategory } from "../types";

interface FinanceAnalyticsTabProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
}

const CHART_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#6B7280", // Gray
];

export function FinanceAnalyticsTab({
  transactions,
  categories,
}: FinanceAnalyticsTabProps) {
  const t = useTranslations("finance");

  // Generate list of past 6 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });
      options.push({ value: yearMonth, label });
    }
    return options;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || "");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Category breakdown for pie chart (expenses only)
  const categoryData = useMemo(() => {
    const expensesByCategory: Record<string, { name: string; amount: number }> = {};

    monthTransactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const categoryName = tx.category?.name || t("categories.expense.other");
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = { name: categoryName, amount: 0 };
        }
        expensesByCategory[categoryName].amount += Number(tx.amount);
      });

    return Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, t]);

  // Monthly totals for bar chart
  const monthSummary = useMemo(() => {
    const income = monthTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = monthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return [
      { name: t("transactions.types.income"), amount: income, fill: "#10B981" },
      { name: t("transactions.types.expense"), amount: expense, fill: "#EF4444" },
    ];
  }, [monthTransactions, t]);

  // Trend data for line chart (past 6 months)
  const trendData = useMemo(() => {
    const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};

    // Initialize all months
    monthOptions.forEach((opt) => {
      const date = new Date(opt.value + "-01");
      const label = date.toLocaleDateString("zh-TW", { month: "short" });
      monthlyData[opt.value] = { month: label, income: 0, expense: 0 };
    });

    // Aggregate transactions
    transactions.forEach((tx) => {
      const yearMonth = tx.date.substring(0, 7);
      if (monthlyData[yearMonth]) {
        if (tx.type === "income") {
          monthlyData[yearMonth].income += Number(tx.amount);
        } else if (tx.type === "expense") {
          monthlyData[yearMonth].expense += Number(tx.amount);
        }
      }
    });

    // Return in chronological order (oldest to newest)
    return monthOptions
      .map((opt) => monthlyData[opt.value])
      .reverse();
  }, [transactions, monthOptions]);

  const hasData = categoryData.length > 0 || monthSummary.some((d) => d.amount > 0);

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-brand-deep-gray" htmlFor="month-select">
            {t("reports.monthlySummary")}
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm"
            aria-label={t("reports.monthlySummary")}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {!hasData ? (
        <GlassCard className="p-12 text-center">
          <p className="text-brand-deep-gray">{t("reports.noData")}</p>
        </GlassCard>
      ) : (
        <>
          {/* Income vs Expense Bar Chart */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("reports.monthlySummary")}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {monthSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Expense Breakdown Pie Chart */}
          {categoryData.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-4">{t("reports.byCategory")}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                      contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {/* Trends Line Chart */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("reports.trends")}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name={t("transactions.types.income")}
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name={t("transactions.types.expense")}
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: "#EF4444" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
