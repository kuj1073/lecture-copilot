import { requestMicrophoneAccess } from './recorder.js';
import { loadVoskModel, createRecognizer } from './vosk-worker.js';
import { UtteranceQueue } from './utterance-queue.js';
import { LivePipeline } from './live-pipeline.js';

const MODEL_URL = 'model.tar.gz';

function averageConfidence(words) {
  if (!words || !words.length) return null;
  return words.reduce((sum, w) => sum + (w.conf ?? 0), 0) / words.length;
}

/**
 * frontend/src/services/mock.js의 createMockStt와 같은 인터페이스.
 * services/index.js에서 createMockStt 대신 이걸 쓰면 실제 STT로 교체된다.
 */
export function createStt({ onStatus, onUtterance, onPending, getPageAt, getElapsed }) {
  let model = null;
  let recognizer = null;
  let pipeline = null;
  let stream = null;

  return {
    async start() {
      onPending(0);

      if (!model) model = await loadVoskModel(MODEL_URL);
      recognizer = createRecognizer(model);

      const queue = new UtteranceQueue();
      const statusEmitter = { set: onStatus };
      pipeline = new LivePipeline(recognizer, statusEmitter, queue);

      recognizer.on('partialresult', () => onPending(1));

      recognizer.on('result', (message) => {
        onPending(0);

        const text = message.result?.text?.trim();
        if (!text) return;

        const words = message.result?.result ?? [];
        const startMs = words.length ? Math.round(words[0].start * 1000) : Math.round(getElapsed());
        const endMs = words.length ? Math.round(words[words.length - 1].end * 1000) : startMs;

        onUtterance({
          text,
          startMs,
          endMs,
          page: getPageAt(startMs),
          confidence: averageConfidence(words),
        });
      });

      stream = await requestMicrophoneAccess();
      pipeline.start(stream);
    },

    async stop() {
      if (!pipeline) return;
      await pipeline.stop();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      pipeline = null;
    },
  };
}
