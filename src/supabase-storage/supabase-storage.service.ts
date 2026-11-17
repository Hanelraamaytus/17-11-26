import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService implements OnModuleInit {
  private client!: SupabaseClient;
  private bucket!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    this.bucket = this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
  }

  async uploadFile(file: Express.Multer.File, path: string) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new InternalServerErrorException(error.message);
    return { path: data.path };
  }

  getPublicUrl(path: string): string {
    return this.client.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }

  async deleteFile(path: string) {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) throw new InternalServerErrorException(error.message);
  }
}