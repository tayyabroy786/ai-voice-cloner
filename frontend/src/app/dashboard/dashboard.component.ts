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

  languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' }
  ];

  voiceStyles = [
    { value: 'neutral', label: 'Neutral' },
    { value: 'happy', label: 'Happy' },
    { value: 'sad', label: 'Sad' },
    { value: 'angry', label: 'Angry' }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.voiceForm = this.fb.group({
      text: ['', Validators.required],
      language: ['en', Validators.required],
      voiceStyle: ['neutral', Validators.required]
    });
  }

  onFileSelected(event: any) {
    this.audioFile = event.target.files[0];
  }

  uploadVoiceSample() {
    if (!this.audioFile) return;

    const formData = new FormData();
    formData.append('audio', this.audioFile);

    this.http.post('/api/train-voice', formData).subscribe({
      next: (response) => console.log('Voice uploaded successfully', response),
      error: (error) => console.error('Upload failed', error)
    });
  }

  generateVoice() {
    if (this.voiceForm.invalid) return;

    this.isGenerating = true;
    const formData = this.voiceForm.value;

    this.http.post('/api/voice', formData, { responseType: 'blob' }).subscribe({
      next: (audioBlob) => {
        const url = window.URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-voice.wav';
        a.click();
        window.URL.revokeObjectURL(url);
        this.isGenerating = false;
      },
      error: (error) => {
        console.error('Generation failed', error);
        this.isGenerating = false;
      }
    });
  }
}