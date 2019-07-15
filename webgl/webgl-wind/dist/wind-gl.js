(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.WindGL = factory());
}(this, (function () { 'use strict';

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);

  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

// Create WebGL program and return a wrapper containing the program,
// as well as the locations for all attributes and uniforms
function createProgram(gl, vertexSource, fragmentSource) {
  var program = gl.createProgram();

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  var wrapper = { program: program };

  // Add attribute locations to the wrapper
  var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (var i = 0; i < numAttributes; i++) {
    var attribute = gl.getActiveAttrib(program, i);
    wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
  }

  // Add uniform locations to the wrapper
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (var i$1 = 0; i$1 < numUniforms; i$1++) {
    var uniform = gl.getActiveUniform(program, i$1);
    wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
  }

  return wrapper;
}

function createTexture(gl, filter, data, width, height) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  if (data instanceof Uint8Array) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }
  gl.bindTexture(gl.TEXTURE_2D, null); // for safety
  return texture;
}

function bindTexture(gl, texture, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

function createBuffer(gl, data) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function bindAttribute(gl, buffer, attribute, numComponents) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
}

function bindFramebuffer(gl, framebuffer, texture) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  if (texture) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
  }
}

var drawVert = "// Particle index --> particle position\n\nprecision mediump float;\n\nattribute float a_index;\n\nuniform sampler2D u_particles;\nuniform float u_particles_res;\n\nvarying vec2 v_particle_pos;\n\nvoid main() {\n    vec4 color = texture2D(u_particles, vec2(\n        fract(a_index / u_particles_res),\n        floor(a_index / u_particles_res) / u_particles_res));\n\n    // decode current particle position from the pixel's RGBA value\n    v_particle_pos = vec2(\n        color.g / 255.0 + color.r,\n        color.a / 255.0 + color.b);\n\n    gl_PointSize = 1.0;\n    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);\n}\n";

var drawFrag = "// Particle position -> color (based on wind velocity at that position)\n\nprecision mediump float;\n\nuniform sampler2D u_wind;\nuniform vec2 u_wind_min;\nuniform vec2 u_wind_max;\nuniform sampler2D u_color_ramp;\n\nvarying vec2 v_particle_pos;\n\nvoid main() {\n    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, v_particle_pos).rg);\n    float speed_t = length(velocity) / length(u_wind_max);\n\n    // color ramp is encoded in a 16x16 texture\n    vec2 ramp_pos = vec2(\n        fract(16.0 * speed_t),\n        floor(16.0 * speed_t) / 16.0);\n\n    gl_FragColor = texture2D(u_color_ramp, ramp_pos);\n}\n";

var quadVert = "precision mediump float;\n\nattribute vec2 a_pos;\n\nvarying vec2 v_tex_pos;\n\nvoid main() {\n    v_tex_pos = a_pos;\n    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n}\n";

var screenFrag = "precision mediump float;\n\nuniform sampler2D u_screen;\nuniform float u_opacity;\n\nvarying vec2 v_tex_pos;\n\nvoid main() {\n    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);\n    // a hack to guarantee opacity fade out even with a value close to 1.0\n    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n}\n";

