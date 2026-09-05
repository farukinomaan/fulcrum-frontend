"use client";

import React from "react";

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
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <select
                value={selectedMonth}
                onChange={(e) => onChange(Number(e.target.value), selectedYear)}
                className="bg-transparent text-sm text-zinc-100 font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
            >
                {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1} className="bg-zinc-900 text-zinc-100">
                        {name}
                    </option>
                ))}
            </select>

            <span className="text-zinc-600">/</span>

            <select
                value={selectedYear}
                onChange={(e) => onChange(selectedMonth, Number(e.target.value))}
                className="bg-transparent text-sm text-zinc-100 font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
            >
                {years.map((year) => (
                    <option key={year} value={year} className="bg-zinc-900 text-zinc-100">
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
}
