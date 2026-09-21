import type { RosterCsvRow } from "@/lib/services/rosterCsvIngest";

export function RosterCsvPreviewTable({
  rows,
}: {
  rows: RosterCsvRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 font-semibold">id</th>
            <th className="px-3 py-2 font-semibold">name</th>
            <th className="px-3 py-2 font-semibold">breed</th>
            <th className="px-3 py-2 font-semibold">age</th>
            <th className="px-3 py-2 font-semibold">sex</th>
            <th className="px-3 py-2 font-semibold">hold</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-3 py-1.5 font-mono">{row.id}</td>
              <td className="px-3 py-1.5">{row.name}</td>
              <td className="px-3 py-1.5">{row.breed}</td>
              <td className="px-3 py-1.5">{row.ageYears ?? "—"}</td>
              <td className="px-3 py-1.5">{row.sex ?? "—"}</td>
              <td className="px-3 py-1.5">
                {row.holdCleared ? "cleared" : "hold"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 20 ? (
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          Showing first 20 of {rows.length}.
        </p>
      ) : null}
    </div>
  );
}
