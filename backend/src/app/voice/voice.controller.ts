import { Controller, Post, Body, UploadedFile, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';

@Controller('api')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('train-voice')
  @UseInterceptors(FileInterceptor('audio'))
  async trainVoice(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No audio file provided', HttpStatus.BAD_REQUEST);
    }
    return this.voiceService.trainVoice(file);
  }

  @Post('voice')
  async generateVoice(@Body() body: { text: string; language: string; voiceStyle: string; voiceId?: string }) {
    const { text, language, voiceStyle, voiceId } = body;
    
    if (!text) {
      throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    }

    return this.voiceService.generateVoice(text, language, voiceStyle, voiceId);
  }
}