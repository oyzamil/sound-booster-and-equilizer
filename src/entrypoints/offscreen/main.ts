export default defineUnlistedScript(() => {
  console.log('Offscreen document initialized for audio processing');

  const keepAlive = setInterval(() => {
    // Keep offscreen document alive
  }, 20000);

  window.addEventListener('beforeunload', () => {
    clearInterval(keepAlive);
  });
});
