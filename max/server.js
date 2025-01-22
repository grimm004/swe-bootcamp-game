import express from "express";

const app = express();
const port = 25565;

app.use(express.static("public"));
app.listen(port, () => console.log(`Server listening on port ${port}: http://localhost:${port}.`));
