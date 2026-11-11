import { RecordingStatus, StatusEmitter } from './status.js';

export async function requestMicrophoneAccess() {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export class Recorder {
  constructor(stream, onChunk) {
    this.status = new StatusEmitter();
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        onChunk(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      this.status.set(RecordingStatus.RECORDING);
    };

    this.mediaRecorder.onstop = () => {
      this.status.set(RecordingStatus.STOPPED);
    };

    this.mediaRecorder.onerror = () => {
      this.status.set(RecordingStatus.ERROR);
    };
  }

  start() {
    this.mediaRecorder.start(1000);
  }

  stop() {
    this.mediaRecorder.stop();
  }
}
