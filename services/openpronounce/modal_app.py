import os
from pathlib import Path
import modal

CURRENT_DIR = Path(__file__).resolve().parent

# Define the container image with Linux and Python dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "espeak-ng", "libsndfile1")
    .pip_install(
        "torch",
        "transformers>=4.30",
        "librosa>=0.10",
        "soundfile>=0.12",
        "numpy>=1.24",
        "scipy>=1.10",
        "scikit-learn>=1.2",
        "fastdtw>=0.3",
        "phonemizer>=3.2",
        "Levenshtein>=0.20",
        "gTTS>=2.3",
        "fastapi>=0.100",
        "python-multipart>=0.0.6",
        "jinja2>=3.1",
    )
    .add_local_dir(CURRENT_DIR / "openpronounce", remote_path="/root/openpronounce", copy=True)
    .add_local_file(CURRENT_DIR / "server.py", remote_path="/root/server.py", copy=True)
    .add_local_dir(CURRENT_DIR / "templates", remote_path="/root/templates", copy=True)
    .add_local_dir(CURRENT_DIR / "static", remote_path="/root/static", copy=True)
    # Pre-download and cache Wav2Vec2 models during image build so cold-start is instant
    .run_commands(
        'python -c "import sys; sys.path.insert(0, \'/root\'); from openpronounce.speech import _load_models; _load_models()"'
    )
)

app = modal.App("openpronounce-api")

@app.function(
    image=image,
    cpu=2.0,
    memory=4096,  # 4GB RAM to comfortably hold Wav2Vec2 + FastDTW
    timeout=120,
)
@modal.asgi_app()
def fastapi_app():
    import sys
    sys.path.insert(0, "/root")
    from server import app as web_app
    return web_app
