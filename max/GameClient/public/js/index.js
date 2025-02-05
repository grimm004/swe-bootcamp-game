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

    // Create an instance of your game.
    const app = new SweBootcampGame(gl);

    // Create and set up the game UI (in-canvas events, pointer lock, resize, etc).
    const gameUi = new GameUi(app, canvas, gl);
    await gameUi.setup();

    // Create and set up the menu UI (signin/signup, lobby, profile, etc).
    const menu = new Menu();
    menu.setupUI();

    // When authentication succeeds, the Menu notifies us via this callback.
    // We then hide the menu and start the game.
    menu.onAuthSuccess = async (user) => {
        if (user.roles?.includes("player")) {
            menu.hide();
            gameUi.captureEnabled = true;
        } else {
            // For non-players (admins, etc.), show an error (or handle appropriately).
            menu.showError("Access Denied: You are not authorised to view the game.");
        }
    };

    await gameUi.run();

    // Optionally, you can also wire up a game-finished callback:
    // gameUi.onGameFinish = () => { menu.show(); };
}

window.onload = main;
