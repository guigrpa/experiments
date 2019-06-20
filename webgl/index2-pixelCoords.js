// = index1.js, but coordinates are given in pixels (rather than in
// clip space)

const vertexCode = `
attribute vec2 a_position;
uniform vec2 u_resolution;

void main() {
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  // complete output to have vec4 type
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}`;

const fragmentCode = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

void main() {
  // gl_FragColor is a special variable a fragment shader
  // is responsible for setting
  gl_FragColor = vec4(1, 0, 0.5, 1); // return redish-purple
}`;

// prettier-ignore
const POSITIONS = [
  10, 20,
  80, 20,
  10, 30,
  10, 30,
  80, 20,
  80, 30,
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
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Compile program
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexCode);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentCode);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  // Configure input buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Configure input attribute
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  const size = 2; // 2 components per iteration
  const normalize = false; // don't normalize the data
  const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionLocation,
    size,
    gl.FLOAT,
    normalize,
    stride,
    offset
  );

  // Configure resolution uniform
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  gl.uniform2f(
    resolutionLocation,
    gl.canvas.clientWidth, // gl.drawingBufferWidth,
    gl.canvas.clientHeight // gl.drawingBufferHeight
  );

  // Clear the canvas and paint!
  gl.clearColor(128, 100, 50, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(POSITIONS), gl.STATIC_DRAW);
  const offset2 = 0;
  const count = POSITIONS.length / 2;
  gl.drawArrays(gl.TRIANGLES, offset2, count);
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
