import express from "express";
import proxy from "express-http-proxy";

const app = express();
const port = 25565;
const proxyTarget = "http://localhost:5197";

app.use(express.static("public"));
app.use("/api", proxy(proxyTarget, {
    proxyReqPathResolver: (req) => "/api" + req.url,
}));
app.listen(port, () => console.log(`Server listening on port ${port}: http://localhost:${port}.`));
