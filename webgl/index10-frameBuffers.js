// Basic idea:
// image (uImageTex) --> frameBuffer[0] (texture[0])
// texture[0] --> frameBuffer[1] (texture[1])
// texture[1] --> frameBuffer[0] (texture[0])
// texture[0] --> canvas

// ========================================
// Shaders
// ========================================
const vertexCode = `
uniform vec2 uSize;
uniform float uFlipY;
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vec2 clipSpace = (aPosition / uSize * 2.0 - 1.0) * vec2(1, uFlipY);
  gl_Position = vec4(clipSpace, 0, 1);
  vTexCoord = aTexCoord;
}`;

const fragmentCode = `
precision mediump float;
uniform sampler2D uImage;
varying vec2 vTexCoord;

void main() {
  // Uncomment for geometric distortion
  // gl_FragColor = texture2D(uImage, vTexCoord + 0.01 * sin(vTexCoord * 2.0 * 3.1415)).gbra;
  gl_FragColor = texture2D(uImage, vTexCoord).gbra;
}`;

const NUM_LINES = 1e4;
// prettier-ignore
const TEX_COORDS = [
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1,
];

// ========================================
// Main
// ========================================
const run = image => {
  // Init
  // ----
  // Prepare canvas and context
  const canvas = document.getElementById('gl1');
  const gl = canvas.getContext('webgl');
  resizeCanvasToDisplaySize(gl);

  // Compile program & get locations
  const program = createProgram(gl, vertexCode, fragmentCode);
  const uSize = gl.getUniformLocation(program, 'uSize');
  const uFlipY = gl.getUniformLocation(program, 'uFlipY');
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');

  // Create and upload buffers
  const aPositionBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf);
  setRectangle(gl, 0, 0, image.width, image.height);
  const aTexCoordBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aTexCoordBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(TEX_COORDS), gl.STATIC_DRAW);
  const buffers = { aPositionBuf, aTexCoordBuf };

  // Create and upload original texture
  const uImageTex = createAndSetUpTexture(gl);
  gl.bindTexture(gl.TEXTURE_2D, uImageTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Create 2 textures and attach them to framebuffers
  const textures = [];
  const framebuffers = [];
  for (let i = 0; i < 2; i++) {
    const texture = createAndSetUpTexture(gl);
    textures.push(texture);
    // Make the texture the same size as the image
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // prettier-ignore
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      image.width, image.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null
    );
    // Create a framebuffer
    const fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // Attach texture to the framebuffer
    // prettier-ignore
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
    );
  }

  // Render
  // ------
  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Inits
  gl.useProgram(program);

  // Configure buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aPositionBuf);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aTexCoordBuf);
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  // Run a number of times, ping-ponging between framebuffers
  gl.bindTexture(gl.TEXTURE_2D, uImageTex); // first input: the image
  const numRuns = 4;
  for (let i = 0; i < numRuns; i++) {
    const isLastRun = i === numRuns - 1;

    // Prepare output framebuffer (canvas in the last run)
    gl.bindFramebuffer(gl.FRAMEBUFFER, isLastRun ? null : framebuffers[i % 2]);

    // Other preparations
    if (isLastRun) {
      gl.uniform1f(uFlipY, -1); // flip Y at the end
      const { clientWidth, clientHeight } = gl.canvas;
      gl.uniform2fv(uSize, [clientWidth, clientHeight]);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      // Make image a bit smaller
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aPositionBuf);
      setRectangle(gl, 0, 0, image.width / 3, image.height / 3);
    } else {
      gl.uniform1f(uFlipY, 1); // don't flip when drawing to framebuffers
      gl.uniform2fv(uSize, [image.width, image.height]);
      gl.viewport(0, 0, image.width, image.height);
    }

    // Draw!
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Prepare input for next iteration: the texture we've just drawn
    if (!isLastRun) gl.bindTexture(gl.TEXTURE_2D, textures[i % 2]);
  }
};

// ========================================
// Helpers
// ========================================
const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
};

const createProgram = (gl, vertexCode, fragmentCode) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexCode);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentCode);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
};

const createAndSetUpTexture = gl => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
};

const resizeCanvasToDisplaySize = gl => {
  const realToCSSPixels = window.devicePixelRatio;
  var displayWidth = Math.floor(gl.canvas.clientWidth * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);
  if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
    gl.canvas.width = displayWidth;
    gl.canvas.height = displayHeight;
  }
};

const setRectangle = (gl, x, y, width, height) => {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  // prettier-ignore
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2
  ]), gl.STATIC_DRAW)
};

// ========================================
// Let's go!
// ========================================
const image = new Image();
image.src = '/image.jpg';
image.onload = () => {
  run(image);
};
