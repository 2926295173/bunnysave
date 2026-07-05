"use client";

import Link from "next/link";
import { type ReactNode } from "react";

type Column = {
  key: string;
  label: string | ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  /** When true, the cell content is wrapped in a Link to `row.href`. */
  link?: boolean;
};

export type AdminTableRow = {
  key: string;
  href?: string;
  cells: ReactNode[]; // one entry per column, plain content (string/jsx)
};

export function AdminTable({
  columns,
  rows,
  selectable = false,
  selected,
  onToggleRow,
  onToggleAll,
  emptyText = "暂无数据",
}: {
  columns: Column[];
  rows: AdminTableRow[];
  selectable?: boolean;
  selected?: Set<string>;
  onToggleRow?: (key: string, on: boolean) => void;
  onToggleAll?: (on: boolean) => void;
  emptyText?: string;
}) {
  const allKeys = rows.map((r) => r.key);
  const allSelected = selectable && allKeys.length > 0 && allKeys.every((k) => selected?.has(k));
  const someSelected = selectable && allKeys.some((k) => selected?.has(k));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {selectable ? (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="全选"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={(e) => onToggleAll?.(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-[#F97316]"
                  />
                </th>
              ) : null}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={
                    "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 " +
                    (c.align === "right" ? "text-right " : c.align === "center" ? "text-center " : "text-left ") +
                    (c.width ?? "")
                  }
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={(selectable ? 1 : 0) + columns.length}
                  className="px-3 py-12 text-center text-sm text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.key}
                  className={
                    "transition group " +
                    (selectable && selected?.has(r.key) ? "bg-orange-50/40 " : "hover:bg-gray-50/50 ")
                  }
                >
                  {selectable ? (
                    <td
                      className="w-10 px-3 py-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label="选择行"
                        checked={selected?.has(r.key) ?? false}
                        onChange={(e) => onToggleRow?.(r.key, e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-[#F97316]"
                      />
                    </td>
                  ) : null}
                  {r.cells.map((c, idx) => {
                    const col = columns[idx];
                    const cellCls =
                      "px-3 py-2.5 " +
                      (col?.align === "right"
                        ? "text-right "
                        : col?.align === "center"
                          ? "text-center "
                          : "") +
                      (col?.width ?? "");
                    const inner = col?.link && r.href ? (
                      <Link
                        href={r.href}
                        className="block text-sm text-gray-700 group-hover:text-[#F97316] hover:text-[#F97316]"
                      >
                        {c}
                      </Link>
                    ) : (
                      <>{c}</>
                    );
                    return <td key={idx} className={cellCls}>{inner}</td>;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
