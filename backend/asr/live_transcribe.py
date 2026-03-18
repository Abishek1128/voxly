from fastapi import APIRouter, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import subprocess

router = APIRouter()

model = WhisperModel(
    "base",
    device="cuda",
    compute_type="float16"
)

@router.post("/live-transcribe")
async def live_transcribe(audio: UploadFile = File(...)):

    audio_bytes = await audio.read()

    # save webm
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
        f.write(audio_bytes)
        webm_path = f.name

    wav_path = webm_path.replace(".webm", ".wav")

    # convert to wav
    subprocess.run([
        "ffmpeg",
        "-i", webm_path,
        wav_path
    ])

    segments, _ = model.transcribe(wav_path)

    text = ""
    for s in segments:
        text += s.text

    return {"text": text.strip()}