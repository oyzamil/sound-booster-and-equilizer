const dev = ['*://*.example.com/*', '*://*.softwebtuts.blogspot.com/*'];
const production = ['<all_urls>'];

export default defineContentScript({
  matches: import.meta.env.MODE === 'development' ? production : production,
  main() {
    document.addEventListener('fullscreenchange', function () {
      if (document.fullscreenElement) {
        browser.runtime.sendMessage({
          name: 'fullscreenchange',
          target: 'background',
          fullscreen: true,
          fullscreenChanged: document.fullscreenElement !== null,
        });
      } else {
        browser.runtime.sendMessage({
          name: 'fullscreenchange',
          target: 'background',
          fullscreen: false,
          fullscreenChanged: document.fullscreenElement !== null,
        });
      }
    });
  },
});
