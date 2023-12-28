import { read } from './read.js'
import { draw } from './draw.js'

function main() {
    read().then(data => {
        draw(data);
    });
}

main();
