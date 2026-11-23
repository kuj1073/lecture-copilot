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

    this.recognizer.on('result', (message) => {
      this.utteranceQueue.pushResult(message.result);
    });
  }

  start(stream) {
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.processorNode = this.audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);

    this.processorNode.onaudioprocess = (event) => {
      this.recognizer.acceptWaveformFloat(
        event.inputBuffer.getChannelData(0),
        this.audioContext.sampleRate
      );
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
    this.statusEmitter.set(RecordingStatus.RECORDING);
  }

  stop() {
    return new Promise((resolve) => {
      this.statusEmitter.set(RecordingStatus.PROCESSING);

      const onFinalResult = () => {
        this.recognizer.removeEventListener('result', onFinalResult);
        this.teardownAudioGraph();
        this.statusEmitter.set(RecordingStatus.STOPPED);
        resolve(this.utteranceQueue.flush());
      };

      this.recognizer.addEventListener('result', onFinalResult);
      this.recognizer.retrieveFinalResult();
    });
  }

  teardownAudioGraph() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
