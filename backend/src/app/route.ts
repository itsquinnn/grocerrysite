import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const accept = request.headers.get("accept") || "";

  if (accept.includes("text/html")) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOVAN API Server</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 32px;
      max-width: 560px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(46, 160, 67, 0.15);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.4);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .badge::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3fb950;
      display: inline-block;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 10px;
      color: #f0f6fc;
    }
    p {
      color: #8b949e;
      line-height: 1.6;
      margin: 0 0 24px;
      font-size: 14px;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      background: #238636;
      color: #fff;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.15s;
    }
    .btn:hover { background: #2ea043; }
    .endpoints {
      border-top: 1px solid #30363d;
      padding-top: 20px;
    }
    .endpoints h2 {
      font-size: 12px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin: 0 0 12px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    li a {
      color: #58a6ff;
      text-decoration: none;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      display: inline-block;
      padding: 4px 6px;
      border-radius: 4px;
      background: rgba(110, 118, 129, 0.1);
    }
    li a:hover {
      background: rgba(110, 118, 129, 0.2);
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Backend API Online</div>
    <h1>DOVAN API Server (Port 3002)</h1>
    <p>
      This is the DOVAN backend service. It provides REST API endpoints under <code>/api/*</code>.
      If you are looking for the store website interface, visit the frontend server on port 8080.
    </p>
    <div class="actions">
      <a href="http://localhost:8080" class="btn">Open Storefront (Port 8080) &rarr;</a>
    </div>
    <div class="endpoints">
      <h2>Sample API Endpoints</h2>
      <ul>
        <li><a href="/api/categories">/api/categories</a></li>
        <li><a href="/api/products">/api/products</a></li>
        <li><a href="/api/home-deals">/api/home-deals</a></li>
        <li><a href="/api/promotions">/api/promotions</a></li>
      </ul>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({
    service: "DOVAN Backend API",
    status: "healthy",
    port: 3002,
    storefront: "http://localhost:8080",
    endpoints: [
      "/api/categories",
      "/api/products",
      "/api/home-deals",
      "/api/promotions",
      "/api/orders",
      "/api/cart",
    ],
  });
}

