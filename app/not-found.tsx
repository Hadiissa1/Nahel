import Link from "next/link";

export default function NotFound() {
  return (
    <main className="honeycomb-bg grid min-h-screen flex-1 place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl font-bold text-amber">404</p>
        <p className="mt-4 text-lg font-semibold text-bark-deep">هذه الصفحة غير موجودة</p>
        <p className="text-bark/70">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-gradient-to-br from-honey to-amber px-6 py-2.5 font-semibold text-white shadow"
        >
          العودة إلى المتجر · Back to the shop
        </Link>
      </div>
    </main>
  );
}
