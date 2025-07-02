/**
 * Favicon 搜尋模組
 * 負責從各種來源搜尋 Favicon
 */

import {
  testFaviconUrl,
  getFaviconTypeName,
  getFaviconSize,
  getHTMLFaviconTypeName,
  getSizeFromType,
} from "./utils.js";

// 從常見路徑搜尋 Favicon
export async function getFaviconFromHTML(url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.origin;
    const basePath = parsedUrl.pathname.replace(/\/$/, "") || "";

    const commonPaths = [
      // 標準路徑
      "/favicon.ico",
      "/favicon.png",
      "/favicon.svg",

      // Apple touch icons
      "/apple-touch-icon.png",
      "/apple-touch-icon-precomposed.png",
      "/apple-touch-icon-120x120.png",
      "/apple-touch-icon-180x180.png",
      "/apple-touch-icon-152x152.png",
      "/apple-touch-icon-144x144.png",
      "/apple-touch-icon-114x114.png",
      "/apple-touch-icon-72x72.png",
      "/apple-touch-icon-57x57.png",

      // 標準尺寸 favicons
      "/favicon-32x32.png",
      "/favicon-16x16.png",
      "/favicon-96x96.png",
      "/favicon-128x128.png",
      "/favicon-192x192.png",
      "/favicon-256x256.png",

      // 常見目錄下的 favicon
      "/img/favicon.ico",
      "/img/favicon.png",
      "/images/favicon.ico",
      "/images/favicon.png",
      "/assets/favicon.ico",
      "/assets/favicon.png",
      "/static/favicon.ico",
      "/static/favicon.png",
      "/public/favicon.ico",
      "/public/favicon.png",
      "/res/favicon.ico",
      "/resources/favicon.ico",

      // 基於當前路徑的變體
      `${basePath}/favicon.ico`,
      `${basePath}/img/favicon.ico`,
      `${basePath}/images/favicon.ico`,
      `${basePath}/assets/favicon.ico`,
      `${basePath}/static/favicon.ico`,
    ];

    const uniquePaths = [...new Set(commonPaths)];

    const testPromises = uniquePaths.map(async (path) => {
      const faviconUrl = domain + path;
      const isValid = await testFaviconUrl(faviconUrl);

      if (isValid) {
        return {
          url: faviconUrl,
          type: getFaviconTypeName(path),
          size: getFaviconSize(path),
        };
      }
      return null;
    });

    const results = await Promise.allSettled(testPromises);
    const validFavicons = [];

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        validFavicons.push(result.value);
      }
    });

    return validFavicons;
  } catch (error) {
    console.error("Error fetching favicons:", error);
    return [];
  }
}

// 從 HTML 原始碼搜尋 Favicon
export async function getFaviconFromHTMLSource(url) {
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) continue;

      let html;
      if (proxyUrl.includes("allorigins")) {
        const data = await response.json();
        html = data.contents;
      } else {
        html = await response.text();
      }

      return await parseHTMLForFavicons(html, url);
    } catch (error) {
      console.warn(`Proxy ${proxyUrl} failed:`, error);
      continue;
    }
  }

  console.warn("所有 CORS proxy 都無法使用，跳過 HTML 解析");
  return [];
}

// 解析 HTML 尋找 Favicon 連結
async function parseHTMLForFavicons(html, url) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const faviconLinks = [];
    const parsedUrl = new URL(url);
    const baseUrl = parsedUrl.origin;

    const linkTags = doc.querySelectorAll(
      'link[rel*="icon"], link[rel*="apple-touch-icon"]'
    );

    linkTags.forEach((link) => {
      let href = link.getAttribute("href");
      if (!href) return;

      // 轉換相對路徑為絕對路徑
      if (href.startsWith("//")) {
        href = parsedUrl.protocol + href;
      } else if (href.startsWith("/")) {
        href = baseUrl + href;
      } else if (!href.startsWith("http")) {
        href = baseUrl + "/" + href;
      }

      const sizes = link.getAttribute("sizes") || "";
      const type = link.getAttribute("type") || "";
      const rel = link.getAttribute("rel") || "";

      faviconLinks.push({
        url: href,
        type: getHTMLFaviconTypeName(rel, sizes, type),
        size: sizes || getSizeFromType(type),
        source: "HTML",
      });
    });

    // 測試找到的連結是否有效
    const testPromises = faviconLinks.map(async (favicon) => {
      const isValid = await testFaviconUrl(favicon.url);
      return isValid ? favicon : null;
    });

    const results = await Promise.allSettled(testPromises);
    const validFavicons = [];

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        validFavicons.push(result.value);
      }
    });

    return validFavicons;
  } catch (error) {
    console.warn("解析 HTML 時發生錯誤:", error);
    return [];
  }
}

// 從第三方服務獲取 Favicon
export async function getFaviconFromServices(hostname) {
  const services = [
    {
      name: "Google Favicon 服務 (16px)",
      url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`,
      size: "16x16",
      service: "Google",
    },
    {
      name: "Google Favicon 服務 (32px)",
      url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      size: "32x32",
      service: "Google",
    },
    {
      name: "Google Favicon 服務 (64px)",
      url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      size: "64x64",
      service: "Google",
    },
    {
      name: "Google Favicon 服務 (128px)",
      url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      size: "128x128",
      service: "Google",
    },
    {
      name: "Favicon.io 服務",
      url: `https://favicon.io/favicon-ico/${hostname}/`,
      size: "通用",
      service: "Favicon.io",
    },
    {
      name: "DuckDuckGo 服務",
      url: `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      size: "ICO",
      service: "DuckDuckGo",
    },
    {
      name: "Yandex 服務",
      url: `https://favicon.yandex.net/favicon/${hostname}`,
      size: "通用",
      service: "Yandex",
    },
  ];

  const servicePromises = services.map(async (service) => {
    const isValid = await testFaviconUrl(service.url);
    return isValid ? { ...service, type: service.name } : null;
  });

  const results = await Promise.allSettled(servicePromises);
  const validFavicons = [];

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value) {
      validFavicons.push(result.value);
    }
  });

  return validFavicons;
}
