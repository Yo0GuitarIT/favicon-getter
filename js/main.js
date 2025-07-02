/**
 * 主程式模組
 * 整合所有功能並提供主要的業務邏輯
 */

import { normalizeUrl, isClipboardAPIAvailable } from "./utils.js";
import {
  getFaviconFromHTMLSource,
  getFaviconFromHTML,
  getFaviconFromServices,
} from "./favicon-finder.js";
import { selectBestFavicon, getFaviconSource } from "./favicon-selector.js";
import {
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  displaySingleFavicon,
  copyToClipboard,
  copyAndApplyFavicon,
  initializeInputListeners,
} from "./ui-manager.js";

// 主要的獲取 Favicon 功能
export async function getFavicons() {
  const urlInput = document.getElementById("urlInput");
  const url = normalizeUrl(urlInput.value.trim());

  // 驗證 URL
  if (!url) {
    showError("請輸入有效的 URL");
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    showError("請輸入有效的 URL 格式");
    return;
  }

  showLoading();

  try {
    const allFavicons = [];

    // 並行執行三種搜尋方法
    const [htmlFavicons, directFavicons, serviceFavicons] = await Promise.all([
      getFaviconFromHTMLSource(url),
      getFaviconFromHTML(url),
      getFaviconFromServices(parsedUrl.hostname),
    ]);

    allFavicons.push(...htmlFavicons, ...directFavicons, ...serviceFavicons);

    hideLoading();

    if (allFavicons.length === 0) {
      showError("未找到任何 favicon，該網站可能沒有設定圖示或存在存取限制");
      return;
    }

    // 去除重複的 favicon
    const uniqueFavicons = removeDuplicateFavicons(allFavicons);

    // 選擇並顯示最佳的 favicon
    const bestFavicon = selectBestFavicon(uniqueFavicons);

    if (bestFavicon) {
      displaySingleFavicon(bestFavicon);
      showSuccess(`找到最佳 favicon！來源：${getFaviconSource(bestFavicon)}`);
    } else {
      showError("未找到合適的 favicon");
    }
  } catch (error) {
    hideLoading();
    console.error("取得 favicon 時發生錯誤:", error);
    showError("取得 favicon 時發生錯誤: " + error.message);
  }
}

// 移除重複的 Favicon
function removeDuplicateFavicons(favicons) {
  return favicons.filter(
    (favicon, index, self) =>
      index === self.findIndex((f) => f.url === favicon.url)
  );
}

// 初始化應用程式
function initializeApp() {
  // 檢查剪貼簿 API 可用性
  if (!isClipboardAPIAvailable()) {
    showError("注意：剪貼簿功能需要 HTTPS 或本機環境才能正常運作");
  }

  // 初始化輸入監聽器
  initializeInputListeners();

  // 監聽自定義事件
  window.addEventListener("getFavicons", getFavicons);
}

// 將函數暴露到全域範圍（用於 HTML onclick）
window.getFavicons = getFavicons;
window.copyToClipboard = copyToClipboard;
window.copyAndApplyFavicon = copyAndApplyFavicon;

// 當 DOM 載入完成時初始化應用程式
document.addEventListener("DOMContentLoaded", initializeApp);
