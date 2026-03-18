import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
import os
import uuid
from faster_whisper import WhisperModel

# ---------------- CONFIG ---------------- #

SAMPLE_RATE = 16000
DURATION = 15

RECORDINGS_DIR = "./recordings"
TRANSCRIPTS_DIR = "./transcripts"

os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# ---------------- LOAD MODEL ONCE ---------------- #

print("Loading Whisper model (small)...")

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

print("Model loaded successfully")

# ---------------- RECORD AUDIO ---------------- #

def record_audio():
    print("🎤 Speak now...")

    audio = sd.rec(
        int(DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="int16"
    )

    sd.wait()

    print("✅ Recording finished")

    return audio

# ---------------- SAVE AUDIO ---------------- #

def save_audio(audio):

    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(RECORDINGS_DIR, filename)

    write(filepath, SAMPLE_RATE, audio)

    return filepath

# ---------------- TRANSCRIBE AUDIO ---------------- #

def transcribe_audio(audio_path):

    segments, info = model.transcribe(
        audio_path,
        beam_size=1,
        vad_filter=True
    )

    text = ""

    for segment in segments:
        print("🗣", segment.text)
        text += segment.text + " "

    return text.strip()

# ---------------- SAVE TRANSCRIPT ---------------- #

def save_transcript(text):

    filename = f"{uuid.uuid4()}.txt"
    filepath = os.path.join(TRANSCRIPTS_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(text)

    return filepath

# ---------------- MAIN ---------------- #

if __name__ == "__main__":

    audio = record_audio()

    audio_path = save_audio(audio)

    text = transcribe_audio(audio_path)

    transcript_path = save_transcript(text)

    print("\n📝 Transcription:")
    print(text)

    print("\nSaved to:", transcript_path)

# ---------------- FUNCTION FOR API ---------------- #

def get_asr_text():

    audio = record_audio()

    audio_path = save_audio(audio)

    text = transcribe_audio(audio_path)

    save_transcript(text)

    return text.strip()

