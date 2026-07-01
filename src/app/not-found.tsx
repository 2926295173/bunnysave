import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
      <p className="text-7xl">🐰</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-bunny-ink">没找到这个页面</h1>
      <p className="mt-2 text-bunny-muted">它可能被搬走了，或者还在路上。</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-bunny-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
      >
        回到首页
      </Link>
    </div>
  );
}
