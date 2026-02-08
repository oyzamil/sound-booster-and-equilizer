export const getCurrentTab = () => {
  return new Promise(async (resolve) => {
    try {
      let queryOptions = { active: true, lastFocusedWindow: true };
      /* eslint-disable no-undef */
      let tabs = await browser.tabs.query(queryOptions);

      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        // Ensure tab has required properties
        if (tab && tab.id) {
          resolve(tab);
        } else {
          console.warn('Tab found but missing id:', tab);
          resolve({
            id: null,
            url: null,
          });
        }
      } else {
        console.warn('No active tab found');
        resolve({
          id: null,
          url: null,
        });
      }
    } catch (e) {
      console.error('Error getting current tab:', e);
      resolve({
        id: null,
        url: null,
      });
    }
  });
};
