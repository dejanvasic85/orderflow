import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getProductImageUploadUrl } from "@/lib/storage/storage.functions";

type CropArea = { x: number; y: number; width: number; height: number };

type Props = {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
};

const maxInputDimension = 1200;
const outputQuality = 0.82;

async function resizeAndConvertToWebP(file: File, cropArea?: CropArea): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const src = cropArea ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const aspectRatio = src.width / src.height;

  let outWidth = src.width;
  let outHeight = src.height;
  if (outWidth > maxInputDimension || outHeight > maxInputDimension) {
    if (outWidth >= outHeight) {
      outWidth = maxInputDimension;
      outHeight = Math.round(maxInputDimension / aspectRatio);
    } else {
      outHeight = maxInputDimension;
      outWidth = Math.round(maxInputDimension * aspectRatio);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(bitmap, src.x, src.y, src.width, src.height, 0, 0, outWidth, outHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/webp",
      outputQuality,
    );
  });
}

export function ImageUpload({ currentUrl, onUploaded }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const picked = accepted[0];
    if (!picked) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setCropping(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.message ?? "File rejected";
      toast.error(reason);
    },
  });

  function handleCropComplete(_: unknown, areaPixels: CropArea) {
    setCroppedArea(areaPixels);
  }

  function handleDiscard() {
    setFile(null);
    setPreviewUrl(null);
    setCroppedArea(null);
    setCropping(false);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeAndConvertToWebP(file, croppedArea ?? undefined);
      const key = `products/${crypto.randomUUID()}-${Date.now()}.webp`;

      const { uploadUrl, publicUrl } = await getProductImageUploadUrl({
        data: { key, contentType: "image/webp" },
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/webp" },
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);

      onUploaded(publicUrl);
      handleDiscard();
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = previewUrl ?? currentUrl;

  return (
    <div className="flex flex-col gap-3">
      {!file && (
        <div
          {...getRootProps()}
          className={[
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors cursor-pointer",
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          ].join(" ")}
        >
          <input {...getInputProps()} />
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Current product image"
              className="mb-3 max-h-40 rounded object-cover"
            />
          ) : null}
          <p>{isDragActive ? "Drop image here" : "Drag an image here, or click to select"}</p>
          <p className="text-xs mt-1">PNG, JPG, WebP — max 10 MB</p>
        </div>
      )}

      {file && previewUrl && (
        <>
          {cropping ? (
            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Selected image preview"
              className="max-h-40 w-full rounded-lg object-cover"
            />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleUpload} disabled={uploading} size="sm">
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCropping((v) => !v)}
              disabled={uploading}
            >
              {cropping ? "Done cropping" : "Crop"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={uploading}
            >
              Discard
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
