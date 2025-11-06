import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as say from 'say';
const gtts = require('gtts');

@Injectable()
export class VoiceService {
  constructor(private configService: ConfigService) {}

  async trainVoice(file: Express.Multer.File) {
    try {
      // Save the uploaded file
      const voiceId = `voice_${Date.now()}`;
      const voiceDir = path.join('./uploads/voices', voiceId);
      
      if (!fs.existsSync(voiceDir)) {
        fs.mkdirSync(voiceDir, { recursive: true });
      }

      const filePath = path.join(voiceDir, file.originalname || 'voice-sample.wav');
      
      // Handle both buffer and file path
      if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      } else if (file.path) {
        fs.copyFileSync(file.path, filePath);
      }

      // Store voice metadata for later use
      const metadata = {
        voiceId,
        originalName: file.originalname,
        filePath,
        uploadedAt: new Date().toISOString(),
        size: file.size
      };
      
      const metadataPath = path.join(voiceDir, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      return {
        success: true,
        voiceId,
        message: 'Voice sample uploaded and processed successfully',
        metadata
      };
    } catch (error) {
      console.error('Voice training error:', error);
      throw new HttpException('Failed to process voice sample', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateVoice(text: string, language: string, voiceType: string, voiceStyle: string, voiceId?: string) {
    try {
      const outputPath = path.join('./uploads', `tts_${Date.now()}.wav`);
      
      // Use Google TTS for better language support
      if (language !== 'en') {
        return this.generateWithGTTS(text, language, voiceType, outputPath);
      }
      
      // Use system TTS for English with voice type support
      return this.generateWithSystemTTS(text, voiceType, voiceStyle, outputPath);
    } catch (error) {
      console.error('Voice generation error:', error.message);
      throw new HttpException('Failed to generate voice', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async generateWithGTTS(text: string, language: string, voiceType: string, outputPath: string) {
    return new Promise((resolve, reject) => {
      const speech = new gtts(text, language, 0);
      
      speech.save(outputPath, (err) => {
        if (err) {
          console.error('GTTS Error:', err);
          reject(new HttpException('Failed to generate speech', HttpStatus.INTERNAL_SERVER_ERROR));
          return;
        }
        
        try {
          const audioBuffer = fs.readFileSync(outputPath);
          fs.unlinkSync(outputPath);
          
          resolve({
            audioBuffer,
            contentType: 'audio/wav',
            message: `Voice generated with ${voiceType} voice in ${language}`,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            language,
            voiceType
          });
        } catch (readError) {
          reject(new HttpException('Failed to read generated audio', HttpStatus.INTERNAL_SERVER_ERROR));
        }
      });
    });
  }

  private async generateWithSystemTTS(text: string, voiceType: string, voiceStyle: string, outputPath: string) {
    return new Promise((resolve, reject) => {
      let voiceOptions = null;
      let speed = 1.0;
      
      if (process.platform === 'win32') {
        switch (voiceType) {
          case 'male':
            voiceOptions = 'Microsoft David Desktop';
            break;
          case 'female':
            voiceOptions = 'Microsoft Zira Desktop';
            break;
          case 'baby_boy':
          case 'baby_girl':
            voiceOptions = 'Microsoft Zira Desktop';
            speed = 1.3; // Faster for baby voice
            break;
          case 'elderly_male':
            voiceOptions = 'Microsoft David Desktop';
            speed = 0.8; // Slower for elderly
            break;
          case 'elderly_female':
            voiceOptions = 'Microsoft Zira Desktop';
            speed = 0.8;
            break;
          default:
            voiceOptions = 'Microsoft Zira Desktop';
        }
      }
      
      say.export(text, voiceOptions, speed, outputPath, (err) => {
        if (err) {
          console.error('TTS Error:', err);
          reject(new HttpException('Failed to generate speech', HttpStatus.INTERNAL_SERVER_ERROR));
          return;
        }
        
        try {
          const audioBuffer = fs.readFileSync(outputPath);
          fs.unlinkSync(outputPath);
          
          resolve({
            audioBuffer,
            contentType: 'audio/wav',
            message: `Voice generated with ${voiceType} voice (${voiceStyle} style)`,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            language: 'en',
            voiceType,
            voiceStyle
          });
        } catch (readError) {
          reject(new HttpException('Failed to read generated audio', HttpStatus.INTERNAL_SERVER_ERROR));
        }
      });
    });
  }
}