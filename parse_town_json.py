import os
import json

data = {}
for filename in os.listdir("./data"):
    try:
        country, town, _ = filename.split('_')
        if country not in data.keys():
            data[country] = list()
        if town not in data[country]:
            data[country].append(town)
    except:
        pass

json_string = json.dumps(data, sort_keys=True, indent=4, ensure_ascii=False)
with open("./data/town_info.json", "w") as file:
    file.write(json_string)
