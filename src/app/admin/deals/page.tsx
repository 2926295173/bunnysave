import { requireAdmin } from "@/lib/admin";
import { getCategories } from "@/lib/deals";
import { loadRows } from "./loader";
import AdminDealsClient from "./DealsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "优惠管理 | 省钱兔 Admin", robots: { index: false } };

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const [rows, categories] = await Promise.all([loadRows(q), getCategories()]);
  return (
    <AdminDealsClient
      rows={rows}
      categories={categories}
      q={q ?? ""}
    />
  );
}
