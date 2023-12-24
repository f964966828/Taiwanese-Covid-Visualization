
export function read_data() {
    var data = {};
    d3.json("./data/town_info.json").then(townInfo => {
        for (const country in townInfo) {
            data[country] = {};
            for (let i = 0; i < townInfo[country].length; i++) {
                const town = townInfo[country][i];
                data[country][town] = {};

                const confirmed_fliename = `./data/${country}_${town}_確診報表.csv`;
                d3.csv(confirmed_fliename).then(loadedData => {
                    data[country][town]['confirmed'] = loadedData;
                });

                const death_fliename = `./data/${country}_${town}_死亡報表.csv`;
                d3.csv(death_fliename).then(loadedData => {
                    data[country][town]['death'] = loadedData;
                });
            }
            //break;
        }
    })
    //console.log(data);
    return data;
}
