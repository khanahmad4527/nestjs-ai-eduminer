import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum GradeOption {
  ALL = 'all',
  K = 'K',
  GRADE_1 = '1',
  GRADE_2 = '2',
  GRADE_3 = '3',
  GRADE_4 = '4',
  GRADE_5 = '5',
  GRADE_6 = '6',
  GRADE_7 = '7',
  GRADE_8 = '8',
  GRADE_9 = '9',
  GRADE_10 = '10',
  GRADE_11 = '11',
  GRADE_12 = '12',
}

export class ScrapeQueryDto {
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  allowAIProcessing: boolean = false;

  @IsString()
  q: string;

  @IsOptional()
  @IsEnum(GradeOption, { message: 'Invalid grade option' })
  grade: GradeOption = GradeOption['ALL'];

  @Type(() => Number) // Converts query param from string to number
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page: number;
}
