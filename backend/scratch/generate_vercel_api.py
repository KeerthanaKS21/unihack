import json

with open(r'D:\UniHack\website\server\data\products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Reset GB-100 initial baseline if needed or keep current
products_json_str = json.dumps(products, indent=2)

ts_content = f'''import type {{ IncomingMessage, ServerResponse }} from "http";
import fs from "fs";
import path from "path";

// Canonical specification aliases map
const SPEC_ALIAS_MAP: Record<string, string[]> = {{
  ratio: ["Gear Ratio", "Ratio"],
  gearratio: ["Gear Ratio", "Ratio"],
  power: ["Input Power", "Power", "Rated Power"],
  inputpower: ["Input Power", "Power"],
  speed: ["Input Speed", "Speed", "Rated Speed"],
  inputspeed: ["Input Speed", "Speed"],
  outputspeed: ["Output Speed", "Output RPM"],
  torque: ["Output Torque", "Torque", "Rated Torque"],
  outputtorque: ["Output Torque", "Torque"],
  efficiency: ["Efficiency", "Full Load Efficiency"],
  mounting: ["Mounting", "Mount"],
  mount: ["Mounting", "Mount"],
  housingmaterial: ["Housing Material", "Material", "Housing / Material"],
  material: ["Housing Material", "Material", "Housing / Material"],
  lubrication: ["Lubrication", "Lubricant"],
  lubricant: ["Lubrication", "Lubricant"],
  voltage: ["Input Voltage", "Voltage", "Rated Voltage"],
  inputvoltage: ["Input Voltage", "Voltage"],
  current: ["Current", "Rated Current"],
  iprating: ["IP Rating", "Protection Rating"],
  weight: ["Weight", "Gross Weight"]
}};

// Seed product dataset
const SEED_PRODUCTS: any[] = {products_json_str};

// Global in-memory storage across warm serverless invocations
declare global {{
  var __INDUCORE_PRODUCTS: any[] | undefined;
  var __INDUCORE_UPDATES: Record<string, any> | undefined;
  var __INDUCORE_AUDITS: any[] | undefined;
}}

const TMP_DB_PATH = "/tmp/inducore_products.json";

function getProducts(): any[] {{
  if (globalThis.__INDUCORE_PRODUCTS && Array.isArray(globalThis.__INDUCORE_PRODUCTS)) {{
    return globalThis.__INDUCORE_PRODUCTS;
  }}
  try {{
    if (fs.existsSync(TMP_DB_PATH)) {{
      const data = JSON.parse(fs.readFileSync(TMP_DB_PATH, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {{
        globalThis.__INDUCORE_PRODUCTS = data;
        return data;
      }}
    }}
  }} catch (e) {{
    console.warn("Could not read from /tmp:", e);
  }}
  globalThis.__INDUCORE_PRODUCTS = JSON.parse(JSON.stringify(SEED_PRODUCTS));
  return globalThis.__INDUCORE_PRODUCTS;
}}

function saveProducts(products: any[]) {{
  globalThis.__INDUCORE_PRODUCTS = products;
  try {{
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(products, null, 2), "utf-8");
  }} catch (e) {{
    console.warn("Could not write to /tmp:", e);
  }}
}}

// Helper to parse JSON body
function parseBody(req: IncomingMessage): Promise<any> {{
  return new Promise((resolve) => {{
    if ((req as any).body && typeof (req as any).body === "object") {{
      return resolve((req as any).body);
    }}
    let body = "";
    req.on("data", (chunk) => {{
      body += chunk.toString();
    }});
    req.on("end", () => {{
      try {{
        resolve(body ? JSON.parse(body) : {{}});
      }} catch (e) {{
        resolve({{}});
      }}
    }});
    req.on("error", () => resolve({{}}));
  }});
}}

export default async function handler(req: any, res: any) {{
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Pragma, Cache-Control");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (req.method === "OPTIONS") {{
    res.statusCode = 200;
    res.end();
    return;
  }}

  const url = req.url || "/";
  const pathname = url.split("?")[0].replace(/^\\/api/, "").replace(/^\\//, "");

  // 1. Health Check: GET /api/integration/health
  if (pathname === "integration/health" || pathname === "health") {{
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(JSON.stringify({{
      status: "ok",
      service: "InduCore E-commerce API",
      version: "2.0",
      totalProducts: getProducts().length
    }}));
    return;
  }}

  // 2. Product Update: POST /api/integration/product-update
  if ((pathname === "integration/product-update" || pathname === "product-update") && req.method === "POST") {{
    try {{
      const payload = await parseBody(req);
      const {{
        requestId,
        productId,
        modelNumber,
        expectedVersion,
        newVersion,
        updates,
        source,
        approval
      }} = payload;

      if (!requestId) {{
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({{ success: false, message: "Missing required field: requestId" }}));
        return;
      }}

      if (!approval || approval.approved !== true) {{
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({{ success: false, message: "Human approval is required before updating." }}));
        return;
      }}

      const products = getProducts();
      const targetId = (productId || "").toUpperCase();
      const targetModel = (modelNumber || "").toUpperCase();

      let matchedProduct = products.find(
        (p) => p.id.toUpperCase() === targetId || p.model.toUpperCase() === targetId || (targetModel && p.model.toUpperCase() === targetModel)
      );

      if (!matchedProduct) {{
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({{ success: false, message: `Product ${{productId}} not found` }}));
        return;
      }}

      const currentVersion = matchedProduct.version || 1;
      if (expectedVersion !== undefined && expectedVersion !== currentVersion) {{
        res.statusCode = 409;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({{
          success: false,
          status: "version_conflict",
          message: `Version conflict: expected ${{expectedVersion}}, got ${{currentVersion}}`,
          currentVersion
        }}));
        return;
      }}

      const updatedProduct = {{ ...matchedProduct }};
      if (!updatedProduct.specifications) {{
        updatedProduct.specifications = {{}};
      }}

      const changes: Record<string, any> = {{}};
      const changedFields: string[] = [];

      if (updates && typeof updates === "object") {{
        for (const [key, value] of Object.entries(updates)) {{
          if (value === undefined || value === null) continue;
          const strValue = String(value);

          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          const aliases = SPEC_ALIAS_MAP[cleanKey] || [key.charAt(0).toUpperCase() + key.slice(1)];

          let found = false;
          for (const sk of Object.keys(updatedProduct.specifications)) {{
            const cleanSk = sk.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cleanSk === cleanKey || aliases.some((a) => a.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanSk)) {{
              changes[sk] = {{ old: updatedProduct.specifications[sk], new: strValue }};
              updatedProduct.specifications[sk] = strValue;
              found = true;
            }}
          }}

          if (!found) {{
            const primaryKey = aliases[0];
            changes[primaryKey] = {{ old: null, new: strValue }};
            updatedProduct.specifications[primaryKey] = strValue;
          }}

          changedFields.push(key);
        }}
      }}

      const targetNewVersion = newVersion || currentVersion + 1;
      updatedProduct.version = targetNewVersion;
      updatedProduct.lastUpdated = new Date().toLocaleDateString("en-GB", {{ day: "numeric", month: "short", year: "numeric" }});

      const updatedList = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      saveProducts(updatedList);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({{
        success: true,
        status: "updated",
        message: `Product ${{updatedProduct.id}} specifications updated successfully.`,
        requestId,
        productId: updatedProduct.id,
        modelNumber: updatedProduct.model,
        previousVersion: currentVersion,
        newVersion: targetNewVersion,
        changedFields,
        updatedProduct
      }}));
      return;
    }} catch (err: any) {{
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({{ success: false, message: err.message || "Internal server error" }}));
      return;
    }}
  }}

  // 3. Single Product: GET /api/products/:id or GET /api/storefront/:id
  const productMatch = pathname.match(/^(?:products|storefront|ecommerce\\/storefront)\\/([^\\/]+)$/);
  if (productMatch) {{
    const targetId = productMatch[1].toUpperCase();
    const products = getProducts();
    const product = products.find((p) => p.id.toUpperCase() === targetId || p.model.toUpperCase() === targetId);
    if (!product) {{
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({{ success: false, message: `Product ${{targetId}} not found` }}));
      return;
    }}
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(product));
    return;
  }}

  // 4. Products List: GET /api/products
  if (pathname === "products" || pathname === "") {{
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(getProducts()));
    return;
  }}

  // 404 fallback
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({{ success: false, message: `Endpoint not found: ${{url}}` }}));
}}
'''

with open(r'D:\UniHack\website\api\index.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Successfully generated D:\\UniHack\\website\\api\\index.ts")
