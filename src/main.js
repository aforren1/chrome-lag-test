import {
    createProgramInfo,
    createBufferInfoFromArrays,
    resizeCanvasToDisplaySize,
    setBuffersAndAttributes,
    setUniforms,
    drawBufferInfo
} from 'twgl-base.js'

const has_hid = 'hid' in navigator

const vs = `#version 300 es
precision mediump float;

in vec4 position;
flat out vec4 color;

uniform vec2 offset;
uniform vec4 fill_color;

void main() {
    vec4 tot_off = vec4(offset.x, offset.y, 0.0, 0.0);
    color = fill_color;
    gl_Position = position + tot_off;

}`

const fs = `#version 300 es
precision mediump float;

flat in vec4 color;
out vec4 f_color;

void main() {
    f_color = color;
}`
const gl = document.getElementById("c").getContext("webgl2")
const programInfo = createProgramInfo(gl, [vs, fs])
console.log(programInfo)

window.addEventListener('load', () => {
    function render(time) {
        resizeCanvasToDisplaySize(gl.canvas)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(programInfo.program)
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
})
