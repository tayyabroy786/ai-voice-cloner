import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  voiceForm: FormGroup;
  audioFile: File | null = null;
  isGenerating = false;
  isRecording = false;
  mediaRecorder: MediaRecorder | null = null;
  recordedBlob: Blob | null = null;
  recordingTime = 0;
  recordingInterval: any;
  generatedAudioUrl: string | null = null;
  lastGeneratedText = '';

  languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' }
  ];

  voiceTypes = [
    { value: 'male', label: 'Male Voice' },
    { value: 'female', label: 'Female Voice' },
    { value: 'baby_boy', label: 'Baby Boy Voice' },
    { value: 'baby_girl', label: 'Baby Girl Voice' },
    { value: 'elderly_male', label: 'Elderly Male' },
    { value: 'elderly_female', label: 'Elderly Female' }
  ];

  voiceStyles = [
    { value: 'neutral', label: 'Neutral' },
    { value: 'happy', label: 'Happy' },
    { value: 'sad', label: 'Sad' },
    { value: 'angry', label: 'Angry' },
    { value: 'excited', label: 'Excited' },
    { value: 'calm', label: 'Calm' }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.voiceForm = this.fb.group({
      text: ['', Validators.required],
      language: ['en', Validators.required],
      voiceType: ['female', Validators.required],
      voiceStyle: ['neutral', Validators.required]
    });

    // Clear previous audio when voice settings change
    this.voiceForm.get('language')?.valueChanges.subscribe(() => {
      this.clearGeneratedAudio();
    });

    this.voiceForm.get('voiceType')?.valueChanges.subscribe(() => {
      this.clearGeneratedAudio();
    });

    this.voiceForm.get('voiceStyle')?.valueChanges.subscribe(() => {
      this.clearGeneratedAudio();
    });
  }

  onFileSelected(event: any) {
    this.audioFile = event.target.files[0];
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(chunks, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingTime = 0;
      
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please allow microphone access.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingInterval);
    }
  }

  uploadRecordedVoice() {
    if (!this.recordedBlob) return;

    const formData = new FormData();
    const audioFile = new File([this.recordedBlob], 'recorded-voice.wav', { type: 'audio/wav' });
    formData.append('audio', audioFile);

    this.http.post('http://localhost:3001/api/train-voice', formData).subscribe({
      next: (response) => {
        console.log('Recorded voice uploaded successfully', response);
        alert('Recorded voice sample uploaded successfully!');
        this.deleteRecording();
      },
      error: (error) => {
        console.error('Upload failed', error);
        alert('Upload failed!');
      }
    });
  }

  uploadVoiceSample() {
    if (!this.audioFile) return;

    const formData = new FormData();
    formData.append('audio', this.audioFile);

    this.http.post('http://localhost:3001/api/train-voice', formData).subscribe({
      next: (response) => {
        console.log('Voice uploaded successfully', response);
        alert('Voice sample uploaded successfully!');
      },
      error: (error) => {
        console.error('Upload failed', error);
        alert('Upload failed!');
      }
    });
  }

  generateVoice() {
    if (this.voiceForm.invalid) return;

    // Clear previous audio before generating new one
    this.clearGeneratedAudio();
    
    this.isGenerating = true;
    const formData = this.voiceForm.value;
    this.lastGeneratedText = formData.text;

    this.http.post('http://localhost:3001/api/voice', formData, { responseType: 'blob' }).subscribe({
      next: (audioBlob: Blob) => {
        this.generatedAudioUrl = URL.createObjectURL(audioBlob);
        this.isGenerating = false;
      },
      error: (error) => {
        console.error('Generation failed', error);
        alert('Voice generation failed!');
        this.isGenerating = false;
      }
    });
  }

  downloadGeneratedAudio() {
    if (!this.generatedAudioUrl) return;
    
    const a = document.createElement('a');
    a.href = this.generatedAudioUrl;
    a.download = 'generated-voice.wav';
    a.click();
  }

  deleteRecording() {
    this.recordedBlob = null;
    this.recordingTime = 0;
  }

  clearGeneratedAudio() {
    if (this.generatedAudioUrl) {
      URL.revokeObjectURL(this.generatedAudioUrl);
      this.generatedAudioUrl = null;
    }
  }
}