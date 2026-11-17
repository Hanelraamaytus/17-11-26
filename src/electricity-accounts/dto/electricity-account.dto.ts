import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateElectricityAccountDto {
  @IsUUID() electricity_service_id: string;
  @IsString() @IsNotEmpty() @MaxLength(30) customer_number: string;
  @IsString() @IsNotEmpty() @MaxLength(100) customer_name: string;
  @IsString() @IsNotEmpty() address: string;
}