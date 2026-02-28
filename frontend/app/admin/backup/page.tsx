"use client";

import { useState, useEffect } from "react";
import { adminApi, backupApi } from "@/lib/api";
import { Card, Button, LoadingState } from "@/components/ui";

export default function AdminBackupPage() {
  const [admin, setAdmin] = useState<{ role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [clearBeforeRestore, setClearBeforeRestore] = useState(true);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [restoreResult, setRestoreResult] = useState<{ inserted: Record<string, number>; errors: { collection: string; message: string }[] } | null>(null);

  useEffect(() => {
    adminApi.getMe().then((res) => {
      setLoading(false);
      if (res.data?.admin) setAdmin(res.data.admin);
    });
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  if (admin?.role !== "superadmin") {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-amber-200 bg-amber-50/50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-800">Superadmin only</h2>
          <p className="mt-2 text-sm text-amber-700">
            Backup and restore is available only for superadmin accounts.
          </p>
        </Card>
      </div>
    );
  }

  const handleDownload = async () => {
    setMessage(null);
    setDownloadLoading(true);
    const res = await backupApi.downloadBackup();
    setDownloadLoading(false);
    if (res.error) setMessage({ type: "error", text: res.error });
    else setMessage({ type: "success", text: "Backup downloaded successfully." });
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setMessage({ type: "error", text: "Please select a backup JSON file." });
      return;
    }
    if (!confirm("Restore will replace existing data in the backup collections. Continue?")) return;
    setMessage(null);
    setRestoreResult(null);
    setRestoreLoading(true);
    const res = await backupApi.restoreBackup(restoreFile, { clearBeforeRestore });
    setRestoreLoading(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: res.data?.message || "Restore completed." });
    if (res.data?.results) setRestoreResult(res.data.results);
    setRestoreFile(null);
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Backup & Restore</h1>
        <p className="mt-1 text-slate-600">
          Export all store data to a JSON file or restore from a previous backup. Superadmin only.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border p-4 ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Download backup</h2>
          <p className="mb-4 text-sm text-slate-600">
            Export settings, users, products, categories, orders, and other data to a JSON file.
          </p>
          <Button
            type="button"
            variant="primaryAmber"
            onClick={handleDownload}
            disabled={downloadLoading}
          >
            {downloadLoading ? "Preparing..." : "Download backup"}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Restore from backup</h2>
          <p className="mb-4 text-sm text-slate-600">
            Upload a backup JSON file to restore data. By default, existing data in restored collections is cleared first.
          </p>
          <div className="mb-4">
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={clearBeforeRestore}
                onChange={(e) => setClearBeforeRestore(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Clear existing data before restore
            </label>
          </div>
          <div className="mb-4">
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-700 hover:file:bg-amber-100"
            />
          </div>
          <Button
            type="button"
            variant="primaryAmber"
            onClick={handleRestore}
            disabled={restoreLoading || !restoreFile}
          >
            {restoreLoading ? "Restoring..." : "Restore backup"}
          </Button>
        </Card>
      </div>

      {restoreResult && (
        <Card className="mt-6 p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Restore summary</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(restoreResult.inserted || {}).map(([coll, count]) => (
              <div key={coll} className="text-slate-600">
                {coll}: {count} document(s) inserted
              </div>
            ))}
            {(restoreResult.errors || []).length > 0 && (
              <div className="mt-2 text-red-600">
                Errors: {restoreResult.errors.map((e) => `${e.collection}: ${e.message}`).join("; ")}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
