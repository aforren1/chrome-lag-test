import {
    createProgramInfo,
    createBufferInfoFromArrays,
    resizeCanvasToDisplaySize,
    setBuffersAndAttributes,
    setUniforms,
    drawBufferInfo
} from 'twgl-base.js'

const has_hid = 'hid' in navigator

const vs = `

`

const fs = `

`

window.addEventListener('load', () => {
    const gl = document.getElementById("c").getContext("webgl2");
    const programInfo = createProgramInfo(gl, [vs, fs]);

    const arrays = {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    const bufferInfo = createBufferInfoFromArrays(gl, arrays);

    function render(time) {
        resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        const uniforms = {
            time: time * 0.001,
            resolution: [gl.canvas.width, gl.canvas.height],
        };

        gl.useProgram(programInfo.program);
        setBuffersAndAttributes(gl, programInfo, bufferInfo);
        setUniforms(programInfo, uniforms);
        drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
})