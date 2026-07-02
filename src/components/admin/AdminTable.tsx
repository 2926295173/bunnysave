import Link from "next/link";

type Column = { key: string; label: string; width?: string };

export function AdminTable({
  columns,
  rows,
}: {
  columns: Column[];
  rows: {
    key: string;
    href?: string;
    cells: React.ReactNode;
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${c.width ?? ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const inner = r.cells;
                return (
                  <tr key={r.key} className="transition hover:bg-gray-50/50">
                    {r.href ? (
                      <td colSpan={columns.length} className="p-0">
                        <Link href={r.href} className="block">
                          <table className="w-full">
                            <tbody>
                              <tr>{inner}</tr>
                            </tbody>
                          </table>
                        </Link>
                      </td>
                    ) : (
                      inner
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
