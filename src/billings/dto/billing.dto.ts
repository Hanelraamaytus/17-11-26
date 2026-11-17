import { IsDateString, IsInt, IsNumber, IsUUID, Max, Min } from 'class-validator';
import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';

export class CreateBillingDto {
  @IsUUID() electricity_account_id: string;
  @IsInt() @Min(1) @Max(12) period_month: number;
  @IsInt() @Min(2000) @Max(2100) period_year: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) previous_meter: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) current_meter: number;
  @IsDateString() due_date: string;
}

export class UpdateBillingDto extends PartialType(
  PickType(CreateBillingDto, ['previous_meter', 'current_meter', 'due_date'] as const),
) {}