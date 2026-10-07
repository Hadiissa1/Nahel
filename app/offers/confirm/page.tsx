import { Suspense } from "react";
import { connection } from "next/server";
import { findByToken } from "@/lib/subscribers";
import { TokenPage } from "@/app/offers/TokenPage";

export const metadata = { robots: { index: false, follow: false } };

export default function Page({ searchParams }: PageProps<"/offers/confirm">) {
  return (
    <Suspense fallback={null}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/offers/confirm">["searchParams"] }) {
  await connection();
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const sub = findByToken(token);
  const valid = !!sub?.email;
  return <TokenPage mode="confirm" token={token} valid={valid} />;
}
