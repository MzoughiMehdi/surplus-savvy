import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface OfferImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  /** If set, updates the offer row in DB on change */
  offerId?: string;
  userId: string;
}

const OfferImageUpload = ({ imageUrl, onImageChange, offerId, userId }: OfferImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `offers/${userId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("restaurant-images").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("restaurant-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      if (offerId) {
        await supabase.from("offers").update({ image_url: publicUrl }).eq("id", offerId);
      }

      onImageChange(publicUrl);
      toast.success("Photo de l'offre mise à jour !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    onImageChange(null);
    if (offerId) {
      supabase.from("offers").update({ image_url: null }).eq("id", offerId);
    }
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

      {imageUrl ? (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border">
          <img src={imageUrl} alt="Offre" className="h-full w-full object-cover" />
          <button type="button" onClick={remove} className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 backdrop-blur-sm">
            <X className="h-3.5 w-3.5 text-destructive" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-1.5 right-1.5 rounded-full bg-background/80 p-1 backdrop-blur-sm"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">Photo de l'offre</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default OfferImageUpload;
