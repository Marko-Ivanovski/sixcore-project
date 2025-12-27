/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @Length(8, 72)
  password!: string;
}
