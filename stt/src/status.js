export const RecordingStatus = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  STOPPED: 'stopped',
  ERROR: 'error',
};

export class StatusEmitter {
  constructor() {
    this.status = RecordingStatus.IDLE;
    this.listeners = [];
  }

  get() {
    return this.status;
  }

  set(status) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
