// Constants
const minSize = 1;
const maxSize = 50;
const pixelSize = 20;
const backgroundColor = 'transparent';

// State
const grid = []
let canvas;
let context;
let width = 10;
let height = 10;
let hoveredX = -1;
let hoveredY = -1;

function setData(data) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[y] && data[y][x]) {
                grid[y][x] = data[y][x];
            }
        }
    }
}

function clear() {
    grid.length = 0;
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push(backgroundColor);
        }
        grid.push(row);
    }
}

function fill(color) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            grid[y][x] = color;
        }
    }
}

function save() {
    localStorage.setItem('pixelArt', JSON.stringify(grid));
}

function load() {
    return localStorage.getItem('pixelArt');
}

function getGridPosition(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const pixelX = Math.floor(x / pixelSize);
    const pixelY = Math.floor(y / pixelSize);

    return { pixelX, pixelY };
}

function setup() {
    const saved = load();
    if (saved) {
        const data = JSON.parse(saved);
        width = data[0].length;
        height = data.length;
        clear();
        setData(data);
    } else {
        clear();
    }

    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    const colorPicker = document.getElementById('colorPicker');
    let selectedColor = colorPicker.value;

    colorPicker.addEventListener('input', function () {
        selectedColor = colorPicker.value;
    });

    let isDrawing = false;
    let isErasing = false;
    let isEyedropping = false;

    canvas.addEventListener('mousedown', function (event) {
        const { pixelX, pixelY } = getGridPosition(event.clientX, event.clientY);
        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
            return;
        }
        if (isEyedropping) {
            selectedColor = grid[pixelY][pixelX];
            colorPicker.value = selectedColor;
            return;
        }
        if (event.button === 0) {
            isDrawing = true;
            grid[pixelY][pixelX] = selectedColor;
            save();
        } else if (event.button === 2) {
            isErasing = true;
            grid[pixelY][pixelX] = backgroundColor;
            save();
            event.preventDefault();
        }
    });

    canvas.addEventListener('mousemove', function (event) {
        const { pixelX, pixelY } = getGridPosition(event.clientX, event.clientY);
        hoveredX = pixelX;
        hoveredY = pixelY;
        if (!isDrawing && !isErasing) {
            return;
        }
        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) return;
        if (isDrawing) {
            grid[pixelY][pixelX] = selectedColor;
            save();
        } else if (isErasing) {
            grid[pixelY][pixelX] = backgroundColor;
            save();
        }
    });

    canvas.addEventListener('mouseup', function () {
        isDrawing = false;
        isErasing = false;
    });

    canvas.addEventListener('mouseleave', function () {
        hoveredX = -1;
        hoveredY = -1;
    });

    canvas.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });

    // Eyedropper
    const eyedropperBtn = document.getElementById('eyedropperBtn');
    eyedropperBtn.addEventListener('click', function () {
        isEyedropping = !isEyedropping;
        eyedropperBtn.style.backgroundColor = isEyedropping ? 'green' : '';
        eyedropperBtn.style.color = isEyedropping ? 'white' : '';
        canvas.style.cursor = isEyedropping ? 'crosshair' : '';
    });

    // Fill
    const fillBtn = document.getElementById('fillBtn');
    fillBtn.addEventListener('click', function () {
        if (!confirm("Fill will clear the current drawing. Are you sure?")) {
            return;
        }
        fill(selectedColor);
        save();
    });

    // Export
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', function () {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempContext = tempCanvas.getContext('2d');
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                tempContext.fillStyle = grid[y][x];
                tempContext.fillRect(x, y, 1, 1);
            }
        }
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'pixel-art.png';
        link.click();
    });

    // Clear
    const clearBtn = document.getElementById('clearBtn');
    clearBtn.addEventListener('click', function () {
        if (window.confirm("Are you sure you want to clear the canvas?")) {
            clear();
            save();
        }
    });

    // Resize
    const resizeBtn = document.getElementById('resizeBtn');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    widthInput.value = width;
    heightInput.value = height;
    resizeBtn.addEventListener('click', function () {
        const newWidth = parseInt(widthInput.value);
        const newHeight = parseInt(heightInput.value);
        if (newWidth < minSize || newHeight < minSize || newWidth > maxSize || newHeight > maxSize) {
            alert(`Width and height must be between ${minSize} and ${maxSize}`);
            return;
        }
        if (newWidth !== width || newHeight !== height) {
            if (!confirm("Changing the canvas size will clear the current drawing. Are you sure?")) {
                return;
            }
            width = newWidth;
            height = newHeight;
            clear();
            save();
        }
    });
}

function draw() {
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            context.fillStyle = grid[y][x];
            context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            // Grid lines
            context.strokeStyle = 'gray';
            context.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
    // Hover outline
    if (hoveredX >= 0 && hoveredX < width && hoveredY >= 0 && hoveredY < height) {
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.strokeRect(hoveredX * pixelSize, hoveredY * pixelSize, pixelSize, pixelSize);
    }
    requestAnimationFrame(draw);
}


function main() {
    setup();
    draw();
}

window.onload = main;