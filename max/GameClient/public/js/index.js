import { SweBootcampGame } from "./game.js";
import Menu from "./menu.js";
import GameUi from "./gameui.js";

async function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.warn("WebGL2 context could not be initialised.");
        return;
    }

    const app = new SweBootcampGame(gl);

    const gameUi = new GameUi(app, canvas, gl);
    await gameUi.setup();

    const menu = new Menu();
    menu.setupUI();

    menu.onGameStart = async () => {
        menu.hide();
        gameUi.captureEnabled = true;
    };

    await gameUi.run();

    // Optionally, you can also wire up a game-finished callback:
    // gameUi.onGameFinish = () => { menu.show(); };
}

window.onload = main;

