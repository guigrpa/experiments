
* Wind animation in WebGL: https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f

based on:

* Particle system in WebGL: https://nullprogram.com/blog/2014/06/29/


Run the demos: `yarn start` from project root.
Run the webgl-wind demo: `yarn start` from the `webgl-wind` folder, then open `http://localhost:1337/demo/`

Technique:

* Fragment shader updates position and velocity data (encoded in textures)
* Quite possibly separate textures are needed for position and velocity, due to resolution constraints -- different WebGL programs will be needed to update both textures, then.
* Finally, vertex shaders use the current position texture, and an index array (as a buffer) to pull out positions -- which are represented as dots.
* Framebuffer ping-pong (see index10).
* Merge images (previous frame and current one) using an additional program, with configurable fade.
