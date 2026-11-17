import { IsUUID } from 'class-validator';

export class UploadPaymentDto {
  @IsUUID() billing_id: string;
}