export interface ShopifyProduct {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() || "";
}

function parseCSV(text: string): ShopifyProduct[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const titleIdx = headers.findIndex((h) => h === "Title");
  const bodyIdx = headers.findIndex((h) => h === "Body (HTML)");
  const priceIdx = headers.findIndex((h) => h === "Variant Price");
  const imgIdx = headers.findIndex((h) => h === "Image Src");

  if (titleIdx === -1) return [];

  const products: ShopifyProduct[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const title = cols[titleIdx]?.trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);

    products.push({
      title,
      description: bodyIdx !== -1 ? stripHtml(cols[bodyIdx] || "") : "",
      price: priceIdx !== -1 ? cols[priceIdx]?.trim() || "0" : "0",
      imageUrl: imgIdx !== -1 ? cols[imgIdx]?.trim() || "" : "",
    });
  }

  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseJSON(text: string): ShopifyProduct[] {
  try {
    const data = JSON.parse(text);
    const items = data.products || (Array.isArray(data) ? data : [data]);

    return items.map((item: any) => ({
      title: item.title || item.Title || "",
      description: stripHtml(item.body_html || item["Body (HTML)"] || ""),
      price:
        item.variants?.[0]?.price ||
        item["Variant Price"] ||
        item.price ||
        "0",
      imageUrl:
        item.images?.[0]?.src ||
        item["Image Src"] ||
        item.image?.src ||
        "",
    }));
  } catch {
    return [];
  }
}

export function parseShopifyFile(
  content: string,
  filename: string
): ShopifyProduct[] {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "json") return parseJSON(content);
  return parseCSV(content);
}
