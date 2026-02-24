"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { mediaApi, getMediaUrl } from "@/lib/api";
import type { MediaItem } from "@/lib/types";

type MediaType = "image" | "video" | "document" | "all";

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  type?: MediaType;
};

const acceptByType: Record<MediaType, string> = {
  image: "image/*",
  video: "video/*",
  document: "application/pdf,.txt",
  all: "image/*,video/*,application/pdf",
};

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = "Select media",
  type = "image",
}: MediaPickerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadMedia = useCallback(async (pageNum = 1) => {
    setLoading(true);
    const res = await mediaApi.list({
      page: pageNum,
      limit: 24,
      type: type === "all" ? undefined : type,
    });
    setLoading(false);
    if (!res.data) return;
    const body = res.data as unknown as {
      data?: MediaItem[];
      pagination?: { page: number; pages: number };
    };
    setItems(body.data || []);
    if (body.pagination) {
      setPage(body.pagination.page);
      setPages(body.pagination.pages);
    } else {
      setPage(1);
      setPages(1);
    }
  }, [type]);

  useEffect(() => {
    if (open) {
      loadMedia(1);
    }
  }, [open, loadMedia]);

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const res = await mediaApi.upload(files[i]);
      if (res.data) {
        const mime = res.data.mimeType;
        const match =
          type === "all" ||
          (type === "image" && mime.startsWith("image/")) ||
          (type === "video" && mime.startsWith("video/")) ||
          (type === "document" && (mime === "application/pdf" || mime.startsWith("text/")));
        if (match) {
          setUploading(false);
          e.target.value = "";
          handleSelect(res.data.url);
          return;
        }
      }
    }
    setUploading(false);
    e.target.value = "";
    loadMedia(1);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-xl bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptByType[type]}
              onChange={handleUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <p className="mb-3 text-sm text-slate-500">No media found.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload files"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition hover:border-amber-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(item.url)}
                    className="flex aspect-square w-full min-w-0 items-center justify-center"
                  >
                    {item.mimeType.startsWith("image/") ? (
                      <img
                        src={getMediaUrl(item.url)}
                        alt={item.originalName}
                        className="h-full w-full object-contain"
                      />
                    ) : item.mimeType.startsWith("video/") ? (
                      <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this file?")) {
                        mediaApi.delete(item._id).then(() => loadMedia(page));
                      }
                    }}
                    className="absolute right-2 top-2 rounded bg-red-500/90 p-1.5 text-white opacity-0 shadow transition hover:bg-red-500 group-hover:opacity-100"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-4 flex justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => loadMedia(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-2 text-slate-600">
                  {page} / {pages}
                </span>
                <button
                  type="button"
                  onClick={() => loadMedia(page + 1)}
                  disabled={page >= pages}
                  className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
