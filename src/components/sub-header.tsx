import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

type SubHeaderProps = {
  title: string;
  backHref?: string;
  children?: React.ReactNode;
};

export function SubHeader({ title, backHref = "/", children }: SubHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <Link href={backHref} aria-label="Voltar" className="text-fg1 group flex gap-2 items-center">
        <ChevronLeftIcon className="h-5 w-5 group-hover:text-fg1/60" />
        <h1 className="flex-1 truncate heading group-hover:text-fg1/60">{title}</h1>
      </Link>
      {children}
    </div>
  );
}
