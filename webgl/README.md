
* Wind animation in WebGL: https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f

based on:

* Particle system in WebGL: https://nullprogram.com/blog/2014/06/29/


Technique:

* Fragment shader updates position and velocity data (encoded in textures)
* Quite possibly separate textures are needed for position and velocity, due to resolution constraints -- different WebGL programs will be needed to update both textures, then.
* Finally, vertex shaders use the current position texture, and an index array (as a buffer) to pull out positions -- which are represented as dots
* Framebuffer ping-pong (see index10)
