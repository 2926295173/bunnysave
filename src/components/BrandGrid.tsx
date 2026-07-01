import Image from "next/image";
import Link from "next/link";
import { type Brand, localImageFor } from "@/lib/deals";

export function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
      {brands.map((b) => (
        <li key={b.id}>
          <Link
            href={`/search?q=${encodeURIComponent(b.name)}`}
            className="group flex aspect-square items-center justify-center rounded-2xl border border-bunny-line bg-white p-2 transition hover:border-bunny-accent hover:shadow-sm"
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
  );
}
