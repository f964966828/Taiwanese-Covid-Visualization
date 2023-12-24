import { read_data } from './read.js'
import { draw_town, draw_country } from './draw.js'

function main() {
    var data = read_data();
    draw_town(data);
    draw_country(data);
}

main();
