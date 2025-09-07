from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import logging
from io import BytesIO
import torch
import torchaudio
from TTS.api import TTS

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize TTS model
try:
    # Use Coqui TTS with a pre-trained model
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
    logger.info("TTS model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load TTS model: {e}")
    tts = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": tts is not None})

@app.route('/generate', methods=['POST'])
def generate_voice():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Text is required"}), 400
        
        text = data['text']
        language = data.get('language', 'en')
        voice_style = data.get('voice_style', 'neutral')
        voice_id = data.get('voice_id')
        
        logger.info(f"Generating voice for text: {text[:50]}...")
        
        if not tts:
            return jsonify({"error": "TTS model not available"}), 500
        
        # Create temporary file for output
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            output_path = tmp_file.name
        
        try:
            # Generate speech
            if voice_id:
                # Use custom voice if provided (placeholder for voice cloning)
                logger.info(f"Using custom voice: {voice_id}")
                # In a real implementation, you would load the custom voice model here
            
            # Generate audio
            tts.tts_to_file(text=text, file_path=output_path)
            
            # Read the generated audio file
            with open(output_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Clean up temporary file
            os.unlink(output_path)
            
            # Return audio as response
            return send_file(
                BytesIO(audio_data),
                mimetype='audio/wav',
                as_attachment=True,
                download_name='generated_voice.wav'
            )
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(output_path):
                os.unlink(output_path)
            raise e
            
    except Exception as e:
        logger.error(f"Error generating voice: {e}")
        return jsonify({"error": "Failed to generate voice"}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available TTS models"""
    try:
        # Get available models from TTS
        models = TTS.list_models()
        return jsonify({"models": models})
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return jsonify({"error": "Failed to list models"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)