"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { mediaApi, type MediaItem } from "@/lib/api";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) {
  return mime.startsWith("image/");
}

function isVideo(mime: string) {
  return mime.startsWith("video/");
}

export default function AdminMediaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "document">("all");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    if (!token || userType !== "admin") {
      router.replace("/admin/login");
      return;
    }
    loadMedia();
  }, [mounted, router, pagination.page, filter]);

  const loadMedia = async () => {
    setLoading(true);
    const res = await mediaApi.list({
      page: pagination.page,
      limit: pagination.limit,
      type: filter === "all" ? undefined : filter,
    });
    setLoading(false);
    if (res.data?.data) {
      setItems(res.data.data);
      if (res.data.pagination) setPagination(res.data.pagination);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      await mediaApi.upload(files[i]);
    }
    setUploading(false);
    e.target.value = "";
    loadMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    await mediaApi.delete(id);
    loadMedia();
    if (selectedUrl && items.find((i) => i._id === id)?.url === selectedUrl) setSelectedUrl(null);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Media</h1>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "image", "video", "document"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setFilter(t);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              filter === t ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-slate-600">No media yet.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-amber-600 hover:underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition hover:shadow-md"
              >
                <div
                  className="flex aspect-square w-full min-w-0 cursor-pointer items-center justify-center"
                  onClick={() => setSelectedUrl(item.url)}
                >
                  {isImage(item.mimeType) ? (
                    <img
                      src={item.url}
                      alt={item.originalName}
                      className="h-full w-full object-contain"
                    />
                  ) : isVideo(item.mimeType) ? (
                    <video
                      src={item.url}
                      className="h-full w-full object-contain"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs text-slate-600" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="text-xs text-slate-400">{formatSize(item.size)}</p>
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(item.url);
                    }}
                    className="rounded bg-white/90 p-1.5 text-slate-600 shadow hover:bg-white"
                    title="Copy URL"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item._id);
                    }}
                    className="rounded bg-red-500/90 p-1.5 text-white shadow hover:bg-red-500"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-slate-600">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {selectedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedUrl(null)}
        >
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {selectedUrl.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i) ? (
              <img src={selectedUrl} alt="" className="max-h-[90vh] max-w-full object-contain" />
            ) : selectedUrl.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
              <video src={selectedUrl} controls autoPlay className="max-h-[90vh] max-w-full" />
            ) : (
              <a
                href={selectedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-white px-6 py-4 text-amber-600 hover:underline"
              >
                Open file
              </a>
            )}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => copyUrl(selectedUrl)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-500"
              >
                {copyFeedback ? "Copied!" : "Copy URL"}
              </button>
              <button
                onClick={() => setSelectedUrl(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
