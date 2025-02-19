# BP SWE Bootcamp Client Project

A basic 3D WebGL-based game to demonstrate use of algorithms, datastructures, and use of the HTML DOM and canvas.

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
- OIMO.js physics engine integration
- Animation (with fixed time-step for consistent speed)

## Setup

Due to CORS, the static resources (HTML, JavaScript and assets) need to be hosted.
The repository is currently set-up as an _npm_ project with a simple _express_ server.
To use this, open the command-line in the project root directory and run `pnpm install` then `pnpm start` (or the equivalent _npm_ / _yarn_ commands).
Navigate to the URI displayed in the console.

If using a different server (e.g. a python simple HTTP server), host the files in the _public_ folder.

## Usage

As mentioned in the features, it is possible to move the virtual camera around the world.
Use `W`/`S` to move forwards/backwards and `A`/`D` to move left/right.
Double-click the canvas and use the mouse to re-orient the camera (press escape to return the cursor).
When in focus, point and click on the physics objects to apply an impulse.

Pressing `R` will reset the camera position.
Pressing `E` will create an outward impulse on the chairs.
Pressing `I` will create an inward impulse on the chairs.
Pressing `Space` will create an upward impulse on the chairs.

Pressing the debug toggle button will display the physics debug information, as well as the bounding boxes of the objects.

## Resources

The texture images are free from online. All models are custom-made using either the scene tree or blender primitives (or defaults).

## Project File Structure

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
|  +--/oimo.module.js: OIMO.js physics engine
|  +--/signalr.module.js: SignalR client library
+--/css
|  +--/bootstrap.css: Bootstrap 4
|  +--/style.css: Custom CSS stylesheet
+--/js: Internal JavaScript resources
   +--/game: Game-specific code
   +--/graphics: Object-oriented abstraction wrapping WebGL
   +--/services: Wrappers around external services
   +--/ui: User interface components
   +--/index.js: Client application entry point
```
