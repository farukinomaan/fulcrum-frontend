'use client';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
}
