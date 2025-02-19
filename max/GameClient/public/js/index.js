import { SweBootcampGame } from "./game/game.js";
import Menu from "./ui/menu.js";
import GameUi from "./ui/gameui.js";


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
    menu.setupUi();

    menu.onGameStart = async (user, lobby) => {
        menu.hide();
        await gameUi.joinGame(user, lobby);
    };

    await gameUi.run();

    // gameUi.onGameFinish = () => { menu.show(); };
}

window.onload = main;

