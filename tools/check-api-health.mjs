import http from "node:http";

const url = "http://localhost:3001/health";

http.get(url, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    console.log("[OK] API responded:", res.statusCode);
    console.log(data);
  });
}).on("error", (err) => {
  console.error("[FAIL] API not reachable on localhost:3001");
  console.error(err.message);
  process.exit(1);
});
