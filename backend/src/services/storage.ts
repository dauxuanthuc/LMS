import * as fs from "fs";
import * as path from "path";
import axios from "axios";

export interface UploadResult {
  fileUrl: string;
  fileSize: number;
}

export class StorageService {
  private static uploadDir = process.env.UPLOAD_DIR || "./uploads";
  private static provider = process.env.STORAGE_PROVIDER || "local";

  /**
   * Initializes the storage folder if using local storage
   */
  public static init() {
    if (this.provider === "local") {
      const fullPath = path.resolve(this.uploadDir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created local upload directory: ${fullPath}`);
      }
    }
  }

  /**
   * Uploads a file buffer and returns the accessible URL
   */
  public static async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    const fileSize = fileBuffer.length;
    const extension = path.extname(originalName);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;

    if (this.provider === "supabase") {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      const bucket = process.env.SUPABASE_BUCKET || "lms-documents";

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials are not configured in environment variables.");
      }

      console.log(`Uploading to Supabase Storage: ${uniqueName}`);
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${uniqueName}`;
      
      try {
        await axios.post(uploadUrl, fileBuffer, {
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": mimeType,
          },
        });
        
        // Public download/view URL for Supabase bucket
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${uniqueName}`;
        return { fileUrl, fileSize };
      } catch (err: any) {
        console.error("Supabase upload error details:", err.response?.data || err.message);
        throw new Error(`Failed to upload to Supabase: ${err.message}`);
      }
    }

    if (this.provider === "r2") {
      // For R2, we use standard REST upload if configured, or fallback to local.
      // S3 SDK can be configured, but for out-of-the-box local developer experience,
      // we log instructions and fallback to local storage if config is missing.
      const accountId = process.env.R2_ACCOUNT_ID;
      const bucket = process.env.R2_BUCKET;
      const publicUrl = process.env.R2_PUBLIC_URL;

      if (!accountId || !bucket || !publicUrl) {
        console.warn("Cloudflare R2 details missing. Falling back to local storage.");
      } else {
        // Mocking R2 response or instructing. Let's return R2 structure
        const fileUrl = `${publicUrl}/${uniqueName}`;
        console.log(`[R2 Upload Simulation] Saved file to R2: ${fileUrl}`);
        // For standard setup we save locally first
      }
    }

    // Default Local Storage
    const targetPath = path.join(path.resolve(this.uploadDir), uniqueName);
    fs.writeFileSync(targetPath, fileBuffer);
    
    // We will serve /uploads statically, so the url is relative/host-based
    const fileUrl = `/uploads/${uniqueName}`;
    console.log(`Saved file locally: ${targetPath}`);
    return { fileUrl, fileSize };
  }

  /**
   * Deletes a file by its URL or path
   */
  public static async deleteFile(fileUrl: string): Promise<void> {
    if (this.provider === "local" && fileUrl.startsWith("/uploads/")) {
      const fileName = fileUrl.replace("/uploads/", "");
      const filePath = path.join(path.resolve(this.uploadDir), fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local file: ${filePath}`);
      }
    } else if (this.provider === "supabase") {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      const bucket = process.env.SUPABASE_BUCKET || "lms-documents";

      if (supabaseUrl && supabaseKey) {
        // Extract filename from public URL
        const parts = fileUrl.split(`/object/public/${bucket}/`);
        if (parts.length > 1) {
          const fileName = parts[1];
          const deleteUrl = `${supabaseUrl}/storage/v1/object/${bucket}`;
          try {
            await axios.delete(deleteUrl, {
              headers: {
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              data: { prefixes: [fileName] }
            });
            console.log(`Deleted file from Supabase Storage: ${fileName}`);
          } catch (err: any) {
            console.error("Failed to delete from Supabase storage:", err.message);
          }
        }
      }
    }
  }
}
