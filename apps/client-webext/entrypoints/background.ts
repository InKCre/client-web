import { onMessage, sendMessage } from "webext-bridge/background";
import { browser } from "wxt/browser";

export default defineBackground(() => {
  onMessage("open-sidepanel", ({ sender, data }) => {
    const tabId = sender.tabId;
    const path = data?.path;

    browser.sidePanel.open({ tabId }).then(() => {
      // Keep notifying content script that sidepanel was opened
      sendMessage("sidepanel-opened", undefined, `content-script@${tabId}`);
      browser.sidePanel.setOptions({
        path,
        tabId,
      });
    });
  });
  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "get-tab-id") {
      if (msg.from !== "sidepanel") {
        sendResponse({ tabId: sender.tab?.id });
      }
      else {
        browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          sendResponse({ tabId });
        });
      }
    }
    return true;
  });
});
