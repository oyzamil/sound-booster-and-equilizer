const dev = ['*://*.example.com/*', '*://*.softwebtuts.blogspot.com/*'];
const production = ['<all_urls>'];

export default defineContentScript({
  matches: import.meta.env.MODE === 'development' ? dev : production,
  main() {
    console.log('Audio Equalizer content script loaded');
    const processor = new AudioProcessor();
    let currentSettings: AudioSettings | null = null;
    const processedMedia = new WeakSet<HTMLMediaElement>();
    async function initializeSettings() {
      currentSettings = useSettingsStore.getState().settings;
    }
    function processMediaElement(media: HTMLMediaElement) {
      if (processedMedia.has(media)) return;
      processedMedia.add(media);
      const setupAudio = () => {
        if (currentSettings?.enabled) {
          processor.connectMedia(media, currentSettings);
        }
      };
      // Handle different media ready states
      const initAudio = () => {
        if (media.readyState >= HTMLMediaElement.HAVE_METADATA) {
          setupAudio();
        }
      };
      // Try to setup immediately if media is ready
      initAudio();
      // Also listen for these events in case media wasn't ready
      media.addEventListener('loadedmetadata', setupAudio, { once: true });
      media.addEventListener('canplay', setupAudio, { once: true });
      // Handle source changes (e.g., playlist navigation)
      media.addEventListener('emptied', () => {
        // Media source changed, will reconnect on next loadedmetadata
      });
    }
    function scanForMedia() {
      const audioElements = document.querySelectorAll('audio');
      const videoElements = document.querySelectorAll('video');
      audioElements.forEach(processMediaElement);
      videoElements.forEach(processMediaElement);
    }
    initializeSettings().then(() => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanForMedia);
      } else {
        scanForMedia();
      }
      // Also scan after a short delay to catch any dynamically loaded media
      setTimeout(scanForMedia, 1000);
    });
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLMediaElement) {
            processMediaElement(node);
          } else if (node instanceof Element) {
            const media = node.querySelectorAll('audio, video');
            media.forEach((el) => processMediaElement(el as HTMLMediaElement));
          }
        });
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATE') {
        currentSettings = message.settings;
        const allMedia = [
          ...Array.from(document.querySelectorAll('audio')),
          ...Array.from(document.querySelectorAll('video')),
        ];
        allMedia.forEach((media) => {
          if (processedMedia.has(media)) {
            if (currentSettings?.enabled) {
              processor.updateSettings(media, currentSettings);
            } else {
              processor.disconnectMedia(media);
              processedMedia.delete(media); // Allow reconnection later
            }
          }
        });
      }
    });
    window.addEventListener('beforeunload', () => {
      processor.disconnectAll();
      observer.disconnect();
    });
  },
});
