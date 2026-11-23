export class UtteranceQueue {
  constructor() {
    this.utterances = [];
  }

  pushResult(result) {
    const text = result?.text?.trim();
    if (!text) return;

    const words = result.result ?? [];
    const start = words.length ? words[0].start : null;
    const end = words.length ? words[words.length - 1].end : null;

    this.utterances.push({ text, start, end });
  }

  all() {
    return this.utterances;
  }

  flush() {
    const collected = this.utterances;
    this.utterances = [];
    return collected;
  }
}