var updateFrag = "// Current particle positions -> next particle positions\n\nprecision highp float;\n\nuniform sampler2D u_particles;\nuniform sampler2D u_wind;\nuniform vec2 u_wind_res;\nuniform vec2 u_wind_min;\nuniform vec2 u_wind_max;\nuniform float u_rand_seed;\nuniform float u_speed_factor;\nuniform float u_drop_rate;\nuniform float u_drop_rate_bump;\n\nvarying vec2 v_tex_pos;\n\n// pseudo-random generator\nconst vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\nfloat rand(const vec2 co) {\n    float t = dot(rand_constants.xy, co);\n    return fract(sin(t) * (rand_constants.z + t));\n}\n\n// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation\nvec2 lookup_wind(const vec2 uv) {\n    // return texture2D(u_wind, uv).rg; // lower-res hardware filtering\n    vec2 px = 1.0 / u_wind_res;\n    vec2 vc = (floor(uv * u_wind_res)) * px;\n    vec2 f = fract(uv * u_wind_res);\n    vec2 tl = texture2D(u_wind, vc).rg;\n    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;\n    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;\n    vec2 br = texture2D(u_wind, vc + px).rg;\n    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n}\n\nconst vec2 bitEnc = vec2(1.,255.);\nconst vec2 bitDec = 1./bitEnc;\n\n// decode particle position from pixel RGBA\nvec2 fromRGBA(const vec4 color) {\n  vec4 rounded_color = floor(color * 255.0 + 0.5) / 255.0;\n  float x = dot(rounded_color.rg, bitDec);\n  float y = dot(rounded_color.ba, bitDec);\n  return vec2(x, y);\n}\n\n// encode particle position to pixel RGBA\nvec4 toRGBA(const vec2 pos) {\n  vec2 rg = bitEnc * pos.x;\n  rg = fract(rg);\n  rg -= rg.yy * vec2(1. / 255., 0.);\n\n  vec2 ba = bitEnc * pos.y;\n  ba = fract(ba);\n  ba -= ba.yy * vec2(1. / 255., 0.);\n\n  return vec4(rg, ba);\n}\n\nvoid main() {\n    vec4 color = texture2D(u_particles, v_tex_pos);\n    // vec2 pos = vec2(\n    //     color.r / 255.0 + color.b,\n    //     color.g / 255.0 + color.a); // decode particle position from pixel RGBA\n    vec2 pos = fromRGBA(color);\n\n    vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(pos));\n    float speed_t = length(velocity) / length(u_wind_max);\n\n    // take EPSG:4236 distortion into account for calculating where the particle moved\n    float distortion = cos(radians(pos.y * 180.0 - 90.0));\n    vec2 offset = vec2(velocity.x / distortion, -velocity.y) * 0.0001 * u_speed_factor;\n\n    // update particle position, wrapping around the date line\n    pos = fract(1.0 + pos + offset);\n\n    // a random seed to use for the particle drop\n    vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\n    // drop rate is a chance a particle will restart at random position, to avoid degeneration\n    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n    float drop = step(1.0 - drop_rate, rand(seed));\n\n    vec2 random_pos = vec2(\n        rand(seed + 1.3),\n        rand(seed + 2.1));\n    pos = mix(pos, random_pos, drop);\n\n    // encode the new particle position back into RGBA\n    // gl_FragColor = vec4(\n    //     fract(pos * 255.0),\n    //     floor(pos * 255.0) / 255.0);\n    gl_FragColor = toRGBA(pos);\n}\n";

var defaultRampColors = {
  0.0: '#3288bd',
  0.1: '#66c2a5',
  0.2: '#abdda4',
  0.3: '#e6f598',
  0.4: '#fee08b',
  0.5: '#fdae61',
  0.6: '#f46d43',
  1.0: '#d53e4f',
};

var WindGL = function WindGL(gl) {
  this.gl = gl;

  this.fadeOpacity = 0.996; // how fast the particle trails fade on each frame
  this.speedFactor = 0.25; // how fast the particles move
  this.dropRate = 0.003; // how often the particles move to a random place
  this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed

  // Screen program: input texture --> output texture (with some fading)
  this.screenProgram = createProgram(gl, quadVert, screenFrag);
  // Draw program: particle index, wind data --> current particle position and color
  this.drawProgram = createProgram(gl, drawVert, drawFrag);
  // Update program: current particle positions --> next particle positions
  this.updateProgram = createProgram(gl, quadVert, updateFrag);

  this.quadBuffer = createBuffer(
    gl,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
  );
  this.framebuffer = gl.createFramebuffer();

  this.setColorRamp(defaultRampColors);
  this.resize();
};

var prototypeAccessors = { numParticles: {} };

WindGL.prototype.resize = function resize () {
  var ref = this;
    var gl = ref.gl;
  var emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);

  // Screen textures to hold the drawn screen for the previous and the current frame
  this.prevScreenTexture = createTexture(
    gl,
    gl.NEAREST,
    emptyPixels,
    gl.canvas.width,
    gl.canvas.height
  );
  this.screenTexture = createTexture(
    gl,
    gl.NEAREST,
    emptyPixels,
    gl.canvas.width,
    gl.canvas.height
  );
};

WindGL.prototype.setColorRamp = function setColorRamp (colors) {
  var ref = this;
    var gl = ref.gl;
  // lookup texture for colorizing the particles according to their speed
  this.colorRampTexture = createTexture(
    gl,
    gl.LINEAR,
    getColorRamp(colors),
    16,
    16
  );
};

// Can be called at any time by dat.gui -- in that case, we reset the state
prototypeAccessors.numParticles.set = function (numParticles) {
  var ref = this;
    var gl = ref.gl;

  // Calculate the size of a square that has at least numParticles pixels
  var particleRes = Math.ceil(Math.sqrt(numParticles));
  this.particleStateResolution = particleRes;
  this._numParticles = particleRes * particleRes;

  // Create a square texture where each pixel holds the current particle position encoded as RGBA
  // Initialise positions randomly
  var particleState = new Uint8Array(this._numParticles * 4);
  for (var i = 0; i < particleState.length; i++) {
    particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
  }

  // Load position data into two textures (current and next frame)
  this.prevParticleStateTexture = createTexture(
    gl,
    gl.NEAREST,
    particleState,
    particleRes,
    particleRes
  );
  this.particleStateTexture = createTexture(
    gl,
    gl.NEAREST,
    particleState,
    particleRes,
    particleRes
  );

  // Create particle index buffer
  var particleIndices = new Float32Array(this._numParticles);
  for (var i$1 = 0; i$1 < this._numParticles; i$1++) { particleIndices[i$1] = i$1; }
  this.particleIndexBuffer = createBuffer(gl, particleIndices);
};

