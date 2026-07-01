import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { localImageFor } from "@/lib/image-path";
import { getBrands } from "@/lib/deals";

export const metadata: Metadata = {
  title: "全部商家 | 省钱兔",
  description: "查看 bunnysave.com 收录的全部商家列表，按字母排序。",
};

export const revalidate = 600;

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const brands = (await getBrands()).slice().sort((a, b) => a.name.localeCompare(b.name));
  const filtered = term ? brands.filter((b) => b.name.toLowerCase().includes(term)) : brands;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <nav className="mb-4 text-sm text-bunny-muted" aria-label="面包屑">
        <Link href="/" className="hover:text-[#F97316]">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-bunny-ink">全部商家</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 md:text-4xl">
          全部商家
        </h1>
        <p className="mt-2 text-bunny-muted">
          点击任意商家查看其全部优惠。我们也欢迎 <Link href="/submit" className="font-semibold text-[#F97316] hover:underline">提交新商家</Link>。
        </p>
      </header>

      <form className="mb-6">
        <label className="block">
          <span className="sr-only">搜索商家</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="搜索商家名称（例：Amazon、Walmart…）"
            className="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm outline-none focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
          />
        </label>
      </form>

      <p className="mb-4 text-sm text-bunny-muted">
        {term
          ? `匹配到 ${filtered.length} 个商家`
          : `共收录 ${brands.length} 个商家`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-bunny-muted">
          没有匹配 “{q}” 的商家。
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {filtered.map((b) => (
            <li key={b.id}>
              <Link
                href={`/search?q=${encodeURIComponent(b.name)}`}
                className="group flex aspect-square items-center justify-center rounded-2xl border border-gray-100 bg-white p-2 transition hover:border-[#F97316] hover:shadow-sm"
                title={b.name}
                aria-label={b.name}
              >
                <Image
                  src={localImageFor(b.logo, "brands")}
                  alt={b.name}
                  width={120}
                  height={120}
                  className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
