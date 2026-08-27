export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-cream p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "url(/pattern.svg)", backgroundRepeat: "repeat" }}
      />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
