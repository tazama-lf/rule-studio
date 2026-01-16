import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'Username for authentication', 
    example: 'user@example.com' 
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ 
    description: 'Password for authentication', 
    example: 'password123' 
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
