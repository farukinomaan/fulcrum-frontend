"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wallet,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Upload,
  CreditCard,
  Building2,
  MoreHorizontal
} from "lucide-react";

// Dummy Data for Main Area Chart (30-Day Cash Balance)
const cashBalanceData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  balance: 150000 - i * 1000 + Math.random() * 5000 + (i > 15 ? 10000 : 0),
})).map((d) => ({ ...d, balance: Math.round(d.balance) }));

// Dummy Data for Inflows vs Outflows (Bar Chart)
const flowData = [
  { name: "Week 1", in: 24000, out: 18000 },
  { name: "Week 2", in: 13900, out: 28000 },
  { name: "Week 3", in: 9800, out: 12000 },
  { name: "Week 4", in: 39000, out: 24000 },
];

export default function DashboardHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Financial Command Center</h1>
              <p className="text-xs sm:text-sm text-slate-400">Your company&apos;s financial health at a glance.</p>
            </div>
          </div>
          <div>
            <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-0 focus:border-slate-300 block w-full h-9 px-3 shadow-sm hover:border-slate-300 transition-all cursor-pointer">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        {/* Top Row: Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Runway Card */}
          <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full" />
            <div className="ml-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Runway</span>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">8.5 Months</p>
              <div className="mt-2 flex items-center text-sm">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="h-3 w-3" /> +2 mo
                </span>
                <span className="text-slate-400 ml-2 text-xs">vs last month</span>
              </div>
            </div>
          </div>

          {/* Cash on Hand Card */}
          <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600 rounded-r-full" />
            <div className="ml-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                    <Wallet className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Cash on Hand</span>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">$142,500</p>
              <div className="mt-2 flex items-center text-sm">
                <span className="flex items-center gap-1 text-rose-600 font-semibold text-xs bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                  <ArrowDownRight className="h-3 w-3" /> -1.2%
                </span>
                <span className="text-slate-400 ml-2 text-xs">vs last month</span>
              </div>
            </div>
          </div>

          {/* Burn Rate Card */}
          <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
            <div className="ml-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Burn Rate</span>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">$18,200<span className="text-sm font-normal text-slate-400 ml-1">/mo</span></p>
              <div className="mt-2 flex items-center text-sm">
                <span className="flex items-center gap-1 text-slate-500 font-semibold text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  <Minus className="h-3 w-3" /> Stable
                </span>
                <span className="text-slate-400 ml-2 text-xs">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row: Main Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">30-Day Cash Balance Trend</h2>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashBalanceData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--t-slate-100)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--t-slate-400)' }}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--t-slate-400)' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--t-white)',
                      borderRadius: '12px', 
                      border: '1px solid var(--t-slate-200)', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', 
                      fontSize: '13px',
                      color: 'var(--t-slate-900)'
                    }}
                    itemStyle={{ color: 'var(--t-slate-700)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Variance Analysis (1/3 width) */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Budget vs. Actuals</h2>
              <p className="text-xs text-slate-400 mt-0.5">Top spending categories</p>
            </div>
            
            <div className="space-y-5 flex-1">
              {/* Category 1 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Marketing</span>
                  <span className="text-xs text-slate-400 tabular-nums">$4k / $5k</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-[11px] text-emerald-600 mt-1.5 font-semibold flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Under budget
                </p>
              </div>

              {/* Category 2 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Software</span>
                  <span className="text-xs text-slate-400 tabular-nums">$2.5k / $2k</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-[11px] text-rose-600 mt-1.5 font-semibold flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> $500 over budget
                </p>
              </div>

              {/* Category 3 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Office</span>
                  <span className="text-xs text-slate-400 tabular-nums">$1.2k / $1.5k</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-[11px] text-emerald-600 mt-1.5 font-semibold flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Under budget
                </p>
              </div>

              {/* Category 4 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Travel</span>
                  <span className="text-xs text-slate-400 tabular-nums">$3.8k / $3k</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-[11px] text-rose-600 mt-1.5 font-semibold flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> $800 over budget
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Granular Breakdown & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inflows vs Outflows (1/3 width) */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Inflows vs. Outflows</h2>
              <p className="text-xs text-slate-400 mt-0.5">30-day cash flow overview</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--t-slate-100)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--t-slate-400)' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--t-slate-400)' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--t-slate-50)'}}
                    contentStyle={{ 
                      backgroundColor: 'var(--t-white)',
                      borderRadius: '12px', 
                      border: '1px solid var(--t-slate-200)', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', 
                      fontSize: '13px',
                      color: 'var(--t-slate-900)'
                    }}
                    itemStyle={{ color: 'var(--t-slate-700)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="in" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
                  <Bar dataKey="out" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Vendor Spend (1/3 width) */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Top Vendor Spend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Highest expenses this month</p>
            </div>
            <div className="space-y-5">
              {[
                { name: "Amazon Web Services", role: "Cloud Infrastructure", amount: "$8,450", trend: "+12%", up: true },
                { name: "Google Workspace", role: "Productivity", amount: "$3,200", trend: "Stable", up: false, stable: true },
                { name: "Meta Platforms", role: "Advertising", amount: "$2,850", trend: "-5%", up: false },
                { name: "Gusto", role: "Payroll & HR", amount: "$1,800", trend: "+2%", up: true }
              ].map((vendor, i) => (
                <div key={i} className="flex items-center justify-between group hover:bg-slate-50/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition-colors">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{vendor.name}</p>
                      <p className="text-[11px] text-slate-400">{vendor.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{vendor.amount}</p>
                    <p className={`text-[11px] font-semibold ${vendor.stable ? 'text-slate-400' : (vendor.up ? 'text-rose-500' : 'text-emerald-500')}`}>
                      {vendor.trend}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action & Compliance (1/3 width) */}
          <div className="space-y-6 flex flex-col">
            
            {/* Upcoming Bills */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Upcoming Bills</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Next 7 days</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-slate-300 cursor-pointer hover:text-slate-500 transition-colors" />
              </div>
              <div className="space-y-3">
                {[
                  { name: "Salesforce", date: "Tomorrow", amount: "$1,250.00" },
                  { name: "Adobe Creative Cloud", date: "Oct 5", amount: "$450.00" },
                ].map((bill, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{bill.name}</p>
                        <p className="text-[11px] text-slate-400">{bill.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{bill.amount}</span>
                      <button className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all shadow-sm">
                        Pay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Alert */}
            <div className="bg-amber-50/50 rounded-2xl border border-amber-200/60 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full"></div>
              <div className="flex gap-3 ml-2">
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900">Action Required</h3>
                  <p className="text-xs text-amber-700/80 mt-1 mb-3 leading-relaxed">
                    3 transactions {'>'}$500 are missing receipts. Please upload them for compliance.
                  </p>
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition-colors w-fit">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Receipts</span>
                  </button>
                </div>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}