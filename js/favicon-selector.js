/**
 * Favicon 選擇模組
 * 負責從多個 Favicon 中選擇最佳的一個
 */

// 選擇最佳的 Favicon
export function selectBestFavicon(favicons) {
  if (favicons.length === 0) return null;

  // 按來源分組
  const htmlFavicons = favicons.filter((f) => f.source === "HTML");
  const directFavicons = favicons.filter(
    (f) => !f.service && f.source !== "HTML"
  );
  const serviceFavicons = favicons.filter((f) => f.service);

  // 1. 優先選擇 HTML 原始碼的 favicon
  if (htmlFavicons.length > 0) {
    return selectBestFromGroup(htmlFavicons);
  }

  // 2. 其次選擇路徑猜測的 favicon
  if (directFavicons.length > 0) {
    return selectBestFromGroup(directFavicons);
  }

  // 3. 最後選擇第三方服務的 favicon（優先 Google 32px）
  if (serviceFavicons.length > 0) {
    return selectBestFromServices(serviceFavicons);
  }

  return null;
}

// 從同組中選擇最佳的 Favicon
function selectBestFromGroup(group) {
  if (group.length === 1) return group[0];

  const scored = group.map((favicon) => ({
    favicon,
    score: calculateFaviconScore(favicon),
  }));

  // 返回分數最高的
  scored.sort((a, b) => b.score - a.score);
  return scored[0].favicon;
}

// 從服務組中選擇最佳的 Favicon
function selectBestFromServices(serviceFavicons) {
  // 優先選擇 Google 32px 的版本
  const google32 = serviceFavicons.find(
    (f) => f.service === "Google" && f.size === "32x32"
  );
  if (google32) return google32;

  // 其次選擇 Google 其他尺寸
  const googleFavicon = serviceFavicons.find((f) => f.service === "Google");
  if (googleFavicon) return googleFavicon;

  // 最後選擇其他服務
  return serviceFavicons[0];
}

// 計算 Favicon 品質分數
function calculateFaviconScore(favicon) {
  let score = 0;

  // 檔案類型分數
  const typeScores = { png: 100, svg: 90, ico: 80 };
  const ext = favicon.url.split(".").pop()?.toLowerCase();
  score += typeScores[ext] || 0;

  // 尺寸分數
  score += calculateSizeScore(favicon.size);

  // Apple Touch Icon 加分（通常品質較好）
  if (favicon.type.includes("Apple Touch Icon")) {
    score += 50;
  }

  return score;
}

// 計算尺寸分數
function calculateSizeScore(size) {
  if (!size || size === "未知") return 0;
  if (size === "SVG") return 1000; // SVG 可縮放，最佳

  const match = size.match(/(\d+)x(\d+)/);
  if (match) {
    const pixels = parseInt(match[1]) * parseInt(match[2]);
    return pixels; // 解析度越高分數越高
  }

  return 0;
}

// 獲取 Favicon 來源描述
export function getFaviconSource(favicon) {
  if (favicon.source === "HTML") return "HTML 原始碼";
  if (favicon.service) return `${favicon.service} 服務`;
  return "路徑猜測";
}
