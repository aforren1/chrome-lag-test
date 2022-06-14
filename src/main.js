
const url_params = new URL(window.location.href).searchParams
const label = url_params.get('label') ?? 'test'
const on_frames = url_params.get('on_frames') || 5
const off_frames = url_params.get('off_frames') || 10
const cycles = url_params.get('cycles') || 20

const median = (arr) => {
    const mid = Math.floor(arr.length / 2)
    const nums = [...arr].sort((a,b) => a - b)
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid] + nums[mid - 1]) / 2
}

const canvas = document.getElementById('c');
const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize()
window.addEventListener('resize', resize)

const ctx = canvas.getContext('2d', { alpha: false })
ctx.font = '48px serif'

const PREFRAMES = 200
let dts = Array(PREFRAMES)
let frame_counter = 0
let cycle_counter = 0
let on_counter = 0
let off_counter = -1
let is_on = false
let t0 = 0
let med = 0

const render = (time) => {
    //
    if (is_on) {
        on_counter++
        if (on_counter >= on_frames) {
            is_on = false
            on_counter = 0
            cycle_counter++
            ctx.fillStyle = 'rgb(0, 0, 0)'
            ctx.fillRect(0, 0, 30, 30);
        }
    } else {
        off_counter++
        if (off_counter >= off_frames) {
            is_on = true
            off_counter = 0
            ctx.fillStyle = 'rgb(255, 255, 255)'
            ctx.fillRect(0, 0, 30, 30);
        }
    }

    let dt = time - t0
    t0 = time
    if (dt > 1.5 * median) {
        ctx.fillStyle = 'rgb(255, 255, 0)'
        ctx.fillRect(30, 30, 50, 50)
    }
    console.log(cycle_counter)
    if (cycle_counter < cycles) {
        requestAnimationFrame(render)
    } else {
        // trigger data download
        ctx.fillStyle = 'green'
        // huh, font gets reset somehow?
        ctx.font = '48px serif'
        ctx.fillText('Done, saving data...', 10, 50)
        // let a = document.createElement("a");
        // let file = new Blob([JSON.stringify(trials)], { type: "text/plain" });
        // a.href = URL.createObjectURL(file);
        // a.download = `data_${JSON.stringify(new Date())}.json`;
        // a.click();
        // URL.revokeObjectURL(a.href);
    }
}

const prestart = (time) => {
    if (frame_counter > PREFRAMES) {
        med = median(dts)
        ctx.fillStyle = 'rgb(0, 0, 0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'orange'
        ctx.fillText(`Measured ~${med.toFixed(2)} ms. Click to start.`, 10, 50)
        canvas.addEventListener('click', () => {
            ctx.fillStyle = 'rgb(0, 0, 0)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            requestAnimationFrame(render)
            canvas.requestFullscreen()
        })        
    } else if (frame_counter > 0) {
        dts[frame_counter - 1] = time - t0
        requestAnimationFrame(prestart)
    } else {
        ctx.fillStyle = 'orange'
        ctx.fillText('Inferring frame rate, please wait...', 10, 50)
        requestAnimationFrame(prestart)
    }
    t0 = time
    frame_counter++
}


window.addEventListener('load', () => {
    requestAnimationFrame(prestart)
})

