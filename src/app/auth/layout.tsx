export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center gap-8 bg-canvas px-6 py-10">
      {children}
    </div>
  );
}
