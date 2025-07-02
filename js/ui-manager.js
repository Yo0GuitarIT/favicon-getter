/**
 * UI 管理模組 - 現代化 CSS 狀態管理
 * 負責所有用戶介面相關的操作，使用 CSS 類別和 data 屬性控制狀態
 */

import { copyTextToClipboard, updatePageFavicon } from "./utils.js";
import { getFaviconSource } from "./favicon-selector.js";

// 獲取容器元素，用於全域狀態管理
const container = document.querySelector(".container");

// 狀態管理：設定應用程式狀態
export function setAppState(state) {
  if (container) {
    container.setAttribute("data-state", state);
  }
}

// 顯示載入狀態
export function showLoading() {
  setAppState("loading");
}

// 隱藏載入狀態，回到閒置狀態
export function hideLoading() {
  setAppState("idle");
}

// 顯示錯誤訊息
export function showError(message) {
  hideAllMessages();
  setAppState("error");

  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  errorDiv.classList.add("show");

  // 利用 CSS 動畫自動隱藏，同時監聽動畫結束事件
  errorDiv.addEventListener("animationend", function hideHandler() {
    errorDiv.classList.remove("show");
    errorDiv.removeEventListener("animationend", hideHandler);
  });
}

// 顯示成功訊息
export function showSuccess(message) {
  hideAllMessages();

  const successDiv = document.getElementById("success");
  successDiv.textContent = message;
  successDiv.classList.add("show");

  // 利用 CSS 動畫自動隱藏，同時監聽動畫結束事件
  successDiv.addEventListener("animationend", function hideHandler() {
    successDiv.classList.remove("show");
    successDiv.removeEventListener("animationend", hideHandler);
  });
}

// 隱藏所有訊息
function hideAllMessages() {
  const errorDiv = document.getElementById("error");
  const successDiv = document.getElementById("success");

  errorDiv.classList.remove("show");
  successDiv.classList.remove("show");
}
// 顯示單一最佳 Favicon
export function displaySingleFavicon(favicon) {
  const grid = document.getElementById("faviconGrid");
  grid.innerHTML = "";

  // 創建標題
  const sectionTitle = document.createElement("div");
  sectionTitle.className = "section-title single";
  sectionTitle.innerHTML = `<h2>🏆 最佳 Favicon</h2>`;
  grid.appendChild(sectionTitle);

  // 創建 Favicon 項目
  const item = createFaviconItem(favicon);
  grid.appendChild(item);

  setAppState("results");
}

// 創建 Favicon 項目元素
function createFaviconItem(favicon) {
  const item = document.createElement("div");
  item.className = "favicon-item best";

  const sizeInfo = favicon.size ? ` (${favicon.size})` : "";
  const serviceInfo = favicon.service ? ` - ${favicon.service}` : "";
  const source = getFaviconSource(favicon);

  item.innerHTML = `
    <img src="${favicon.url}" 
         alt="Favicon" 
         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
         loading="lazy">
    <div style="display:none; color:#666; font-size:12px;">載入失敗</div>
    <h3>${favicon.type}${sizeInfo}${serviceInfo}</h3>
    <div class="quality-info">來源：${source}</div>
    <div class="favicon-url">${favicon.url}</div>
    <button class="copy-btn" onclick="copyToClipboard('${favicon.url}', this)">
      <span>複製連結</span>
    </button>
    <button class="apply-btn" onclick="copyAndApplyFavicon('${favicon.url}', this)">
      <span>複製並套用</span>
    </button>
  `;

  return item;
}

// 按鈕狀態管理輔助函數
function setButtonState(button, state, timeout = 2000) {
  button.setAttribute("data-state", state);
  button.disabled = state !== "";

  if (timeout > 0) {
    setTimeout(() => {
      button.setAttribute("data-state", "");
      button.disabled = false;
    }, timeout);
  }
}

// 複製到剪貼簿 - 使用 CSS 狀態管理
export async function copyToClipboard(text, button) {
  if (!text || typeof text !== "string") {
    showError("無效的文字內容");
    return;
  }

  try {
    setButtonState(button, "processing", 0);
    await copyTextToClipboard(text);

    setButtonState(button, "success", 2000);
    showSuccess("連結已複製到剪貼簿！");
  } catch (error) {
    console.error("複製失敗:", error);
    setButtonState(button, "error", 2000);
    showError(error.message || "複製失敗，請重試");
  }
}

// 複製並套用 Favicon - 使用 CSS 狀態管理
export async function copyAndApplyFavicon(faviconUrl, button) {
  if (!faviconUrl || typeof faviconUrl !== "string") {
    showError("無效的 favicon URL");
    return;
  }

  try {
    setButtonState(button, "processing", 0);

    // 複製到剪貼簿
    await copyTextToClipboard(faviconUrl);

    // 更新當前頁面 favicon
    updatePageFavicon(faviconUrl);

    setButtonState(button, "success", 2000);
    showSuccess("已複製到剪貼簿並更新網頁圖示！");
  } catch (error) {
    console.error("操作失敗:", error);
    setButtonState(button, "error", 2000);
    showError(error.message || "操作失敗，請重試");
  }
}

// 初始化輸入事件監聽器
export function initializeInputListeners() {
  const urlInput = document.getElementById("urlInput");

  // Enter 鍵提交事件
  urlInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      // 觸發自定義事件
      window.dispatchEvent(new CustomEvent("getFavicons"));
    }
  });

  // 輸入驗證
  urlInput.addEventListener("input", function () {
    hideAllMessages();
  });

  // 預設範例 URL
  urlInput.value = "https://www.google.com";
  urlInput.focus();
}
