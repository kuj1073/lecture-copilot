export async function requestMicrophoneAccess() {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export class Recorder {
  constructor(stream, onChunk) {
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        onChunk(event.data);
      }
    };
  }

  start() {
    this.mediaRecorder.start(1000);
  }

  stop() {
    this.mediaRecorder.stop();
  }
}
