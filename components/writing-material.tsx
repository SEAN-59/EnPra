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
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-3 sm:p-5">
      <div className="h-56 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {unit && (
        <p className="mt-2 text-right text-xs text-[#8a756b]">
          <span className="inline-flex rounded-full bg-[#f2ede4] px-2.5 py-1">
            단위: {String(unit)}
          </span>
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

function records(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object',
      )
    : [];
}

function mapPanelsFrom(material: Material) {
  return records(material.mapPanels);
}

function stepsFrom(material: Material) {
  return records(material.steps);
}

function pointList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((point) => {
    if (Array.isArray(point)) {
      const x = numeric(point[0]);
      const y = numeric(point[1]);
      return x !== null && y !== null ? [{ x, y }] : [];
    }
    if (point && typeof point === 'object') {
      const x = numeric((point as Record<string, unknown>).x);
      const y = numeric((point as Record<string, unknown>).y);
      return x !== null && y !== null ? [{ x, y }] : [];
    }
    return [];
  });
}

function clamped(value: unknown, fallback: number, maximum: number) {
  return Math.min(maximum, Math.max(0, numeric(value) ?? fallback));
}

function mapText(value: unknown, max = 14) {
  const text = label(value, '');
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  });
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function MapFeature({
  feature,
  index,
  markerId,
}: {
  feature: Record<string, unknown>;
  index: number;
  markerId: string;
}) {
  const type = label(feature.type, 'area');
  const x = clamped(feature.x, 8 + (index % 4) * 21, 92);
  const y = clamped(feature.y, 10 + Math.floor(index / 4) * 21, 88);
  const width = Math.min(38, Math.max(8, numeric(feature.width) ?? 18));
  const height = Math.min(26, Math.max(6, numeric(feature.height) ?? 12));
  const color = label(feature.color, palette[index % palette.length]);
  const name = label(feature.label ?? feature.text, '');
  const points = pointList(feature.points);
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ');
  const isBridge = type === 'bridge' || /\bbridge\b/i.test(name);
  if (type === 'road' || type === 'river' || type === 'path') {
    const start = points[0] ?? { x, y };
    const end = points[points.length - 1] ?? { x: x + width, y: y + height };
    const roadName = type === 'road' ? name || 'Road' : '';
    return (
      <g>
        <polyline
          points={pointString || `${x},${y} ${x + width},${y + height}`}
          fill="none"
          stroke={
            type === 'river' ? '#3c8daa' : type === 'path' ? color : '#62736f'
          }
          strokeWidth={type === 'road' ? 2.35 : 2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={type === 'path' ? '3 2' : undefined}
        />
        {roadName && (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 2.5}
            textAnchor="middle"
            fontSize="3.6"
            fontWeight="700"
            fill="#43504d"
            stroke="#eaf0eb"
            strokeWidth="1.5"
            paintOrder="stroke"
          >
            {roadName}
          </text>
        )}
      </g>
    );
  }
  if (isBridge) {
    const start = points[0] ?? { x, y: y + height / 2 };
    const end = points[points.length - 1] ?? {
      x: x + width,
      y: y + height / 2,
    };
    const distance = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    const offsetX = (-(end.y - start.y) / distance) * 1.3;
    const offsetY = ((end.x - start.x) / distance) * 1.3;
    const displayName = name || 'Bridge';
    return (
      <g>
        <line
          x1={start.x + offsetX}
          y1={start.y + offsetY}
          x2={end.x + offsetX}
          y2={end.y + offsetY}
          stroke="#5b625f"
          strokeWidth="1.25"
        />
        <line
          x1={start.x - offsetX}
          y1={start.y - offsetY}
          x2={end.x - offsetX}
          y2={end.y - offsetY}
          stroke="#5b625f"
          strokeWidth="1.25"
        />
        <line
          x1={start.x + offsetX}
          y1={start.y + offsetY}
          x2={start.x - offsetX}
          y2={start.y - offsetY}
          stroke="#5b625f"
          strokeWidth="1"
        />
        <line
          x1={end.x + offsetX}
          y1={end.y + offsetY}
          x2={end.x - offsetX}
          y2={end.y - offsetY}
          stroke="#5b625f"
          strokeWidth="1"
        />
        {displayName && (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 4}
            textAnchor="middle"
            fontSize="3.5"
            fontWeight="700"
            fill="#4f5a56"
          >
            {displayName}
          </text>
        )}
      </g>
    );
  }
  if (type === 'arrow') {
    const start = points[0] ?? { x, y };
    const end = points[points.length - 1] ?? { x: x + width, y: y + height };
    return (
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth="1.8"
        markerEnd={`url(#${markerId})`}
      />
    );
  }
  if (type === 'label')
    return (
      <text x={x} y={y} fontSize="3.8" fontWeight="700" fill="#344149">
        {name}
      </text>
    );
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={type === 'area' ? 1.5 : 3}
        fill={type === 'area' ? '#edf1e8' : '#fffdf8'}
        fillOpacity="1"
        stroke={color}
        strokeWidth="1.2"
      />
      {mapText(name).map((line, lineIndex) => (
        <text
          key={`${line}-${lineIndex}`}
          x={x + width / 2}
          y={
            y + height / 2 - (mapText(name).length - 1) * 2.3 + lineIndex * 4.6
          }
          textAnchor="middle"
          fontSize="3.6"
          fontWeight="700"
          fill="#344149"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function MapPanels({ panels }: { panels: Record<string, unknown>[] }) {
  return (
    <div
      className={`mt-5 grid gap-4 ${panels.length > 1 ? 'md:grid-cols-2' : ''}`}
    >
      {panels.slice(0, 2).map((panel, index) => {
        const zones = records(panel.zones);
        const features = records(panel.features);
        const mapFeatures = features.length
          ? features
          : zones.map((zone) => ({ ...zone, type: 'building' }));
        const markerId = `map-arrow-${index}`;
        return (
          <figure
            key={index}
            className="rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-4"
          >
            <figcaption className="mb-3 text-sm font-bold text-[#38634f]">
              {label(panel.label, index === 0 ? 'Before' : 'After')}
            </figcaption>
            <svg
              viewBox="0 0 100 100"
              className="h-auto w-full rounded-xl bg-[#eaf0eb]"
              role="img"
              aria-label={label(panel.label, '지도 자료')}
            >
              <defs>
                <marker
                  id={markerId}
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="#d76a47" />
                </marker>
              </defs>
              <rect width="100" height="100" fill="#eaf0eb" />
              {mapFeatures.map((feature, featureIndex) => (
                <MapFeature
                  key={featureIndex}
                  feature={feature}
                  index={featureIndex}
                  markerId={markerId}
                />
              ))}
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

function ProcessDiagram({ steps }: { steps: Record<string, unknown>[] }) {
  const columns = steps.length > 4 ? 2 : 1;
  const rows = Math.ceil(steps.length / columns);
  const viewHeight = rows * 35 + 14;
  const markerId = 'process-arrow';
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#ece5da] bg-[#fbf9f4] p-3 sm:p-5">
      <svg
        viewBox={`0 0 100 ${viewHeight}`}
        className="h-auto w-full"
        role="img"
        aria-label="공정도 자료"
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#d76a47" />
          </marker>
        </defs>
        {steps.map((step, index) => {
          const column = columns === 1 ? 0 : index % columns;
          const row = columns === 1 ? index : Math.floor(index / columns);
          const x = columns === 1 ? 10 : 6 + column * 49;
          const y = 7 + row * 35;
          const nodeWidth = columns === 1 ? 80 : 39;
          const nextIndex = index + 1;
          const nextColumn = columns === 1 ? 0 : nextIndex % columns;
          const nextRow =
            columns === 1 ? nextIndex : Math.floor(nextIndex / columns);
          const nextX = columns === 1 ? 10 : 6 + nextColumn * 49;
          const nextY = 7 + nextRow * 35;
          const titleLines = mapText(step.label, columns === 1 ? 30 : 14);
          const descriptionLines = mapText(
            step.description,
            columns === 1 ? 42 : 18,
          );
          return (
            <g key={index}>
              {nextIndex < steps.length && (
                <line
                  x1={x + nodeWidth / 2}
                  y1={y + 25}
                  x2={nextX + nodeWidth / 2}
                  y2={nextY - 2}
                  stroke="#d76a47"
                  strokeWidth="1.2"
                  markerEnd={`url(#${markerId})`}
                />
              )}
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height="25"
                rx="4"
                fill="#fffdf8"
                stroke="#d8cbbb"
              />
              <circle cx={x + 7} cy={y + 7} r="4" fill="#d76a47" />
              <text
                x={x + 7}
                y={y + 8.4}
                textAnchor="middle"
                fontSize="4"
                fontWeight="700"
                fill="#fffdf8"
              >
                {index + 1}
              </text>
              {titleLines.map((line, lineIndex) => (
                <text
                  key={`title-${lineIndex}`}
                  x={x + 14}
                  y={y + 7 + lineIndex * 4.2}
                  fontSize="4"
                  fontWeight="700"
                  fill="#344149"
                >
                  {line}
                </text>
              ))}
              {descriptionLines.slice(0, 2).map((line, lineIndex) => (
                <text
                  key={`description-${lineIndex}`}
                  x={x + 5}
                  y={y + 17 + lineIndex * 4}
                  fontSize="3.4"
                  fill="#69736e"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
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
  const mapPanels = mapPanelsFrom(material);
  const steps = stepsFrom(material);
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
            <Legend verticalAlign="bottom" height={32} />
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
            <Legend verticalAlign="bottom" height={32} />
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
            <Legend verticalAlign="bottom" height={54} />
            <Pie
              data={rows.map((row) => ({
                name: row.label,
                value: numeric(row.value) ?? 0,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="42%"
              outerRadius="58%"
            >
              {rows.map((_, index) => (
                <Cell key={index} fill={palette[index % palette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartFrame>
      );
    if (format === 'map')
      return mapPanels.length ? (
        <MapPanels panels={mapPanels} />
      ) : (
        <DataTable rows={rows} />
      );
    if (format === 'diagram')
      return steps.length ? (
        <ProcessDiagram steps={steps} />
      ) : (
        <DataTable rows={rows} />
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
