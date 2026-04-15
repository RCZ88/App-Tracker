#!/usr/bin/env python3
"""
Task Completion Notification Script for AI Coding Agents.
Plays a sound or speaks a message when the agent finishes a task.
"""

import sys
import platform
import subprocess
import argparse
import time
import os


def beep():
    """Play a simple system beep."""
    system = platform.system()
    try:
        if system == "Windows":
            import winsound

            winsound.Beep(880, 300)  # Frequency 880Hz, duration 300ms
            time.sleep(0.1)
            winsound.Beep(880, 300)
        elif system == "Darwin":  # macOS
            # Use AppleScript for system beep
            subprocess.run(["osascript", "-e", "beep 2"], check=False)
        else:  # Linux and others
            # Try beep command, fallback to print bell
            try:
                subprocess.run(["beep", "-f", "880", "-l", "300"], check=False)
                time.sleep(0.1)
                subprocess.run(["beep", "-f", "880", "-l", "300"], check=False)
            except (subprocess.SubprocessError, FileNotFoundError):
                print("\a", end="", flush=True)  # ASCII bell
                time.sleep(0.1)
                print("\a", end="", flush=True)
    except Exception as e:
        print(f"Beep failed: {e}", file=sys.stderr)


def speak(text, voice=None):
    """
    Speak text using offline TTS (pyttsx3 if available).
    Falls back to system TTS commands if pyttsx3 not installed.
    """
    try:
        import pyttsx3

        engine = pyttsx3.init()
        if voice:
            voices = engine.getProperty("voices")
            for v in voices:
                if voice.lower() in v.name.lower():
                    engine.setProperty("voice", v.id)
                    break
        engine.say(text)
        engine.runAndWait()
        return
    except ImportError:
        pass  # Fall through to system commands

    # Fallback: platform-specific TTS
    system = platform.system()
    try:
        if system == "Darwin":  # macOS
            subprocess.run(["say", text], check=False)
        elif system == "Windows":
            # Use PowerShell
            ps_cmd = f'Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak("{text}")'
            subprocess.run(["powershell", "-Command", ps_cmd], check=False)
        else:  # Linux
            # Try espeak, festival, or spd-say
            try:
                subprocess.run(["espeak", text], check=False)
            except FileNotFoundError:
                try:
                    subprocess.run(
                        ["festival", "--tts"], input=text, text=True, check=False
                    )
                except FileNotFoundError:
                    try:
                        subprocess.run(["spd-say", text], check=False)
                    except FileNotFoundError:
                        print(f"Could not speak: {text}", file=sys.stderr)
    except Exception as e:
        print(f"TTS fallback failed: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="AI Task Completion Notifier")
    parser.add_argument("--speak", "-s", type=str, help="Text to speak (TTS)")
    parser.add_argument(
        "--voice", "-v", type=str, default="", help="Voice for TTS (if supported)"
    )
    parser.add_argument("--no-beep", action="store_true", help="Suppress beep")
    parser.add_argument(
        "--project", "-p", type=str, default="", help="Project name for announcement"
    )
    args = parser.parse_args()

    # Play beep unless suppressed
    if not args.no_beep:
        beep()

    # Speak if requested
    if args.speak:
        if args.project:
            msg = f"{args.project}: {args.speak}"
        else:
            msg = args.speak
        speak(msg, args.voice)
    elif args.project:
        # No explicit speak, but project provided – speak the project name
        speak(f"{args.project} task complete", args.voice)


if __name__ == "__main__":
    main()
