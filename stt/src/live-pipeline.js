import { RecordingStatus } from './status.js';

const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

export class LivePipeline {
  constructor(recognizer, statusEmitter, utteranceQueue) {
    this.recognizer = recognizer;
    this.statusEmitter = statusEmitter;
    this.utteranceQueue = utteranceQueue;
    this.audioContext = null;
    this.sourceNode = null;
    this.processorNode = null;

    this.lastError = null;

    this.recognizer.on('result', (message) => {
      this.utteranceQueue.pushResult(message.result);
    });

    this.recognizer.on('error', (message) => {
      this.lastError = message.error;
      this.teardownAudioGraph();
      this.statusEmitter.set(RecordingStatus.ERROR);
    });
  }

  start(stream) {
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.processorNode = this.audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);

    this.processorNode.onaudioprocess = (event) => {
      try {
        this.recognizer.acceptWaveformFloat(
          event.inputBuffer.getChannelData(0),
          this.audioContext.sampleRate
        );
      } catch (error) {
        this.lastError = error.message;
        this.teardownAudioGraph();
        this.statusEmitter.set(RecordingStatus.ERROR);
      }
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
    this.statusEmitter.set(RecordingStatus.RECORDING);
  }

  stop() {
    return new Promise((resolve, reject) => {
      this.statusEmitter.set(RecordingStatus.PROCESSING);

      const cleanup = () => {
        this.recognizer.removeEventListener('result', onFinalResult);
        this.recognizer.removeEventListener('error', onStopError);
      };

      const onFinalResult = () => {
        cleanup();
        this.teardownAudioGraph();
        this.statusEmitter.set(RecordingStatus.STOPPED);
        resolve(this.utteranceQueue.flush());
      };

      const onStopError = (message) => {
        cleanup();
        this.lastError = message.error;
        this.teardownAudioGraph();
        this.statusEmitter.set(RecordingStatus.ERROR);
        reject(new Error(message.error));
      };

      this.recognizer.addEventListener('result', onFinalResult);
      this.recognizer.addEventListener('error', onStopError);
      this.recognizer.retrieveFinalResult();
    });
  }

  teardownAudioGraph() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
  }
}
