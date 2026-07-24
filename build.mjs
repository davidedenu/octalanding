import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const files = [
  ["/index.html", "index.html", "text/html; charset=utf-8", "utf8"],
  ["/styles.css", "styles.css", "text/css; charset=utf-8", "utf8"],
  ["/script.js", "script.js", "application/javascript; charset=utf-8", "utf8"],
  ["/assets/domotica.jpg", "assets/domotica.jpg", "image/jpeg", "base64"],
  ["/assets/continuita.jpg", "assets/continuita.jpg", "image/jpeg", "base64"],
  ["/assets/sicurezza.jpg", "assets/sicurezza.jpg", "image/jpeg", "base64"],
  ["/assets/faviconblack.png", "assets/faviconblack.png", "image/png", "base64"],
  ["/favicon.ico", "assets/faviconblack.png", "image/png", "base64"],
  ["/assets/logo-light.png", "assets/logo-light.png", "image/png", "base64"],
  ["/assets/logo-wide.png", "assets/logo-wide.png", "image/png", "base64"],
  ["/assets/logo.png", "assets/logo.png", "image/png", "base64"]
];

const manifest = Object.fromEntries(files.map(([urlPath, filePath, type, encoding]) => {
  const content = readFileSync(filePath, encoding === "base64" ? undefined : "utf8");
  return [urlPath, {
    type,
    encoding,
    body: encoding === "base64" ? content.toString("base64") : content
  }];
}));

const server = `const files = ${JSON.stringify(manifest)};\n\nfunction decodeBase64(value) {\n  const binary = atob(value);\n  const bytes = new Uint8Array(binary.length);\n  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);\n  return bytes;\n}\n\nexport default {\n  async fetch(request) {\n    const url = new URL(request.url);\n    let path = url.pathname === "/" ? "/index.html" : url.pathname;\n    const file = files[path] || files["/index.html"];\n    const headers = new Headers({ "content-type": file.type });\n    if (file.encoding === "base64") headers.set("cache-control", "public, max-age=31536000, immutable");\n    return new Response(file.encoding === "base64" ? decodeBase64(file.body) : file.body, { headers });\n  }\n};\n`;

mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });
writeFileSync("dist/server/index.js", server);
writeFileSync("dist/.openai/hosting.json", readFileSync(".openai/hosting.json", "utf8"));
