import * as util from './util';

import drawVert from './shaders/draw.vert.glsl';
import drawFrag from './shaders/draw.frag.glsl';

import quadVert from './shaders/quad.vert.glsl';

import screenFrag from './shaders/screen.frag.glsl';
import updateFrag from './shaders/update.frag.glsl';

const defaultRampColors = {
  0.0: '#3288bd',
  0.1: '#66c2a5',
  0.2: '#abdda4',
  0.3: '#e6f598',
  0.4: '#fee08b',
  0.5: '#fdae61',
  0.6: '#f46d43',
  1.0: '#d53e4f',
};

export default class WindGL {
  // ====================================
  // Config
  // ====================================
  constructor(gl) {
    this.gl = gl;

    this.fadeOpacity = 0.996; // how fast the particle trails fade on each frame
    this.speedFactor = 0.25; // how fast the particles move
    this.dropRate = 0.003; // how often the particles move to a random place
    this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed

    // Screen program: input texture --> output texture (with some fading)
    this.screenProgram = util.createProgram(gl, quadVert, screenFrag);
    // Draw program: particle index, wind data --> current particle position and color
    this.drawProgram = util.createProgram(gl, drawVert, drawFrag);
    // Update program: current particle positions --> next particle positions
    this.updateProgram = util.createProgram(gl, quadVert, updateFrag);

    this.quadBuffer = util.createBuffer(
      gl,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    );
    this.framebuffer = gl.createFramebuffer();

    this.setColorRamp(defaultRampColors);
    this.resize();
  }

  resize() {
    const { gl } = this;
    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);

    // Screen textures to hold the drawn screen for the previous and the current frame
    this.prevScreenTexture = util.createTexture(
      gl,
      gl.NEAREST,
      emptyPixels,
      gl.canvas.width,
      gl.canvas.height
    );
    this.screenTexture = util.createTexture(
      gl,
      gl.NEAREST,
      emptyPixels,
      gl.canvas.width,
      gl.canvas.height
    );
  }

  setColorRamp(colors) {
    const { gl } = this;
    // lookup texture for colorizing the particles according to their speed
    this.colorRampTexture = util.createTexture(
      gl,
      gl.LINEAR,
      getColorRamp(colors),
      16,
      16
    );
  }

  // Can be called at any time by dat.gui -- in that case, we reset the state
  set numParticles(numParticles) {
    const { gl } = this;

    // Calculate the size of a square that has at least numParticles pixels
    const particleRes = Math.ceil(Math.sqrt(numParticles));
    this.particleStateResolution = particleRes;
    this._numParticles = particleRes * particleRes;

    // Create a square texture where each pixel holds the current particle position encoded as RGBA
    // Initialise positions randomly
    const particleState = new Uint8Array(this._numParticles * 4);
    for (let i = 0; i < particleState.length; i++) {
      particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
    }

    // Load position data into two textures (current and next frame)
    this.prevParticleStateTexture = util.createTexture(
      gl,
      gl.NEAREST,
      particleState,
      particleRes,
      particleRes
    );
    this.particleStateTexture = util.createTexture(
      gl,
      gl.NEAREST,
      particleState,
      particleRes,
      particleRes
    );

    // Create particle index buffer
    const particleIndices = new Float32Array(this._numParticles);
    for (let i = 0; i < this._numParticles; i++) particleIndices[i] = i;
    this.particleIndexBuffer = util.createBuffer(gl, particleIndices);
  }

  get numParticles() {
    return this._numParticles;
  }

  setWind(windData) {
    this.windData = windData;
    const { gl } = this;
    this.windTexture = util.createTexture(gl, gl.LINEAR, windData.image);
  }

  // ====================================
  // Render
  // ====================================
  draw() {
    const { gl } = this;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    util.bindTexture(gl, this.windTexture, 0);
    util.bindTexture(gl, this.prevParticleStateTexture, 1);

    this.drawScreen();
    this.updateParticles();
  }

  drawScreen() {
    const { gl } = this;

    // Configure GPU output to a framebuffer, where previous screen and
    // new particle positions are merged. Then draw:
    // - The previous texture (faded out a bit)
    // - The current particles
    util.bindFramebuffer(gl, this.framebuffer, this.screenTexture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this.drawTexture(this.prevScreenTexture, this.fadeOpacity);
    this.drawParticles();

    // Configure GPU output to the screen, and copy the current texture
    // (gl.BLEND is enabled to support drawing on top of an existing background (e.g. a map) --
    // this might not be needed)
    util.bindFramebuffer(gl, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawTexture(this.screenTexture, 1.0);
    gl.disable(gl.BLEND);

    // Swap previous and current textures, preparing for the next iteration
    const { prevScreenTexture } = this;
    this.prevScreenTexture = this.screenTexture;
    this.screenTexture = prevScreenTexture;
  }

  // Copy an input texture to an output texture, with some fading
  drawTexture(texture, opacity) {
    const { gl } = this;
    const program = this.screenProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);
    util.bindTexture(gl, texture, 2);
    gl.uniform1i(program.u_screen, 2);
    gl.uniform1f(program.u_opacity, opacity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Draw the current particle positions
  drawParticles() {
    const { gl } = this;
    const program = this.drawProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, this.particleIndexBuffer, program.a_index, 1);
    util.bindTexture(gl, this.colorRampTexture, 2);

    gl.uniform1i(program.u_wind, 0);
    gl.uniform1i(program.u_particles, 1);
    gl.uniform1i(program.u_color_ramp, 2);

    gl.uniform1f(program.u_particles_res, this.particleStateResolution);
    gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
    gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);

    gl.drawArrays(gl.POINTS, 0, this._numParticles);
  }

  // Use the GPU to update particle state
  updateParticles() {
    const { gl } = this;
    util.bindFramebuffer(gl, this.framebuffer, this.particleStateTexture);
    gl.viewport(
      0,
      0,
      this.particleStateResolution,
      this.particleStateResolution
    );

    const program = this.updateProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);

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
    const { prevParticleStateTexture } = this;
    this.prevParticleStateTexture = this.particleStateTexture;
    this.particleStateTexture = prevParticleStateTexture;
  }
}

// Create a canvas, draw a gradient on it with the predefined stops, then sample the image
function getColorRamp(colors) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 1;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
}
