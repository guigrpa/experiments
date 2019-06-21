const vertexCode = `
attribute vec2 aPosition;
varying vec2 vPosition;

void main() {
  gl_Position = vec4(aPosition, 0, 1);
  vPosition = aPosition;
  gl_PointSize = 2.0;
}`;

const fragmentCode = `
precision mediump float;
varying vec2 vPosition;
uniform float uRandom;

void main() {
  float rand = fract(sin(dot(vPosition, vec2(12.9898, 78.233)) * uRandom) * 43758.5453);
  float rand2 = floor(rand + 0.5);
  gl_FragColor = vec4(rand2, rand2, 255, 1);
  // gl_FragColor = vec4(mod(vPosition * 10.0, 1.0), 0, 1);
}`;

// prettier-ignore
const NUM_POINTS = 1e4;
const POSITIONS = [];
{
  for (let i = 0; i < NUM_POINTS; i++) {
    POSITIONS[i * 2 + 0] = Math.random() * 2 - 1;
    POSITIONS[i * 2 + 1] = Math.random() * 2 - 1;
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
  const uRandom = gl.getUniformLocation(program, 'uRandom');

  // Create and upload buffers
  const aPositionBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(POSITIONS), gl.STATIC_DRAW);

  // Paint!
  const scene = {
    gl,
    program,
    locations: { aPosition, uRandom },
    data: { aPositionBuf },
  };
  animateScene(scene);
};

const animateScene = scene => {
  const { gl, program, locations, data } = scene;
  const { aPosition, uRandom } = locations;
  const { aPositionBuf } = data;

  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Inits
  gl.useProgram(program);

  // Draw
  gl.uniform1f(uRandom, Math.random());
  gl.bindBuffer(gl.ARRAY_BUFFER, aPositionBuf);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, NUM_POINTS);

  window.requestAnimationFrame((/* curTime */) => {
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
