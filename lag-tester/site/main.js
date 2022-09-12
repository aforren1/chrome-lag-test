// e.g. http://127.0.0.1:5500/site/index.html?label=default&cycles=100&device=1
const url_params = new URL(window.location.href).searchParams
const label = url_params.get('label') ?? 'test'
const on_frames = url_params.get('on_frames') || 3
const off_frames = url_params.get('off_frames') || 3
const cycles = url_params.get('cycles') || 20
const device = url_params.get('device') ?? 0 // use custom device?

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
let saveid = 0

let obs = {'time_us': null,
           'sample_counter': null,
           'photo': null}

let obs_count = 0

const saveData = () => {
    let a = document.createElement("a");
    obs['time_us'] = obs['time_us'].filter((el) => { return el != null })
    obs['sample_counter'] = obs['sample_counter'].filter((el) => { return el != null })
    obs['photo'] = obs['photo'].filter((el) => { return el != null })
    let file = new Blob([JSON.stringify(obs)], { type: "text/plain" });
    a.href = URL.createObjectURL(file);
    a.download = `data_${label}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

const render = async (time) => {
    //
    if (is_on) {
        on_counter++
        if (on_counter >= on_frames) {
            is_on = false
            on_counter = 0
            cycle_counter++
            ctx.fillStyle = 'rgb(0, 0, 0)'
            ctx.fillRect(0, 0, 80, 80);
        }
    } else {
        off_counter++
        if (off_counter >= off_frames) {
            is_on = true
            off_counter = 0
            ctx.fillStyle = 'rgb(255, 255, 255)'
            ctx.fillRect(0, 0, 80, 80);
            // rising edge, tell the device
            dev && dev.sendReport(0, new Uint8Array([0x02]))
        }
    }

    let dt = time - t0
    t0 = time
    // make dropped frames obvious
    if (dt > 1.5 * median) {
        ctx.fillStyle = 'rgb(255, 255, 0)'
        ctx.fillRect(30, 30, 50, 50)
    }
    console.log(cycle_counter)
    if (cycle_counter < cycles) {
        requestAnimationFrame(render)
    } else {
        // done
        let first = true
        dev && await dev.addEventListener('inputreport', async (event) => {
            // trigger another reading
            clearTimeout(saveid)
            saveid = setTimeout(saveData, 2000)
            dev.sendReport(0, new Uint8Array([0x03]))
            
            const view = event.data
            if (first) {
                first = false
                // number of samples to expect
                console.log('first:')
                console.log(view)
                let n_evts = view.getUint32(0, 1) // we send little endian
                console.log(n_evts)
                obs['photo'] = new Array(n_evts)
                obs['sample_counter'] = new Array(n_evts)
                obs['time_us'] = new Array(n_evts)
                return
            }
            // 8 observations at a time
            for (let i = 0; i < 8; i++) {
                let offset = i*8
                obs['time_us'][obs_count] = view.getUint32(0 + offset, 1)
                obs['sample_counter'][obs_count] = view.getUint16(4 + offset, 1)
                obs['photo'][obs_count] = view.getUint16(6 + offset, 1)
                obs_count++
            }
        })
        dev && dev.sendReport(0, new Uint8Array([0x00]))
        // trigger data download
        ctx.fillStyle = 'green'
        // huh, font gets reset somehow?
        ctx.font = '48px serif'
        ctx.fillText('Done, saving data...', 10, 50)
    }
}

const prestart = (time) => {
    if (frame_counter > PREFRAMES) {
        med = median(dts)
        ctx.fillStyle = 'rgb(0, 0, 0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'orange'
        ctx.fillText(`Measured ~${med.toFixed(2)} ms. Click to start.`, 10, 50)
        canvas.addEventListener('click', async () => {
            // tell device to start recording
            dev && await dev.sendReport(0, new Uint8Array([0x01]))
            ctx.fillStyle = 'rgb(0, 0, 0)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            requestAnimationFrame(render)
            //canvas.requestFullscreen()
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

const filter = [{
    vendorId: 0x16c0,
    productId: 0x486,
    usagePage: 0xffab,
    usage: 0x200
}]

let dev = 0

const deviceSetup = async () => {
    window.removeEventListener('click', deviceSetup)

    const devices = await navigator.hid.requestDevice({ filters: filter })
    console.log(devices) // should only have one at this point
    dev = devices[0]
    await dev.open()
    requestAnimationFrame(prestart)
}

window.addEventListener('load', async () => {
    device && window.addEventListener('click', deviceSetup)
    !device && requestAnimationFrame(prestart)
})

