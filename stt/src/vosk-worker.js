import { createModel } from 'vosk-browser';

const SAMPLE_RATE = 16000;

let modelPromise = null;

export function loadVoskModel(modelUrl) {
  if (!modelPromise) {
    modelPromise = createModel(modelUrl);
  }
  return modelPromise;
}

export function createRecognizer(model, sampleRate = SAMPLE_RATE) {
  const recognizer = new model.KaldiRecognizer(sampleRate);
  recognizer.setWords(true);
  return recognizer;
}
