// Firefox Manifest V2 background entrypoint.
// Load the ES module orchestrator from a classic background script.
import('./service-worker.js').catch(error => {
  console.error('Stock-Hub Sync background gagal dimuat:', error);
});
