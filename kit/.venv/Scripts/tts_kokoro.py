import sys
import argparse
from kokoro import TTS

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice', default='am_michael')
    parser.add_argument('--speed', type=float, default=1.0)
    parser.add_argument('text', nargs='+')
    args = parser.parse_args()

    tts = TTS(
        model_name="tts_models/en/ljspeech/tacotron2-DDC",
        vocoder_name="vocoder_models/en/ljspeech/vits",
        config_path="config.json",
        weight_path="weights.pth",
        voice_name=args.voice,
        speed=args.speed
    )

    tts.tts_to_file(args.text, "output.wav")

if __name__ == "__main__":
    main()