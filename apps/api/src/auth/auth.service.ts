/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { UserDto, toUserDto } from '../users/dto/user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  getAccessTokenSecret,
  getRefreshTokenSecret,
} from './auth.constants';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: UserDto;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.toLowerCase().trim();

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email,
      username,
      passwordHash,
      displayName: dto.displayName?.trim() || null,
    });

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const identifier = dto.identifier.trim().toLowerCase();
    const user =
      (await this.usersService.findByEmail(identifier)) ??
      (await this.usersService.findByUsername(identifier));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), tokens };
  }

  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User): UserDto {
    return toUserDto(user);
  }

  private async generateTokens(userId: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId },
        { secret: getAccessTokenSecret(), expiresIn: ACCESS_TOKEN_EXPIRES_IN },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: getRefreshTokenSecret(),
          expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
