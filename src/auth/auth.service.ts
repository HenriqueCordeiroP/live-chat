import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { QueryOptions } from './interfaces/query-options';
import { hash, genSalt, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  findOne(options: QueryOptions) {
    return this.userRepository.findOne(options);
  }

  async signUp(userDto: { username: string; password: string }) {
    const usernameUser = await this.findOne({ where: { username: ILike(userDto.username) } });

    if (usernameUser) {
      throw new ConflictException('An user this username or email already exists');
    }
    const hashedPassword = await hash(userDto.password, await genSalt());

    const createdUser = await this.userRepository.save({ ...userDto, password: hashedPassword });

    return await this.getAuthenticatedUserResponse(createdUser);
  }

  async signIn(username: string, password: string) {
    const user = await this.findOne({ where: { username } });

    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException('Password is incorrect');
    }

    return await this.getAuthenticatedUserResponse(user);
  }

  private async getAuthenticatedUserResponse(user: User) {
    const { accessToken, refreshToken } = await this.getTokenPair(user.id);

    return {
      id: user.id,
      accessToken,
      refreshToken,
    };
  }

  private async getTokenPair(userId: string) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<boolean> {
    try {
      const decodedToken = await this.jwtService.verifyAsync(token);

      const user = await this.findOne({ where: { id: decodedToken.sub } });
      if (!user) {
        throw new WsException('Unauthorized.');
      }
    } catch {
      throw new WsException('Unauthorized.');
    }

    return true;
  }
}
