import { Navbar } from "@/components/navbar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex flex-col bg-brand-bar min-h-screen">
      <Navbar />
      <div className="w-full min-h-full flex-1 bg-cream rounded-t-[10px] flex justify-center overflow-x-clip">
        <main className="w-full max-w-3xl min-h-full px-4 py-5">{children}</main>
      </div>
    </div>
  );
}
