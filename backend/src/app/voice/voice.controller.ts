import { Controller, Post, Body, UploadedFile, UseInterceptors, HttpException, HttpStatus, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';

@Controller()
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
  async generateVoice(@Body() body: { text: string; language: string; voiceType: string; voiceStyle: string; voiceId?: string }, @Res() res) {
    const { text, language, voiceType, voiceStyle, voiceId } = body;
    
    if (!text) {
      throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    }

    const result: any = await this.voiceService.generateVoice(text, language, voiceType, voiceStyle, voiceId);
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="generated-voice.wav"'
    });
    
    return res.send(result.audioBuffer);
  }

  @Post('voices')
  async getAvailableVoices() {
    return this.voiceService.getAvailableVoices();
  }
}