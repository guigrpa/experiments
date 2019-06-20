// = index5.js, but:
// - animation (with uniform color)

const vertexCode = `
attribute vec2 aPosition;
uniform vec2 uResolution;

void main() {
  // convert to clip-space coords
  vec2 clipSpace = (aPosition / uResolution * 2.0 - 1.0) * vec2(1, -1);
  gl_Position = vec4(clipSpace, 0, 1);
}`;

const fragmentCode = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

uniform vec4 uColor;

void main() {
  // gl_FragColor = vec4(1, 0, 0.5, 1); // return redish-purple
  gl_FragColor = uColor;
}`;

// prettier-ignore
const POSITIONS_1 = [
  795, 5,
  795, 295,
  5, 295,
];
const POSITIONS_2 = [5, 5, 100, 5, 5, 100];

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
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uColor = gl.getUniformLocation(program, 'uColor');
  const aPosition = gl.getAttribLocation(program, 'aPosition');

  // Create and upload buffers
  const aPositionBuf1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(POSITIONS_1), gl.STATIC_DRAW);
  const aPositionBuf2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf2);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(POSITIONS_2), gl.STATIC_DRAW);

  // Paint!
  const scene = {
    gl,
    program,
    locations: { uResolution, uColor, aPosition },
    data: { aPositionBuf1, aPositionBuf2, col: createRandomColor() },
  };
  animateScene(scene);
};

const animateScene = scene => {
  const { gl, program, locations, data } = scene;
  const { uResolution, uColor, aPosition } = locations;
  const { aPositionBuf1, aPositionBuf2, col } = data;

  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Inits
  gl.useProgram(program);

  // Configure common inputs
  gl.uniform2fv(uResolution, [gl.canvas.clientWidth, gl.canvas.clientHeight]);
  gl.uniform4fv(uColor, col);

  // Draw - 1
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf1);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Draw - 2
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf2);
  // gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.requestAnimationFrame((/* curTime */) => {
    for (let i = 0; i < 3; i++) col[i] = (col[i] + 0.01) % 1;
    animateScene(scene);
  });
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
