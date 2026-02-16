import { supabase } from './supabase';

/**
 * Upload a file to Supabase Storage
 * @param file The file object to upload
 * @param bucket The storage bucket name
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, bucket: string = 'chat-attachments'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) {
        if (uploadError.message === 'Bucket not found') {
            throw new Error('Storage bucket "chat-attachments" belum dibuat di Supabase. Silakan buat bucket publik bernama "chat-attachments".');
        }
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
}
