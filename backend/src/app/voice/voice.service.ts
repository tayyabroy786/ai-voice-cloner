import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VoiceService {
  private readonly pythonServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.pythonServiceUrl = this.configService.get('PYTHON_SERVICE_URL', 'http://localhost:5000');
  }

  async trainVoice(file: Express.Multer.File) {
    try {
      // Save the uploaded file
      const voiceId = `voice_${Date.now()}`;
      const voiceDir = path.join('./uploads/voices', voiceId);
      
      if (!fs.existsSync(voiceDir)) {
        fs.mkdirSync(voiceDir, { recursive: true });
      }

      const filePath = path.join(voiceDir, file.originalname);
      fs.writeFileSync(filePath, file.buffer);

      return {
        success: true,
        voiceId,
        message: 'Voice sample uploaded successfully'
      };
    } catch (error) {
      throw new HttpException('Failed to process voice sample', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateVoice(text: string, language: string, voiceStyle: string, voiceId?: string) {
    try {
      const response = await axios.post(`${this.pythonServiceUrl}/generate`, {
        text,
        language,
        voice_style: voiceStyle,
        voice_id: voiceId
      }, {
        responseType: 'arraybuffer'
      });

      return {
        audioBuffer: response.data,
        contentType: 'audio/wav'
      };
    } catch (error) {
      console.error('Python service error:', error.message);
      throw new HttpException('Failed to generate voice', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}