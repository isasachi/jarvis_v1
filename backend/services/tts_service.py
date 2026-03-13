import os
import io
import wave
from pathlib import Path

try:
    from piper.tts import PiperVoice
except ImportError:
    from piper import PiperVoice


class TTSService:
    def __init__(self):
        self.voice_dir = Path(__file__).parent.parent / "voice"
        self.model_file = self.voice_dir / "jarvis-epoch570.onnx"
        self.config_file = self.voice_dir / "jarvis-epoch570.onnx.json"
        self.voice = None

    async def initialize(self):
        if self.voice is not None:
            return
        print(f"Cargando modelo: {self.model_file}")
        if not self.model_file.exists():
            raise FileNotFoundError(f"Model not found: {self.model_file}")
        if not self.config_file.exists():
            raise FileNotFoundError(f"Config not found: {self.config_file}")

        self.voice = PiperVoice.load(
            str(self.model_file),
            config_path=str(self.config_file),
            use_cuda=False
        )
        print("Modelo cargado OK")

        print("Calentando modelo...")
        for frase in [
            "Inicializando sistemas de síntesis de voz.",
            "Todos los sistemas operando con normalidad."
        ]:
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(22050)
                self.voice.synthesize_wav(frase, wav_file)
        print("Modelo listo")

    async def synthesize(self, text: str) -> bytes:
        await self.initialize()
        print(f"Sintetizando: {text[:50]}")
        
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(22050)
            self.voice.synthesize_wav(text, wav_file)
        
        wav_bytes = wav_buffer.getvalue()
        print(f"Audio generado: {len(wav_bytes)} bytes")
        return wav_bytes
