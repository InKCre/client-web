export function routeToTakingNote() {
  return browser.runtime
    .sendMessage({ type: 'get-tab-id', from: 'sidepanel' })
    .then(({ tabId }) => {
      return browser.sidePanel.setOptions({
        path: './taking-note.html',
        tabId: tabId,
      })
    })
}

export function routeToExplain() {
  return browser.runtime
    .sendMessage({ type: 'get-tab-id', from: 'sidepanel' })
    .then(({ tabId }) => {
      return browser.sidePanel.setOptions({
        path: './explain.html',
        tabId: tabId,
      })
    })
}
