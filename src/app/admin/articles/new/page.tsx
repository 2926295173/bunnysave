import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { ArticleForm, EMPTY_ARTICLE } from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "新建文章 | 省钱兔 Admin", robots: { index: false } };

export default async function NewArticlePage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/articles" className="hover:text-[#F97316]">文章</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">新建</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">新建文章</h1>
      <ArticleForm mode="create" initial={EMPTY_ARTICLE} />
    </div>
  );
}
