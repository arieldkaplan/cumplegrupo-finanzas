"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FinancialRow = {
  id: string;
  name: string;
  expected: number;
  paid: number;
  pending: number;
  completion: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FinancialTable({
  data,
}: {
  data: FinancialRow[];
}) {
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const filteredData = useMemo(() => {
    return data
      .filter((row) =>
        row.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) =>
        sortDesc
          ? b.completion - a.completion
          : a.completion - b.completion
      );
  }, [data, search, sortDesc]);

  return (
    <div className="space-y-4">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <input
          type="text"
          placeholder="Filtrar por grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-xs"
        />

        <button
          type="button"
          onClick={() => setSortDesc(!sortDesc)}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Cumplimiento {sortDesc ? "↓" : "↑"}
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead>
            <tr className="border-b text-left">
              <th className="py-3">Grupo</th>
              <th className="py-3 text-right">Esperado</th>
              <th className="py-3 text-right">Recaudado</th>
              <th className="py-3 text-right">Pendiente</th>
              <th className="py-3 text-right">Cumplimiento</th>
            </tr>
          </thead>

          <tbody>

            {filteredData.map((group) => (
              <tr
                key={group.id}
                className="border-b hover:bg-muted/50"
              >
                <td className="py-3">
                  <Link
                    href={`/grupos/${group.id}`}
                    className="font-medium hover:underline"
                  >
                    {group.name}
                  </Link>
                </td>

                <td className="py-3 text-right">
                  {formatMoney(group.expected)}
                </td>

                <td className="py-3 text-right">
                  {formatMoney(group.paid)}
                </td>

                <td className="py-3 text-right">
                  {formatMoney(group.pending)}
                </td>

                <td className="py-3 text-right">
                  {group.completion.toFixed(1)}%
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}