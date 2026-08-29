(() => {
  if (window.__shadratOwnerToolsReady) return;
  window.__shadratOwnerToolsReady = true;
  import('./owner-inline-edit.js?v=2').catch(error => console.warn('[Shadrat] inline owner editor', error));
})();
