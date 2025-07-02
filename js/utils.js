/**
 * 工具函數模組
 * 提供通用的輔助功能
 */

// URL 正規化
export function normalizeUrl(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

// 檢查現代剪貼簿 API 是否可用
export function isClipboardAPIAvailable() {
  return (
    navigator.clipboard &&
    navigator.clipboard.writeText &&
    window.isSecureContext
  );
}

// 現代剪貼簿複製功能
export async function copyTextToClipboard(text) {
  if (!isClipboardAPIAvailable()) {
    throw new Error(
      "Clipboard API 不可用。請確保網站使用 HTTPS 或在本機環境運行。"
    );
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 處理特定權限錯誤
    if (error.name === "NotAllowedError") {
      throw new Error("剪貼簿存取被拒絕。請檢查瀏覽器權限設定。");
    } else if (error.name === "NotFoundError") {
      throw new Error("剪貼簿內容無法轉換為文字格式。");
    } else {
      throw new Error(`剪貼簿操作失敗：${error.message}`);
    }
  }
}

// 測試 Favicon URL 是否有效
export async function testFaviconUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, 5000);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };

    controller.signal.addEventListener("abort", () => {
      resolve(false);
    });

    img.src = url;
  });
}

// 更新頁面 Favicon
export function updatePageFavicon(faviconUrl) {
  // 移除現有的 favicon 連結
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach((link) => link.remove());

  // 建立新的 favicon 連結
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/x-icon";
  link.href = faviconUrl;
  document.head.appendChild(link);

  // 添加時間戳版本以確保瀏覽器更新
  const linkWithTimestamp = document.createElement("link");
  linkWithTimestamp.rel = "shortcut icon";
  linkWithTimestamp.type = "image/x-icon";
  linkWithTimestamp.href =
    faviconUrl + (faviconUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
  document.head.appendChild(linkWithTimestamp);
}

// 從路徑獲取 Favicon 類型名稱
export function getFaviconTypeName(path) {
  const fileName = path.replace(/^.*\//, "");

  if (fileName.includes("apple-touch-icon")) {
    const sizeMap = {
      "180x180": "Apple Touch Icon 180x180",
      "152x152": "Apple Touch Icon 152x152",
      "144x144": "Apple Touch Icon 144x144",
      "120x120": "Apple Touch Icon 120x120",
      "114x114": "Apple Touch Icon 114x114",
      "72x72": "Apple Touch Icon 72x72",
      "57x57": "Apple Touch Icon 57x57",
    };

    for (const [size, name] of Object.entries(sizeMap)) {
      if (fileName.includes(size)) return name;
    }

    if (fileName.includes("precomposed")) return "Apple Touch Icon (預設)";
    return "Apple Touch Icon";
  }

  if (fileName.includes("favicon")) {
    const sizeMap = {
      "256x256": "Favicon 256x256",
      "192x192": "Favicon 192x192",
      "128x128": "Favicon 128x128",
      "96x96": "Favicon 96x96",
      "32x32": "Favicon 32x32",
      "16x16": "Favicon 16x16",
    };

    for (const [size, name] of Object.entries(sizeMap)) {
      if (fileName.includes(size)) return name;
    }

    if (fileName.includes(".svg")) return "SVG Favicon";
    if (fileName.includes(".png")) return "PNG Favicon";
    if (fileName.includes(".ico")) {
      const dirMap = {
        "/img/": "Favicon (img 目錄)",
        "/images/": "Favicon (images 目錄)",
        "/assets/": "Favicon (assets 目錄)",
        "/static/": "Favicon (static 目錄)",
        "/public/": "Favicon (public 目錄)",
        "/res/": "Favicon (res 目錄)",
        "/resources/": "Favicon (resources 目錄)",
      };

      for (const [dir, name] of Object.entries(dirMap)) {
        if (path.includes(dir)) return name;
      }

      return "ICO Favicon";
    }
  }

  return fileName.replace(/\.(ico|png|svg)$/, "") || "Favicon";
}

// 從路徑提取尺寸
export function getFaviconSize(path) {
  const sizeMatch = path.match(/(\d+)x(\d+)/);
  return sizeMatch ? `${sizeMatch[1]}x${sizeMatch[2]}` : "未知";
}

// 從 HTML 屬性獲取 Favicon 類型名稱
export function getHTMLFaviconTypeName(rel, sizes, type) {
  if (rel.includes("apple-touch-icon")) {
    return sizes ? `Apple Touch Icon ${sizes}` : "Apple Touch Icon";
  }

  if (rel.includes("icon")) {
    if (sizes) return `Favicon ${sizes}`;
    if (type.includes("svg")) return "SVG Favicon";
    if (type.includes("png")) return "PNG Favicon";
    return "Favicon";
  }

  return "Icon";
}

// 從類型獲取尺寸
export function getSizeFromType(type) {
  if (type.includes("svg")) return "SVG";
  return "未知";
}
