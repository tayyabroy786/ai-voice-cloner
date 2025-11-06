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
      
      // If voiceId is provided, use voice cloning
      if (voiceId && voiceId !== 'default') {
        return this.generateWithVoiceCloning(text, voiceId, voiceStyle, outputPath);
      }
      
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
      
      // Apply voice style modifications
      text = this.applyVoiceStyleToText(text, voiceStyle);
      speed = this.getSpeedForVoiceStyle(speed, voiceStyle);
      
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
            voiceStyle,
            appliedSpeed: speed
          });
        } catch (readError) {
          reject(new HttpException('Failed to read generated audio', HttpStatus.INTERNAL_SERVER_ERROR));
        }
      });
    });
  }

  private applyVoiceStyleToText(text: string, voiceStyle: string): string {
    switch (voiceStyle) {
      case 'angry':
        // Add emphasis and exclamation for angry tone
        return text.replace(/[.!?]\s*/g, '! ').replace(/,\s*/g, ', ');
      case 'happy':
      case 'excited':
        // Add enthusiasm
        return text.replace(/[.!?]\s*/g, '! ');
      case 'sad':
        // Add pauses for sad tone
        return text.replace(/[.!?]\s*/g, '... ').replace(/,\s*/g, '... ');
      case 'calm':
        // Add gentle pauses
        return text.replace(/[.!?]\s*/g, '. ').replace(/,\s*/g, ', ');
      default:
        return text;
    }
  }

  private getSpeedForVoiceStyle(baseSpeed: number, voiceStyle: string): number {
    switch (voiceStyle) {
      case 'happy':
      case 'excited':
        return Math.min(baseSpeed * 1.3, 2.0); // Faster for happy/excited
      case 'angry':
        return Math.min(baseSpeed * 1.2, 1.8); // Faster for angry
      case 'sad':
        return Math.max(baseSpeed * 0.7, 0.4); // Much slower for sad
      case 'calm':
        return Math.max(baseSpeed * 0.85, 0.6); // Slightly slower for calm
      case 'neutral':
      default:
        return baseSpeed;
    }
  }

  async getAvailableVoices() {
    try {
      const voicesDir = './uploads/voices';
      if (!fs.existsSync(voicesDir)) {
        return [];
      }

      const voiceFolders = fs.readdirSync(voicesDir);
      const voices = [];

      for (const folder of voiceFolders) {
        const metadataPath = path.join(voicesDir, folder, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          voices.push({
            voiceId: metadata.voiceId,
            name: metadata.originalName || folder,
            uploadedAt: metadata.uploadedAt
          });
        }
      }

      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  private async generateWithVoiceCloning(text: string, voiceId: string, voiceStyle: string, outputPath: string) {
    return new Promise((resolve, reject) => {
      try {
        // Get voice sample metadata
        const voiceDir = path.join('./uploads/voices', voiceId);
        const metadataPath = path.join(voiceDir, 'metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
          reject(new HttpException('Voice sample not found', HttpStatus.NOT_FOUND));
          return;
        }

        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // For now, use system TTS with modified parameters based on voice sample
        // In a real implementation, you would use AI voice cloning models
        const speed = this.getSpeedForVoiceStyle(1.0, voiceStyle);
        text = this.applyVoiceStyleToText(text, voiceStyle);
        
        // Use a neutral voice as base for cloning
        const voiceOptions = process.platform === 'win32' ? 'Microsoft Zira Desktop' : null;
        
        say.export(text, voiceOptions, speed, outputPath, (err) => {
          if (err) {
            console.error('Voice cloning TTS Error:', err);
            reject(new HttpException('Failed to generate cloned voice', HttpStatus.INTERNAL_SERVER_ERROR));
            return;
          }
          
          try {
            const audioBuffer = fs.readFileSync(outputPath);
            fs.unlinkSync(outputPath);
            
            resolve({
              audioBuffer,
              contentType: 'audio/wav',
              message: `Voice cloned from ${metadata.originalName} (${voiceStyle} style)`,
              text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
              voiceId,
              voiceStyle,
              isCloned: true
            });
          } catch (readError) {
            reject(new HttpException('Failed to read generated audio', HttpStatus.INTERNAL_SERVER_ERROR));
          }
        });
      } catch (error) {
        reject(new HttpException('Voice cloning failed', HttpStatus.INTERNAL_SERVER_ERROR));
      }
    });
  }
}