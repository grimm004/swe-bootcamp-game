# BP SWE Bootcamp Project

A basic 3D WebGL-based game to demonstrate use of algorithms, datastructures, and use of the HTML DOM and canvas.

## Features

- WebGL 2.0
- Modular and object-oriented abstract code structure (built as a standalone library)
- Ambient, diffuse and specular (dynamically rendered) lighting
- Virtual controllable camera
- Wavefront .obj mesh parser
- Primitive meshes
- Texture mapping
- Hierarchical structure
- Multiple shaders
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

Various properties of the scene can be altered using the on-screen controls. 

Pressing `R` will reset the scene transformation and camera position.

## Resources

The texture images are free from online. All models are custom-made using either the scene tree or blender primitives (or defaults).

## Graphics File Structure

```
/public: Resources accessible by client browsers
+--/index.html: HTML file containing application
+--/assets
|  +--/images: Image resources and model textures
|  +--/meshes: Model meshes
|  +--/shaders: Vertex and fragment shader pairs
+--/lib: External JavaScript resources
|  +--/gl-matrix.js: gl-matrix maths library
+--/css
|  +--/bootstrap.css: Bootstrap 4
|  +--/style.css: Custom CSS stylesheet
+--/js: Internal JavaScript resources
   +--/index.js: Create, run and manage tha application
   +--/objects.js: Application object classes
   +--/meshes.js: Application mesh classes
   +--/graphics.js: Object-oriented abstract WebGL wrapper
   +--/math.js: Object-oriented gl-matrix wrapper, JS Math extensions and utilities
```
