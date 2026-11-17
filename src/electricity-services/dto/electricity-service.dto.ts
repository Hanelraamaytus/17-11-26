import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateElectricityServiceDto {
  @IsString() @IsNotEmpty() @MaxLength(20) code: string;
  @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsInt() @Min(1) power_va: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price_per_kwh: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
export class UpdateElectricityServiceDto extends PartialType(CreateElectricityServiceDto) {}