/**
 * Function to create an offscreen document if it doesn't already exist.
 */
const createOffscreenDocument = async () => {
  try {
    // Get existing extension contexts
    const existingContexts = await browser.runtime.getContexts({});

    // Check if the offscreen document already exists among the contexts
    const offscreenDocument = existingContexts.find((c) => c.contextType === 'OFFSCREEN_DOCUMENT');

    // If the offscreen document does not exist, create it
    if (!offscreenDocument) {
      try {
        await browser.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['USER_MEDIA'],
          justification:
            'Recording from browser.tabCapture API and processing audio with equalizer, compressor, chorus, and other effects',
        });
        // Wait a bit for the document to initialize
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        // Ignore error if offscreen document already exists (race condition)
        if (
          error.message &&
          (error.message.includes('Only a single offscreen document may be created') ||
            error.message.includes('offscreen document already exists'))
        ) {
          // Document was created by another call, which is fine
          console.log('Offscreen document already exists (race condition)');
          return;
        }
        // Re-throw other errors
        console.error('Error creating offscreen document:', error);
        throw error;
      }
    } else {
      // Offscreen document exists, verify it's ready
      console.log('Offscreen document already exists');
    }
  } catch (error) {
    console.error('Error in createOffscreenDocument:', error);
    // Re-throw to allow caller to handle
    throw error;
  }
};

export default createOffscreenDocument;
