
export async function read() {
    var data = {};
    const townInfo = await d3.json("./data/town_info.json");

    const promises = [];
    for (const country in townInfo) {
        data[country] = {};

        for (let i = 0; i < townInfo[country].length; i++) {
            const town = townInfo[country][i];
            data[country][town] = {};

            const confirmedFilename = `./data/${country}_${town}_確診報表.csv`;
            const deathFilename = `./data/${country}_${town}_死亡報表.csv`;

            const confirmedPromise = d3.csv(confirmedFilename).then(loadedData => {
                data[country][town]['confirmed'] = loadedData;
            });
            const deathPromise = d3.csv(deathFilename).then(loadedData => {
                data[country][town]['death'] = loadedData;
            });

            promises.push(confirmedPromise, deathPromise);
        }
    }

    await Promise.all(promises);
    return data;
}
