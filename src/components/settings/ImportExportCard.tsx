"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  FileSpreadsheet,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Info,
  RefreshCw,
} from "lucide-react";
import type PapaType from "papaparse";
import {
  detectColumnMapping,
  detectDateFormat,
  applyMapping,
  parseAmount,
  inferTypeFromString,
} from "@/lib/csv-utils";
import type { InternalField, ColumnMap } from "@/lib/csv-utils";
import { useFormatCurrency } from "@/hooks/use-format-currency";

let Papa: typeof PapaType;

async function getPapa() {
  if (!Papa) {
    Papa = (await import("papaparse")).default;
  }
  return Papa;
}

type ImportStep = "select" | "mapping" | "categories" | "preview" | "importing" | "done";

interface CategoryInfo {
  id: string;
  name: string;
  type: string;
}

interface PreviewResult {
  valid: number;
  errors: { row: number; error: string }[];
  duplicates: number;
  total: number;
  sampleValid: Record<string, unknown>[];
}

const INTERNAL_FIELD_LABELS: Record<InternalField, string> = {
  date: "Date",
  amount: "Amount",
  type: "Type",
  description: "Description",
  category: "Category",
  income_amount: "Income Amount",
  expense_amount: "Expense Amount",
  skip: "Skip column",
};

const INTERNAL_FIELD_OPTIONS: { value: InternalField; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Amount" },
  { value: "type", label: "Type" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "income_amount", label: "Income Amount (split)" },
  { value: "expense_amount", label: "Expense Amount (split)" },
  { value: "skip", label: "Skip column" },
];

