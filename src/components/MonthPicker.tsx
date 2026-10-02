"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface MonthPickerProps {
    selectedMonth: number;
    selectedYear: number;
    onChange: (month: number, year: number) => void;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function MonthPicker({
    selectedMonth,
    selectedYear,
    onChange,
}: MonthPickerProps) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
                value={selectedMonth}
                onChange={(e) => onChange(Number(e.target.value), selectedYear)}
                className="text-sm text-slate-700 font-medium bg-transparent border-0 border-b border-slate-200 py-1 pr-6 pl-0 focus:outline-none focus:border-slate-900 cursor-pointer transition-colors hover:text-slate-900 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
                {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1}>
                        {name}
                    </option>
                ))}
            </select>

            <select
                value={selectedYear}
                onChange={(e) => onChange(selectedMonth, Number(e.target.value))}
                className="text-sm text-slate-700 font-medium bg-transparent border-0 border-b border-slate-200 py-1 pr-6 pl-0 focus:outline-none focus:border-slate-900 cursor-pointer transition-colors hover:text-slate-900 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
                {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
}
