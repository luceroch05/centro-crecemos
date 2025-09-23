import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TrabajadorCentro } from '../usuarios/trabajador-centro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrabajadorCentro]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu-secreto-seguro',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {} 