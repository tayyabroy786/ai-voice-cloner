import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VoiceController } from './voice/voice.controller';
import { VoiceService } from './voice/voice.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({ dest: './uploads' }),
    AuthModule
  ],
  controllers: [AppController, VoiceController, PaymentController],
  providers: [AppService, VoiceService, PaymentService],
})
export class AppModule {}
