"use client";

import { getMediaUrl } from "@/lib/api";
import ImagePlaceholder from "@/components/shared/ImagePlaceholder";

type ProductImageGalleryProps = {
  productName: string;
  activeImage: string | null;
  thumbnails: string[];
  onSelectImage: (url: string) => void;
};

export default function ProductImageGallery({
  productName,
  activeImage,
  thumbnails,
  onSelectImage,
}: ProductImageGalleryProps) {
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {activeImage ? (
          <img
            src={activeImage}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center">
            <ImagePlaceholder className="aspect-square w-full" iconClassName="h-32 w-32" />
          </div>
        )}
      </div>
      {thumbnails.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {thumbnails.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onSelectImage(url)}
              className={`h-16 w-16 overflow-hidden rounded border ${
                activeImage === url ? "border-emerald-500" : "border-slate-300"
              } bg-slate-50`}
            >
              <img
                src={getMediaUrl(url)}
                alt={productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