export default function ImportExportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const fmt = useFormatCurrency();

  const [step, setStep] = useState<ImportStep>("select");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMap>({});
  const [detectedDateFormat, setDetectedDateFormat] = useState("yyyy-MM-dd");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const [mappedData, setMappedData] = useState<
    { date: string; amount: number; type: string; description: string; category: string }[]
  >([]);

  const [allCategories, setAllCategories] = useState<CategoryInfo[]>([]);
  const [categoryMapping, setCategoryMapping] = useState<Map<string, string>>(new Map());
  const [newCategoryNames, setNewCategoryNames] = useState<Set<string>>(new Set());

  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    total: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);

  function resetImport() {
    setStep("select");
    setCsvFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setMappedData([]);
    setAllCategories([]);
    setCategoryMapping(new Map());
    setNewCategoryNames(new Set());
    setPreviewResult(null);
    setImportResult(null);
    setMessage("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resetImport();
    setCsvFile(file);

    const p = await getPapa();
    p.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data as Record<string, unknown>[];
        if (rows.length === 0) {
          setMessage("CSV file is empty");
          return;
        }
        const meta = results.meta;
        const headers = meta.fields ?? Object.keys(rows[0] ?? {});
        setRawHeaders(headers);
        setRawRows(rows);

        const dateSamples = rows.slice(0, 10).map((r) => String(r[headers[0]] ?? ""));
        const df = detectDateFormat(dateSamples);
        setDetectedDateFormat(df);

        const detected = detectColumnMapping(headers);
        setColumnMapping(detected);

        setStep("mapping");
      },
      error() {
        setMessage("Failed to parse CSV file");
      },
    });
  }

  function handleMappingChange(csvHeader: string, target: InternalField) {
    setColumnMapping((prev) => {
      const next = { ...prev };

      for (const [h, f] of Object.entries(next)) {
        if (f === target && h !== csvHeader) {
          next[h] = "skip";
        }
      }
      next[csvHeader] = target;
      return next;
    });
  }

  async function proceedToCategories() {
    setProcessing(true);
    setMessage("");

    const mapped = applyMapping(rawRows, columnMapping);
    setMappedData(mapped);

    try {
      const res = await fetch("/api/categories");
      const cats = await res.json();
      const filtered: CategoryInfo[] = (Array.isArray(cats) ? cats : []).filter(
        (c: CategoryInfo) => c.name && c.type
      );
      setAllCategories(filtered);

      const uniqueCats = new Set(
        mapped.map((r) => r.category.trim()).filter(Boolean)
      );

      const cm = new Map<string, string>();
      const newNames = new Set<string>();

      for (const catName of uniqueCats) {
        const match = filtered.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
        if (match) {
          cm.set(catName, match.id);
        } else {
          cm.set(catName, "");
          newNames.add(catName);
        }
      }

      setCategoryMapping(cm);
      setNewCategoryNames(newNames);
      setStep("categories");
    } catch {
      setMessage("Failed to load categories");
    } finally {
      setProcessing(false);
    }
  }

  function handleCategoryMap(csvCat: string, categoryId: string) {
    setCategoryMapping((prev) => {
      const next = new Map(prev);
      next.set(csvCat, categoryId);
      return next;
    });
  }

  function resolveCategory(catName: string): string {
    if (!catName) return "";
    return categoryMapping.get(catName) ?? "";
  }

  async function proceedToPreview() {
    setProcessing(true);
    setMessage("");

    const body = {
      transactions: mappedData,
      categoryMapping: Object.fromEntries(categoryMapping),
    };

    try {
      const res = await fetch("/api/transactions/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setMessage(d.error || "Preview failed");
        return;
      }

      const data = await res.json();
      setPreviewResult(data);
      setStep("preview");
    } catch {
      setMessage("Connection error during preview");
    } finally {
      setProcessing(false);
    }
  }

  async function handleImport() {
    setStep("importing");
    setMessage("");

    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: mappedData,
          categoryMapping: Object.fromEntries(categoryMapping),
          skipDuplicates: true,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setMessage(d.error || "Import failed");
        setStep("preview");
        return;
      }

      const data = await res.json();
      setImportResult(data);
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setStep("done");
    } catch {
      setMessage("Connection error during import");
      setStep("preview");
    }
  }

  /* ── Export / Erase ── */

  async function handleExportCsv() {
    setExportingCsv(true);
    try {
      const res = await fetch("/api/transactions?limit=100000");
      const transactions = await res.json();
      if (!Array.isArray(transactions) || transactions.length === 0) {
        setMessage("No transactions to export");
        return;
      }

      const rows = transactions.map((tx: any) => ({
        date: new Date(tx.timestamp).toISOString().split("T")[0],
        amount: tx.amount,
        type: tx.type,
        category: tx.category?.name ?? "",
        description: tx.description ?? "",
      }));

      const p = await getPapa();
      const csv = p.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthwise-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Failed to export CSV");
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const res = await fetch("/api/transactions?limit=100000");
      const transactions = await res.json();
      if (!Array.isArray(transactions) || transactions.length === 0) {
        setMessage("No transactions to export");
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF("l", "mm", "a4");

      doc.setFontSize(16);
      doc.text("WealthWise - Transaction Report", 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 22);
      doc.text(`Total transactions: ${transactions.length}`, 14, 28);

      const tableData = transactions.map((tx: any) => [
        new Date(tx.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        tx.type === "income" ? `+${fmt(tx.amount)}` : `-${fmt(tx.amount)}`,
        tx.type,
        tx.category?.name ?? "",
        tx.description ?? "",
      ]);

      autoTable(doc, {
        startY: 32,
        head: [["Date", "Amount", "Type", "Category", "Description"]],
        body: tableData,
        theme: "plain",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        horizontalPageBreak: true,
      });

      doc.save(`wealthwise-transactions-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch {
      setMessage("Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleEraseAll() {
    setErasing(true);
    try {
      const res = await fetch("/api/transactions", { method: "DELETE" });
      if (!res.ok) { setMessage("Failed to erase data"); return; }
      const data = await res.json();
      setMessage(`Erased: ${data.deleted.transactions} transactions, ${data.deleted.budgets} budgets, ${data.deleted.goals} goals, ${data.deleted.subscriptions} subscriptions`);
      setShowEraseConfirm(false);
      window.location.reload();
    } catch { setMessage("Connection error"); } finally { setErasing(false); }
  }

  /* ── Render helpers ── */

  // Use the first raw row as preview columns for mapping step
  const firstRow = rawRows[0] ?? {};

  function renderStepIndicator() {
    const steps = [
      { key: "select", label: "Select" },
      { key: "mapping", label: "Map" },
      { key: "categories", label: "Categories" },
      { key: "preview", label: "Preview" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === (step === "done" || step === "importing" ? "preview" : step));
    return (
      <div className="flex items-center gap-1 text-xs mb-4">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                i <= currentIdx ? "bg-black text-white" : "bg-monochrome-100 text-monochrome-400"
              }`}
            >
              {i < currentIdx ? <Check size={10} /> : i + 1}
            </span>
            <span className={i <= currentIdx ? "text-monochrome-700 font-medium" : "text-monochrome-400"}>{s.label}</span>
            {i < steps.length - 1 && <span className="text-monochrome-300 mx-0.5">—</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bento-card">
      <div className="flex items-center gap-3 pb-3 border-b border-monochrome-100">
        <div className="w-8 h-8 rounded-full bg-monochrome-100 flex items-center justify-center">
          <FileText size={16} className="text-monochrome-700" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-monochrome-900">Import / Export</h2>
          <p className="text-xs text-monochrome-400">CSV import/export & PDF reports</p>
        </div>
      </div>

      {/* ── Import Wizard ── */}
      <div className="p-3 rounded-lg border border-monochrome-100 bg-monochrome-50/50 space-y-3">
        {step === "select" && !importResult && (
          <>
            <p className="text-xs text-monochrome-500">
              Upload a CSV from your bank or use our template format. Column mapping is auto-detected.
            </p>
            <button
              className="btn-secondary text-xs flex items-center gap-1.5"
              onClick={() => {
                const p = getPapa();
                // download template
                const template = "date,amount,type,category,description\n2024-01-15,1500,expense,Food & Dining,Lunch\n2024-01-16,50000,income,Salary,Monthly salary";
                const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "wealthwise-template.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <FileDown size={12} />
              Download template
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="text-sm text-monochrome-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-black file:text-white hover:file:bg-monochrome-800"
            />
          </>
        )}

        {step === "mapping" && (
          <div className="space-y-3 animate-fade-in">
            {renderStepIndicator()}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-monochrome-700">Column Mapping</p>
              <p className="text-xs text-monochrome-400">{rawRows.length} rows detected</p>
            </div>
            <p className="text-[11px] text-monochrome-500">
              Auto-detected mapping shown below. Change any field using the dropdown.
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {rawHeaders.map((header) => {
                const current = columnMapping[header] ?? "skip";
                return (
                  <div key={header} className="flex items-center gap-2 text-xs">
                    <span className="w-2/5 truncate font-medium text-monochrome-700 shrink-0">{header}</span>
                    <span className="text-monochrome-300 shrink-0">→</span>
                    <select
                      className="w-3/5 input py-1 text-xs"
                      value={current}
                      onChange={(e) => handleMappingChange(header, e.target.value as InternalField)}
                    >
                      {INTERNAL_FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {rawHeaders.length > 0 && (
              <div className="overflow-x-auto border border-monochrome-200 rounded-md">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-monochrome-100">
                      {rawHeaders.map((h) => (
                        <th key={h} className="px-2 py-1 text-left font-medium text-monochrome-700">
                          {INTERNAL_FIELD_LABELS[columnMapping[h] ?? "skip"] ?? h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-monochrome-100">
                        {rawHeaders.map((h) => (
                          <td key={h} className="px-2 py-1 text-monochrome-600 max-w-[120px] truncate">
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={resetImport}>
                <ArrowLeft size={12} className="mr-1 inline" />
                Back
              </button>
              <button className="btn-primary text-xs flex items-center gap-1 ml-auto" onClick={proceedToCategories} disabled={processing}>
                {processing ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                {processing ? "Processing..." : "Next — Categories"}
              </button>
            </div>
          </div>
        )}

        {step === "categories" && (
          <div className="space-y-3 animate-fade-in">
            {renderStepIndicator()}

            <p className="text-xs font-semibold text-monochrome-700">Category Resolution</p>
            <p className="text-[11px] text-monochrome-500">
              {newCategoryNames.size > 0
                ? `${newCategoryNames.size} unknown categor${newCategoryNames.size === 1 ? "y" : "ies"} detected. Map them below or create new ones.`
                : "All categories matched existing ones."}
            </p>

            {mappedData.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {Array.from(categoryMapping.entries()).map(([csvCat, catId]) => {
                  const isNew = newCategoryNames.has(csvCat);
                  const matchedCat = allCategories.find((c) => c.id === catId);
                  return (
                    <div key={csvCat} className={`flex items-center gap-2 text-xs p-1.5 rounded-md ${isNew ? "bg-amber-50 border border-amber-200" : "bg-monochrome-50"}`}>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-monochrome-700">{csvCat}</span>
                        {isNew && <span className="text-amber-600 text-[10px] ml-1.5 font-medium">(new)</span>}
                      </div>
                      <span className="text-monochrome-300 shrink-0">→</span>
                      <select
                        className="w-2/5 input py-1 text-xs shrink-0"
                        value={catId}
                        onChange={(e) => handleCategoryMap(csvCat, e.target.value)}
                      >
                        <option value="">— Create new —</option>
                        {allCategories
                          .filter((c) => c.type === mappedData.find((r) => r.category === csvCat)?.type || true)
                          .map((c) => (
                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                          ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => setStep("mapping")}>
                <ArrowLeft size={12} className="mr-1 inline" />
                Back
              </button>
              <button className="btn-primary text-xs flex items-center gap-1 ml-auto" onClick={proceedToPreview} disabled={processing}>
                {processing ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                {processing ? "Validating..." : "Next — Preview"}
              </button>
            </div>
          </div>
        )}

        {step === "preview" && previewResult && !message && (
          <div className="space-y-3 animate-fade-in">
            {renderStepIndicator()}
            <p className="text-xs font-semibold text-monochrome-700">Preview Results</p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
                <p className="text-lg font-bold text-green-700">{previewResult.valid}</p>
                <p className="text-[10px] text-green-600">Valid</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-center">
                <p className="text-lg font-bold text-amber-700">{previewResult.duplicates}</p>
                <p className="text-[10px] text-amber-600">Duplicates (skipped)</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center">
                <p className="text-lg font-bold text-red-700">{previewResult.errors.length}</p>
                <p className="text-[10px] text-red-600">Errors</p>
              </div>
            </div>

            {previewResult.errors.length > 0 && (
              <div className="text-xs text-monochrome-500 max-h-24 overflow-y-auto space-y-0.5">
                <p className="font-medium text-monochrome-700 mb-1">Errors:</p>
                {previewResult.errors.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-red-600">Row {e.row}: {e.error}</p>
                ))}
              </div>
            )}

            {previewResult.valid > 0 && (
              <div className="overflow-x-auto border border-monochrome-200 rounded-md max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-monochrome-100 sticky top-0">
                      <th className="px-2 py-1 text-left font-medium text-monochrome-700">Date</th>
                      <th className="px-2 py-1 text-left font-medium text-monochrome-700">Amount</th>
                      <th className="px-2 py-1 text-left font-medium text-monochrome-700">Type</th>
                      <th className="px-2 py-1 text-left font-medium text-monochrome-700">Category</th>
                      <th className="px-2 py-1 text-left font-medium text-monochrome-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewResult.sampleValid as any[]).slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-monochrome-100">
                        <td className="px-2 py-1 text-monochrome-600">{row.date}</td>
                        <td className="px-2 py-1 text-monochrome-600 font-mono">{row.amount}</td>
                        <td className="px-2 py-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            row.type === "income" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>{row.type}</span>
                        </td>
                        <td className="px-2 py-1 text-monochrome-600">{row.category}</td>
                        <td className="px-2 py-1 text-monochrome-600 max-w-[120px] truncate">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => setStep("categories")}>
                <ArrowLeft size={12} className="mr-1 inline" />
                Back
              </button>
              <button
                className="btn-primary text-xs flex items-center gap-1 ml-auto"
                onClick={handleImport}
                disabled={previewResult.valid === 0}
              >
                <Upload size={12} />
                Import {previewResult.valid} transaction{previewResult.valid !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center gap-2 py-6 animate-fade-in">
            <Loader2 size={24} className="animate-spin text-black" />
            <p className="text-xs text-monochrome-500">Importing transactions...</p>
          </div>
        )}

        {step === "done" && importResult && (
          <div className="space-y-2 animate-fade-in">
            {renderStepIndicator()}
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-black" />
              <span className="font-medium text-monochrome-900">
                {importResult.created} of {importResult.total} imported
              </span>
            </div>
            {importResult.skipped > 0 && (
              <p className="text-xs text-amber-600">{importResult.skipped} duplicate{importResult.skipped !== 1 ? "s" : ""} skipped</p>
            )}
            {importResult.errors.length > 0 && (
              <div className="text-xs text-monochrome-500">
                {importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}:
                <ul className="list-disc pl-4 mt-1">
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button className="btn-secondary text-xs mt-1" onClick={resetImport}>
              <RefreshCw size={12} className="mr-1 inline" />
              Import another file
            </button>
          </div>
        )}

        {message && step !== "select" && (
          <p className="text-xs bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2 flex items-center gap-1.5">
            <Info size={12} className="text-monochrome-500 shrink-0" />
            {message}
          </p>
        )}
      </div>

      {/* ── Export + Erase ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn-secondary text-xs flex items-center gap-1.5"
          onClick={handleExportCsv}
          disabled={exportingCsv}
        >
          {exportingCsv ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={14} />}
          {exportingCsv ? "Exporting..." : "CSV"}
        </button>
        <button
          className="btn-secondary text-xs flex items-center gap-1.5"
          onClick={handleExportPdf}
          disabled={exportingPdf}
        >
          {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={14} />}
          {exportingPdf ? "Exporting..." : "PDF"}
        </button>
        <div className="ml-auto">
          {!showEraseConfirm ? (
            <button className="btn-danger text-xs flex items-center gap-1.5" onClick={() => setShowEraseConfirm(true)}>
              <Trash2 size={12} />
              Erase All
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-black font-medium">Are you sure?</span>
              <button className="btn-secondary text-xs" onClick={() => setShowEraseConfirm(false)} disabled={erasing}>Cancel</button>
              <button className="btn-danger text-xs flex items-center gap-1" onClick={handleEraseAll} disabled={erasing}>
                {erasing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {erasing ? "Erasing..." : "Confirm"}
              </button>
            </div>
          )}
        </div>
      </div>

      {message && step === "select" && (
        <p className="text-xs bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{message}</p>
      )}
    </div>
  );
}
