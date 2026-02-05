import { DashboardNav } from "@/components/layout/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-stone-50">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
