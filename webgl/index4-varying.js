// = index2.js, but:
// - adding a varying
// - cleaner boilerplate, conventions (from Mozilla MDN)

const vertexCode = `
attribute vec2 aPosition;
uniform vec2 uResolution;
varying vec4 vColor;

void main() {
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = aPosition / uResolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  // complete output to have vec4 type
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // Add output color (position is in [-1, 1] --> colors must be in [0, 1])
  vColor = gl_Position * 0.5 + 0.5;
}`;

const fragmentCode = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

varying vec4 vColor;

void main() {
  // gl_FragColor = vec4(1, 0, 0.5, 1); // return redish-purple
  gl_FragColor = vColor;
}`;

// prettier-ignore
const POSITIONS = [
  795, 5,
  795, 295,
  5, 295,
];

// ========================================
// Main
// ========================================
const run = () => {
  // Prepare canvas and context
  const canvas = document.getElementById('gl1');
  const gl = canvas.getContext('webgl');
  resizeCanvasToDisplaySize(gl);

  // Compile program
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexCode);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentCode);
  const program = createProgram(gl, vertexShader, fragmentShader);

  // Configure input buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(POSITIONS), gl.STATIC_DRAW);

  // Clear the canvas and paint!
  drawScene(gl, program);
};

const drawScene = (gl, program) => {
  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(128, 100, 50, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Inits
  gl.useProgram(program);
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const aPosition = gl.getAttribLocation(program, 'aPosition');

  // Configure resolution uniform
  gl.uniform2fv(uResolution, [gl.canvas.clientWidth, gl.canvas.clientHeight]);

  // Enable attribute
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  // Draw
  gl.drawArrays(gl.TRIANGLES, 0, POSITIONS.length / 2);
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

const createProgram = (gl, vertexShader, fragmentShader) => {
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

// ========================================
// Let's go!
// ========================================
run();
