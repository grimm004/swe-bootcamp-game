import {SweBootcampGame} from "./game/game.js";
import Menu from "./ui/menu.js";
import GameUi from "./ui/gameui.js";


/**
 * Main entry point for the application.
 * @returns {Promise<void>}
 */
async function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.warn("WebGL2 context could not be initialised.");
        return;
    }

    const gameHubUrl = "/hubs/v1/game";
    const lobbyHubUrl = "/hubs/v1/lobby";

    const app = new SweBootcampGame(gl, gameHubUrl)
    await app.initialise();

    const gameUi = await new GameUi(app, canvas)
        .setup();

    const menu = new Menu(lobbyHubUrl)
        .setup();

    menu.onGameStart = async (user, lobby) => {
        menu.hide();

        if (lobby)
            await gameUi.joinGame(user, lobby);
        else
            await gameUi.startGame();
    };

    // gameUi.onGameFinish = () => { menu.show(); };
    app.run();
}

window.onload = main;

