const runtime = (typeof chrome !== 'undefined' && chrome.runtime)
  ? chrome.runtime
  : (typeof browser !== 'undefined' && browser.runtime)
    ? browser.runtime
    : null;

if (runtime && runtime.onMessage) {
  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_SYNC') {
      setTimeout(() => {
        runtime.sendMessage({
          action: 'SYNC_PROGRESS',
          step: 'init',
          status: 'running',
          message: 'Memeriksa sesi Seller Center...'
        });
        setTimeout(() => {
          runtime.sendMessage({
            action: 'SYNC_COMPLETE',
            success: true,
            summary: 'Sync stub selesai.'
          });
        }, 800);
      }, 300);
      sendResponse({ received: true });
      return true;
    }
  });
}