prototypeAccessors.numParticles.get = function () {
  return this._numParticles;
};

WindGL.prototype.setWind = function setWind (windData) {
  this.windData = windData;
  var ref = this;
    var gl = ref.gl;
  this.windTexture = createTexture(gl, gl.LINEAR, windData.image);
};

// ====================================
// Render
// ====================================
WindGL.prototype.draw = function draw () {
  var ref = this;
    var gl = ref.gl;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);

  bindTexture(gl, this.windTexture, 0);
  bindTexture(gl, this.prevParticleStateTexture, 1);

  this.drawScreen();
  this.updateParticles();
};

WindGL.prototype.drawScreen = function drawScreen () {
  var ref = this;
    var gl = ref.gl;

  // Configure GPU output to a framebuffer, where previous screen and
  // new particle positions are merged. Then draw:
  // - The previous texture (faded out a bit)
  // - The current particles
  bindFramebuffer(gl, this.framebuffer, this.screenTexture);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  this.drawTexture(this.prevScreenTexture, this.fadeOpacity);
  this.drawParticles();

  // Configure GPU output to the screen, and copy the current texture
  // (gl.BLEND is enabled to support drawing on top of an existing background (e.g. a map) --
  // this might not be needed)
  bindFramebuffer(gl, null);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  this.drawTexture(this.screenTexture, 1.0);
  gl.disable(gl.BLEND);

  // Swap previous and current textures, preparing for the next iteration
  var ref$1 = this;
    var prevScreenTexture = ref$1.prevScreenTexture;
  this.prevScreenTexture = this.screenTexture;
  this.screenTexture = prevScreenTexture;
};

// Copy an input texture to an output texture, with some fading
WindGL.prototype.drawTexture = function drawTexture (texture, opacity) {
  var ref = this;
    var gl = ref.gl;
  var program = this.screenProgram;
  gl.useProgram(program.program);

  bindAttribute(gl, this.quadBuffer, program.a_pos, 2);
  bindTexture(gl, texture, 2);
  gl.uniform1i(program.u_screen, 2);
  gl.uniform1f(program.u_opacity, opacity);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

// Draw the current particle positions
WindGL.prototype.drawParticles = function drawParticles () {
  var ref = this;
    var gl = ref.gl;
  var program = this.drawProgram;
  gl.useProgram(program.program);

  bindAttribute(gl, this.particleIndexBuffer, program.a_index, 1);
  bindTexture(gl, this.colorRampTexture, 2);

  gl.uniform1i(program.u_wind, 0);
  gl.uniform1i(program.u_particles, 1);
  gl.uniform1i(program.u_color_ramp, 2);

  gl.uniform1f(program.u_particles_res, this.particleStateResolution);
  gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
  gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);

  gl.drawArrays(gl.POINTS, 0, this._numParticles);
};

// Use the GPU to update particle state
WindGL.prototype.updateParticles = function updateParticles () {
  var ref = this;
    var gl = ref.gl;
  bindFramebuffer(gl, this.framebuffer, this.particleStateTexture);
  gl.viewport(
    0,
    0,
    this.particleStateResolution,
    this.particleStateResolution
  );

  var program = this.updateProgram;
  gl.useProgram(program.program);

  bindAttribute(gl, this.quadBuffer, program.a_pos, 2);

  gl.uniform1i(program.u_wind, 0);
  gl.uniform1i(program.u_particles, 1);

  gl.uniform1f(program.u_rand_seed, Math.random());
  gl.uniform2f(program.u_wind_res, this.windData.width, this.windData.height);
  gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
  gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);
  gl.uniform1f(program.u_speed_factor, this.speedFactor);
  gl.uniform1f(program.u_drop_rate, this.dropRate);
  gl.uniform1f(program.u_drop_rate_bump, this.dropRateBump);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // swap the particle state textures so the new one becomes the current one
  var ref$1 = this;
    var prevParticleStateTexture = ref$1.prevParticleStateTexture;
  this.prevParticleStateTexture = this.particleStateTexture;
  this.particleStateTexture = prevParticleStateTexture;
};

Object.defineProperties( WindGL.prototype, prototypeAccessors );

function getColorRamp(colors) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 1;

  var gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (var stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
}

return WindGL;

})));
