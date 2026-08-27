import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { logoutAction } from "@/lib/actions/auth";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-brand-bar text-brand-bar-foreground">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
        <Link href="/" aria-label="Início" className="flex items-center">
          <BrandMark className="h-7 w-7" />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="brutal-ghost btn-press px-2 py-1 detail font-medium text-brand-bar-foreground transition-colors hover:bg-white/10 [--ghost:#faf2e6]"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
