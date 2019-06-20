const vertexCode = `
attribute vec2 aPosition;
attribute vec4 aColor;
varying vec4 vColor;

void main() {
  // convert to clip-space coords
  gl_Position = vec4(aPosition, 0, 1);
  vColor = aColor;
}`;

const fragmentCode = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}`;

// prettier-ignore
const NUM_LINES = 1e4;
const POSITIONS = [];
const COLORS = [];
{
  for (let i = 0; i < NUM_LINES; i++) {
    POSITIONS[i * 4 + 0] = Math.random() * 2 - 1; // from
    POSITIONS[i * 4 + 1] = Math.random() * 2 - 1;
    POSITIONS[i * 4 + 2] = Math.random() * 2 - 1; // to
    POSITIONS[i * 4 + 3] = Math.random() * 2 - 1;
    const r = Math.random() * 256;
    const g = Math.random() * 256;
    const b = Math.random() * 256;
    const a = 128 + Math.random() * 128;
    COLORS[i * 8 + 0] = r; // from
    COLORS[i * 8 + 1] = g;
    COLORS[i * 8 + 2] = b;
    COLORS[i * 8 + 3] = a;
    COLORS[i * 8 + 4] = r; // to (same color)
    COLORS[i * 8 + 5] = g;
    COLORS[i * 8 + 6] = b;
    COLORS[i * 8 + 7] = a;
  }
}

// ========================================
// Main
// ========================================
const run = () => {
  // Prepare canvas and context
  const canvas = document.getElementById('gl1');
  const gl = canvas.getContext('webgl');
  resizeCanvasToDisplaySize(gl);

  // Compile program & get locations
  const program = createProgram(gl, vertexCode, fragmentCode);
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aColor = gl.getAttribLocation(program, 'aColor');

  // Create and upload buffers
  const aPositionBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(POSITIONS), gl.STATIC_DRAW);
  const aColorBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aColorBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(COLORS), gl.STATIC_DRAW);

  // Paint!
  const scene = {
    gl,
    program,
    locations: { aPosition, aColor },
    data: { aPositionBuf, aColorBuf },
  };
  drawScene(scene);
};

const drawScene = scene => {
  const { gl, program, locations, data } = scene;
  const { aPosition, aColor } = locations;
  const { aPositionBuf, aColorBuf } = data;

  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Inits
  gl.useProgram(program);

  // Draw
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, aColorBuf);
  gl.enableVertexAttribArray(aColor);
  gl.vertexAttribPointer(aColor, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.drawArrays(gl.LINES, 0, NUM_LINES * 2);
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

const resizeCanvasToDisplaySize = gl => {
  const realToCSSPixels = window.devicePixelRatio;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  var displayWidth = Math.floor(gl.canvas.clientWidth * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
    // Make the canvas the same size
    gl.canvas.width = displayWidth;
    gl.canvas.height = displayHeight;
  }
};

const createRandomColor = () => [
  Math.random(),
  Math.random(),
  Math.random(),
  1,
];

// ========================================
// Let's go!
// ========================================
run();
