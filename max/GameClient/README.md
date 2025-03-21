# BP SWE Bootcamp Client Project

A basic 3D WebGL-based game to demonstrate use of algorithms, datastructures, ECS architecture, and use of CSS, the HTML
DOM, canvas, both HTTP and real-time over-network communication.

## Features

- WebGL 2.0
- Modular and object-oriented abstract code structure (built as a standalone library)
- Ambient, diffuse and specular (dynamically rendered) lighting
- Virtual controllable camera
- Wavefront .obj mesh parser
- Primitive meshes
- Texture mapping
- Hierarchical scene node structure
- Multiple shaders
- Entity-Component-System (ECS) architecture
- UI for persisted sessions, including sign-up, login, and lobby management
- Networked multiplayer using SignalR
- OIMO.js physics engine integration
- Animation (with fixed time-step for consistent speed)
- Cookie-based session management with automatic attempted re-login
- User input handling
- Debug information display
- Physics and network updates independent of frame rate
- Host client is authoritative for physics and network updates

## Setup

Due to CORS, the static resources (HTML, JavaScript and assets) need to be hosted.

When running the application with the ASP.NET backend, the static resources here are copied to and served from the
_wwwroot_ folder in the GameServer.Api project.

For development convenience, the GameClient section of the repository is currently set-up as an _npm_ project with a
simple _express_ server.
To use this, open the command-line in the project root directory and run `pnpm install` then `pnpm start` (or the
equivalent _npm_ / _yarn_ commands).
Navigate to the URI displayed in the console.
The node server will attempt to proxy requests to the GameServer API so they can be independently used.

If using a different development or hosting server, host the files in the _public_ folder.

Note: When hosted using HTTP (and accessed through non-localhost), the browser does not provide accumulated mouse
movement data, meaning the camera may not respond to mouse movement.

## Usage

On load, a UI menu is shown to either sign-up, login, or start a single-player session.
For single-player, the menu will be hidden and the game will start.

For multiplayer, the user can sign up, there are currently minimal restrictions on the username, display name, and
password.
After sign-up, the user can log in with the same credentials, this will start a session that will be resumed on refresh.
Each session is valid for one hour before the user needs to sign in again.

Once logged in, the user can create a new lobby or join an existing one using a lobby code.
The host is able to remove players from the lobby, and the game will start when the host clicks the start button.

As mentioned in the features, it is possible to move the virtual camera around the world.
Once in game, mouse capture will be enabled, double-click to enable user input.

Use `W`/`S` to move forwards/backwards and `A`/`D` to move left/right.
Double-click the canvas and use the mouse to re-orient the camera (press escape to return the cursor).
When in focus, point and click on the physics objects to apply an impulse.

Pressing `R` will reset the camera position.
Pressing `E` will create an outward impulse on the physics entities.
Pressing `I` will create an inward impulse on the physics entities.
Pressing `Space` will create an upward impulse on the physics entities.

Pressing the debug toggle button will display the player position / physics / network debug information, as well as the
bounding boxes of the objects and camera ray-casted hit point.

## Resources

The texture images and wavefront models are free from online.
Other models are custom-made using either the scene tree or blender primitives.

## Project File Structure

Within the code, jsdoc comments are used to explain some of the main top-level classes and methods/functions.
They are otherwise provided without description in places to improve type hinting in IDEs.

```
/public: Resources accessible by client browsers
+--/index.html: HTML file containing application
+--/assets
|  +--/images: Image resources and model textures
|  +--/meshes: Model meshes
|  +--/shaders: Vertex and fragment shader pairs
+--/lib: External JavaScript resources
|  +--/gl-matrix: gl-matrix maths library
|  +--/ape-ecs.module.js: APE ECS library
|  +--/oimo-physics.module.js: OIMO.js physics engine library
|  +--/signalr.module.js: Microsoft SignalR client library
+--/css
|  +--/bootstrap.css: Bootstrap 4
|  +--/style.css: Custom CSS stylesheet for the application
+--/js: Client-side application JavaScript code
   +--/game: Game-specific code, including ECS components and systems
   +--/graphics: Object-oriented 3D graphics rendering abstraction wrapping the WebGL2 canvas context
   +--/models: Front end UI data models
   +--/services: Wrappers for making GameServer HTTP API calls
   +--/ui: User interface components
   +--/index.js: Client application entry point
```
