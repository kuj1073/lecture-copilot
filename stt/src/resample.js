const TARGET_SAMPLE_RATE = 16000;

export async function resampleTo16kMono(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const decoded = await audioContext.decodeAudioData(arrayBuffer);

  const offlineContext = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * TARGET_SAMPLE_RATE),
    TARGET_SAMPLE_RATE
  );

  const source = offlineContext.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineContext.destination);
  source.start();

  const rendered = await offlineContext.startRendering();
  return rendered.getChannelData(0);
}
