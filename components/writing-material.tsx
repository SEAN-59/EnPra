'use client';

import type { ReactElement } from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Material = Record<string, unknown>;
type MaterialRow = {
  label: string;
  value: number | string;
  [key: string]: unknown;
};

const palette = ['#d76a47', '#38634f', '#cf9c42', '#577c91', '#9d6275'];

function numeric(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function label(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function rowsFrom(material: Material): MaterialRow[] {
  if (!Array.isArray(material.rows)) return [];
  return material.rows.flatMap((item, index) =>
    item && typeof item === 'object'
      ? [
          {
            ...(item as Record<string, unknown>),
            label: label(
              (item as Record<string, unknown>).label,
              `항목 ${index + 1}`,
            ),
            value: (item as Record<string, unknown>).value ?? '',
          } as MaterialRow,
        ]
      : [],
  );
}

function seriesData(material: Material) {
  const categories = Array.isArray(material.categories)
    ? material.categories.map((item, index) => label(item, `${index + 1}`))
    : [];
  const series = Array.isArray(material.series)
    ? material.series.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object',
      )
    : [];
  if (!categories.length || !series.length) return null;
  const keys = series.map((item, index) => ({
    key: `series${index}`,
    name: label(item.name, `Series ${index + 1}`),
    values: Array.isArray(item.data) ? item.data : [],
  }));
  return {
    keys,
    data: categories.map((category, index) =>
      Object.fromEntries([
        ['label', category],
        ...keys.map((entry) => [entry.key, numeric(entry.values[index]) ?? 0]),
      ]),
    ),
  };
}

function ChartFrame({
  children,
  unit,
}: {
  children: ReactElement;
  unit?: unknown;
}) {
  return (
    <div className="mt-5 h-72 rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-3 sm:p-5">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
      {unit && (
        <p className="mt-1 text-right text-xs text-[#8a756b]">
          단위: {String(unit)}
        </p>
      )}
    </div>
  );
}

function DataTable({ rows }: { rows: MaterialRow[] }) {
  if (!rows.length) return null;
  const columns = Array.from(
    new Set(
      rows.flatMap((row) => Object.keys(row).filter((key) => key !== 'label')),
    ),
  );
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-[#ece5da]">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-[#f6f1e8]">
          <tr>
            <th className="px-4 py-3 font-bold text-[#344149]">항목</th>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-bold text-[#344149]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.label}-${index}`}
              className="border-t border-[#ece5da]"
            >
              <th className="px-4 py-3 font-semibold text-[#344149]">
                {row.label}
              </th>
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 text-[#69736e]">
                  {String(row[column] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapPanels({ material }: { material: Material }) {
  const panels = Array.isArray(material.mapPanels)
    ? material.mapPanels.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object',
      )
    : [];
  if (!panels.length) return null;
  return (
    <div
      className={`mt-5 grid gap-4 ${panels.length > 1 ? 'md:grid-cols-2' : ''}`}
    >
      {panels.slice(0, 2).map((panel, index) => {
        const zones = Array.isArray(panel.zones)
          ? panel.zones.filter(
              (item): item is Record<string, unknown> =>
                Boolean(item) && typeof item === 'object',
            )
          : [];
        return (
          <figure
            key={index}
            className="rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-4"
          >
            <figcaption className="mb-3 text-sm font-bold text-[#38634f]">
              {label(panel.label, index === 0 ? 'Before' : 'After')}
            </figcaption>
            <svg
              viewBox="0 0 100 72"
              className="h-auto w-full rounded-xl bg-[#eaf0eb]"
              role="img"
              aria-label={label(panel.label, '지도 자료')}
            >
              <path
                d="M4 16 C28 5, 60 22, 96 11 M6 58 C30 48, 59 68, 95 53"
                fill="none"
                stroke="#9fb9aa"
                strokeWidth="5"
                opacity=".8"
              />
              {zones.map((zone, zoneIndex) => {
                const x = Math.min(
                  88,
                  Math.max(4, numeric(zone.x) ?? 12 + (zoneIndex % 3) * 29),
                );
                const y = Math.min(
                  58,
                  Math.max(
                    5,
                    numeric(zone.y) ?? 12 + Math.floor(zoneIndex / 3) * 26,
                  ),
                );
                return (
                  <g key={zoneIndex}>
                    <rect
                      x={x}
                      y={y}
                      width="18"
                      height="12"
                      rx="2"
                      fill={palette[zoneIndex % palette.length]}
                      opacity=".9"
                    />
                    <text
                      x={x + 9}
                      y={y + 8}
                      textAnchor="middle"
                      fontSize="4"
                      fill="#fffdf8"
                    >
                      {label(zone.label, `Z${zoneIndex + 1}`).slice(0, 10)}
                    </text>
                  </g>
                );
              })}
            </svg>
            {zones.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs leading-5 text-[#69736e]">
                {zones.map((zone, zoneIndex) => (
                  <li key={zoneIndex}>
                    <span className="font-semibold text-[#344149]">
                      {label(zone.label, `구역 ${zoneIndex + 1}`)}
                    </span>
                    {zone.note ? ` · ${String(zone.note)}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </figure>
        );
      })}
    </div>
  );
}

function ProcessDiagram({ material }: { material: Material }) {
  const steps = Array.isArray(material.steps)
    ? material.steps.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object',
      )
    : [];
  if (!steps.length) return null;
  return (
    <ol className="mt-5 grid gap-3 sm:grid-cols-2">
      {steps.map((step, index) => (
        <li
          key={index}
          className="relative rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-4"
        >
          <span className="grid size-7 place-items-center rounded-full bg-[#d76a47] text-xs font-bold text-white">
            {index + 1}
          </span>
          <p className="mt-3 font-semibold text-[#344149]">
            {label(step.label, `Step ${index + 1}`)}
          </p>
          {step.description && (
            <p className="mt-1 text-sm leading-6 text-[#69736e]">
              {String(step.description)}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function WritingMaterial({
  format,
  material,
}: {
  format?: string;
  material: Material;
}) {
  const rows = rowsFrom(material);
  const series = seriesData(material);
  const title = label(material.title, '자료');
  const formatLabel: Record<string, string> = {
    bar_chart: 'Bar chart',
    line_chart: 'Line chart',
    pie_chart: 'Pie chart',
    table: 'Table',
    map: 'Map',
    diagram: 'Process diagram',
  };
  const content = (() => {
    if (format === 'bar_chart' && series)
      return (
        <ChartFrame unit={material.unit}>
          <BarChart data={series.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ded2" />
            <XAxis dataKey="label" tick={{ fill: '#69736e', fontSize: 12 }} />
            <YAxis tick={{ fill: '#69736e', fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {series.keys.map((entry, index) => (
              <Bar
                key={entry.key}
                dataKey={entry.key}
                name={entry.name}
                fill={palette[index % palette.length]}
                radius={[5, 5, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartFrame>
      );
    if (format === 'line_chart' && series)
      return (
        <ChartFrame unit={material.unit}>
          <LineChart data={series.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ded2" />
            <XAxis dataKey="label" tick={{ fill: '#69736e', fontSize: 12 }} />
            <YAxis tick={{ fill: '#69736e', fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {series.keys.map((entry, index) => (
              <Line
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.name}
                stroke={palette[index % palette.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ChartFrame>
      );
    if (format === 'pie_chart' && rows.length)
      return (
        <ChartFrame unit={material.unit}>
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={rows.map((row) => ({
                name: row.label,
                value: numeric(row.value) ?? 0,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="78%"
              label
            >
              {rows.map((_, index) => (
                <Cell key={index} fill={palette[index % palette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartFrame>
      );
    if (format === 'map')
      return <MapPanels material={material} /> ?? <DataTable rows={rows} />;
    if (format === 'diagram')
      return (
        <ProcessDiagram material={material} /> ?? <DataTable rows={rows} />
      );
    return <DataTable rows={rows} />;
  })();
  return (
    <section className="mt-5 rounded-3xl border border-[#dcd6ca] bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(35,44,43,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[.16em] text-[#d76a47]">
            SOURCE MATERIAL
          </p>
          <h3 className="mt-1 font-serif text-2xl text-[#24333a]">{title}</h3>
        </div>
        <span className="rounded-full bg-[#eef5f0] px-3 py-1 text-xs font-bold text-[#38634f]">
          {formatLabel[format ?? ''] ?? 'Data'}
        </span>
      </div>
      {material.description && (
        <p className="mt-3 text-sm leading-6 text-[#69736e]">
          {String(material.description)}
        </p>
      )}
      {content}
    </section>
  );
}
