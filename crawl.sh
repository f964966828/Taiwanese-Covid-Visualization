#!/bin/bash

function get_city() {
  wget -O - "https://covid-19.nchc.org.tw/2023_city_confirmed.php?mycity=全國" 2> /dev/null | \
    rg -o "href=\"2023_city_confirmed.php\?mycity=\w+" | \
    cut -d= -f3
}

function get_town() {
  city=$1
  wget -O - "https://covid-19.nchc.org.tw/2023_city_confirmed.php?mycity=${city}" 2> /dev/null | \
    rg -o "href=\"2023_town_confirmed.php\?mycity=${city}&mytown=\w+" | \
    cut -d= -f4
}

function crawl_town() {
  city=$1
  town=$2
  dataset_id=(8 10 11 14 16 17)
  dataset_name=(確診報表 分齡確診報表 性別確診報表 死亡報表 分齡死亡報表 性別死亡報表)

  for ((i = 0; i < ${#dataset_id[*]}; i++)); do
    wget -O "${city}_${town}_${dataset_name[$i]}.csv" "https://covid-19.nchc.org.tw/2023_dt_csv.php?dt_name=${dataset_id[$i]}&ext=${city}_${town}" 2> /dev/null
  done
}

function crawl_city() {
  city=$1
  crawl_town ${city} 全區

  if [ "${city}" != "全國" ]; then
    wget -O "${city}_疫苗接種報表.csv" "https://covid-19.nchc.org.tw/2023_dt_csv.php?dt_name=38&ext=${city}" 2> /dev/null
    for town in $(get_town ${city}) ; do
      echo "  town: ${town}"
      crawl_town ${city} ${town}
    done
  else
    wget -O "${city}_疫苗接種報表.csv" "https://covid-19.nchc.org.tw/2023_dt_csv.php?dt_name=38&ext=總計" 2> /dev/null
  fi
}

function main() {
  for city in $(get_city) ; do
    echo "city: ${city}"
    crawl_city ${city}
  done
}

main
