import express from "express";
import proxy from "express-http-proxy";
import httpProxy from "http-proxy";

const app = express();
const port = 25565;
const proxyTarget = "http://localhost:5197";

app.use(express.static("public"));

app.use("/api", proxy(proxyTarget, {
    proxyReqPathResolver: req => `/api${req.url}`,
}));

app.use("/hubs", proxy(proxyTarget, {
    proxyReqPathResolver: req => `/hubs${req.url}`,
}));

const wsProxy = httpProxy.createProxyServer({
    target: proxyTarget,
    ws: true,
});

const server = app.listen(port, () =>
    console.log(`Server listening on port ${port}: http://localhost:${port}.`)
);

server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/hubs")) {
        wsProxy.ws(req, socket, head);
    } else {
        socket.destroy();
    }
});