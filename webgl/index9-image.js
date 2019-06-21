// ========================================
// Shaders
// ========================================
const vertexCode = `
uniform vec2 uResolution;
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vec2 clipSpace = (aPosition / uResolution * 2.0 - 1.0) * vec2(1, -1);
  gl_Position = vec4(clipSpace, 0, 1);
  vTexCoord = aTexCoord;
}`;

const fragmentCode = `
precision mediump float;
uniform sampler2D uImage;
varying vec2 vTexCoord;

void main() {
  // Uncomment for geometric distortion
  // gl_FragColor = texture2D(uImage, vTexCoord + 0.1 * sin(vTexCoord * 2.0 * 3.1415)).rbga;
  gl_FragColor = texture2D(uImage, vTexCoord).rbga;
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
  // Prepare canvas and context
  const canvas = document.getElementById('gl1');
  const gl = canvas.getContext('webgl');
  resizeCanvasToDisplaySize(gl);
  console.log(
    'Max # textures per fragment shader:',
    gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
  );
  console.log(
    'Max # textures per vertex shader:',
    gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)
  );

  // Compile program & get locations
  const program = createProgram(gl, vertexCode, fragmentCode);
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uImage = gl.getUniformLocation(program, 'uImage');
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
  const locations = { uResolution, uImage, aPosition, aTexCoord };

  // Create and upload buffers
  const aPositionBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf);
  setRectangle(gl, 0, 0, (250 * image.width) / image.height, 250);
  const aTexCoordBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aTexCoordBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(TEX_COORDS), gl.STATIC_DRAW);
  const buffers = { aPositionBuf, aTexCoordBuf };

  // Create and upload textures
  const uImageTexIdx = 2;
  const uImageTex = createAndSetUpTexture(gl, uImageTexIdx);
  gl.bindTexture(gl.TEXTURE_2D, uImageTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Paint!
  const data = { uImageTexIdx };
  const scene = { gl, program, locations, buffers, data };
  drawScene(scene);
};

const drawScene = scene => {
  const { gl, program, locations, buffers, data } = scene;
  const { uResolution, uImage, aPosition, aTexCoord } = locations;

  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Inits
  gl.useProgram(program);

  // Configure & run program
  gl.uniform2fv(uResolution, [gl.canvas.clientWidth, gl.canvas.clientHeight]);
  gl.uniform1i(uImage, data.uImageTexIdx);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aPositionBuf);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aTexCoordBuf);
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
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

const createAndSetUpTexture = (gl, idxTexture) => {
  gl.activeTexture(gl.TEXTURE0 + idxTexture);
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
