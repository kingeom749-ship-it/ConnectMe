import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";

interface Props {
  name: string;
  seed: string;
  value: string;
  onChange: (dataUrl: string) => void;
}

const SIZE = 256;

/** Downscale to a 256px square JPEG data URL so it stays small enough to live on the profile document. */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process the image");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoPicker({ name, seed, value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      onChange(await shrink(file));
    } catch {
      toast.error("Couldn't read that image. Try a JPEG or PNG.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-5" data-testid="photo-picker">
      <div className="relative">
        <Avatar name={name} seed={seed} src={value || undefined} className="h-24 w-24 rounded-[28px] text-2xl" />
        {busy && <span className="absolute inset-0 grid place-items-center rounded-[28px] bg-black/50"><Loader2 className="h-6 w-6 animate-spin text-white" /></span>}
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={() => input.current?.click()} data-testid="photo-upload-btn" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0c0a12] transition-transform hover:scale-[1.03]">
          <Camera className="h-4 w-4" /> {value ? "Change photo" : "Add photo"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} data-testid="photo-remove-btn" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" /> Remove photo
          </button>
        )}
        <p className="text-xs text-zinc-500">Square crop, resized to 256px. Shown in the directory and chats.</p>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" data-testid="photo-file-input" onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}
