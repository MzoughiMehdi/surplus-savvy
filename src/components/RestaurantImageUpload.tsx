import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface RestaurantImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  restaurantId?: string;
  userId: string;
}

const RestaurantImageUpload = ({ imageUrl, onImageChange, restaurantId, userId }: RestaurantImageUploadProps) => {
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
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("restaurant-images").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("restaurant-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // If editing an existing restaurant, update DB directly
      if (restaurantId) {
        await supabase.from("restaurants").update({ image_url: publicUrl }).eq("id", restaurantId);
      }

      onImageChange(publicUrl);
      toast.success("Photo mise à jour !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    onImageChange(null);
    if (restaurantId) {
      supabase.from("restaurants").update({ image_url: null }).eq("id", restaurantId);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

      {imageUrl ? (
        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border">
          <img src={imageUrl} alt="Restaurant" className="h-full w-full object-cover" />
          <button onClick={remove} className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm">
            <X className="h-4 w-4 text-destructive" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Camera className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Camera className="h-6 w-6" />
              <span className="text-xs font-medium">Ajouter une photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default RestaurantImageUpload;
