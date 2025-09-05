#!/bin/sh
set -e

# Start Ollama server in background
ollama serve &

# Give it a few seconds to start
sleep 5

# Pull models you need
ollama pull tinyllama
# ollama pull mistral
# ollama pull gemma:2b

# Keep Ollama running in foreground
wait
