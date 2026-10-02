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
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Financial Command Center</h1>
            <p className="text-sm text-gray-500 mt-1">Your company's financial health at a glance.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        {/* Top Row: Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Runway Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Runway</h3>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">8.5 Months</p>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="flex items-center text-green-600 font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +2 mo
              </span>
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          {/* Cash on Hand Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Cash on Hand</h3>
              <Wallet className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">$142,500</p>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="flex items-center text-red-600 font-medium">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                -1.2%
              </span>
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          {/* Burn Rate Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Burn Rate</h3>
              <TrendingDown className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">$18,200<span className="text-sm font-normal text-gray-500 ml-1">/mo</span></p>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="flex items-center text-gray-600 font-medium">
                <Minus className="h-4 w-4 mr-1" />
                Stable
              </span>
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
        </div>

        {/* Middle Row: Main Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-semibold text-gray-900">30-Day Cash Balance Trend</h2>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashBalanceData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900">Budget vs. Actuals</h2>
              <p className="text-sm text-gray-500 mt-1">Top spending categories</p>
            </div>
            
            <div className="space-y-6 flex-1">
              {/* Category 1 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Marketing</span>
                  <span className="text-sm text-gray-500">$4k / $5k</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Under budget
                </p>
              </div>

              {/* Category 2 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Software</span>
                  <span className="text-sm text-gray-500">$2.5k / $2k</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> $500 over budget
                </p>
              </div>

              {/* Category 3 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Office</span>
                  <span className="text-sm text-gray-500">$1.2k / $1.5k</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Under budget
                </p>
              </div>

              {/* Category 4 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Travel</span>
                  <span className="text-sm text-gray-500">$3.8k / $3k</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> $800 over budget
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Granular Breakdown & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inflows vs Outflows (1/3 width) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900">Inflows vs. Outflows</h2>
              <p className="text-sm text-gray-500 mt-1">30-day cash flow overview</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="in" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="out" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Vendor Spend (1/3 width) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900">Top Vendor Spend</h2>
              <p className="text-sm text-gray-500 mt-1">Highest expenses this month</p>
            </div>
            <div className="space-y-6">
              {[
                { name: "Amazon Web Services", role: "Cloud Infrastructure", amount: "$8,450", trend: "+12%", up: true },
                { name: "Google Workspace", role: "Productivity", amount: "$3,200", trend: "Stable", up: false, stable: true },
                { name: "Meta Platforms", role: "Advertising", amount: "$2,850", trend: "-5%", up: false },
                { name: "Gusto", role: "Payroll & HR", amount: "$1,800", trend: "+2%", up: true }
              ].map((vendor, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-500">{vendor.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{vendor.amount}</p>
                    <p className={`text-xs font-medium ${vendor.stable ? 'text-gray-500' : (vendor.up ? 'text-red-500' : 'text-green-500')}`}>
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Upcoming Bills</h2>
                  <p className="text-sm text-gray-500 mt-1">Next 7 days</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              <div className="space-y-4">
                {[
                  { name: "Salesforce", date: "Tomorrow", amount: "$1,250.00" },
                  { name: "Adobe Creative Cloud", date: "Oct 5", amount: "$450.00" },
                ].map((bill, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bill.name}</p>
                        <p className="text-xs text-gray-500">{bill.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{bill.amount}</span>
                      <button className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors">
                        Pay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Alert */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-800">Action Required</h3>
                  <p className="text-sm text-amber-700 mt-1 mb-3">
                    3 transactions {'>'}$500 are missing receipts. Please upload them for compliance.
                  </p>
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-md transition-colors w-fit">
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