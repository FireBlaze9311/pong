export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createCanvas(width, height, set2dTransform = true) {
    const ratio = Math.ceil(window.devicePixelRatio);
    const canvas = document.createElement('canvas');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (set2dTransform) {
        canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    return canvas;
}

export function normalize(direction){
    let len = Math.sqrt(direction.x ** 2 + direction.y ** 2)
    direction.x /= len
    direction.y /= len
}