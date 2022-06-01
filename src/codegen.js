import xlsx from 'node-xlsx';
import path  from 'path';
import fs from 'fs';
import JSON5 from 'json5';
import { Adunits, NumbericalInlines, Bidders, Devices, Projects } from './types.js';
import prepareJSONCell from './helpers/prepareJSONCell.js'

String.prototype.t = function() {
    return this.trim().toLowerCase();
};

const biddersNames = Object.keys(Bidders);
const isBidderName = (cell) => biddersNames.includes(cell.t());
const isAdunit = (cell) => Adunits.includes(cell);
const getAdunit = (cell) => Adunits.find(adunit => adunit === cell);
const isDevice = (cell) => Devices.includes(cell);
const getDevice = (cell) => Devices.find(device => device === cell);

const __dirname = path.resolve();
const biddersXlsxPath = `${__dirname}/assets/bidders.xlsx`;

let sheets;
try{
    sheets = xlsx.parse(biddersXlsxPath);
} catch (err) {
    console.log(`Ошибка парсинга ${biddersXlsxPath}\n`);
    console.error(err);
}

console.log(`Начинаем парсить листы...`);

sheets?.forEach(({ name: sheetName , data }) => {
    if (!Projects[sheetName.t()]) {
        console.log(`Не найдено проекта для листа '${sheetName}', пропускаю`);
        return;
    }
    // Если в первом столбце начинается перечисление адъюнитов
    const isValidSheet = data.some(item => isAdunit(item[0]));
    
    if (!isValidSheet) {
        return;
    }

    // Находим сопоставление биддера с его индексом в каждом ряду
    const biddersIndexes = getBiddersIndexes(data);

    if(!biddersIndexes) {
        console.log(`Не нашел горизонтального столбца биддеров на листе ${sheetName}`);
        return;
    }

    const parsedData = parseData(data, biddersIndexes, sheetName);
    
    generateCodeFiles(parsedData, sheetName);

    console.log(`Лист готов: ${sheetName}`);
});

function getBiddersIndexes(data) {
    const bidderNamesRow = data.find(row => row.some(cell => isBidderName(cell)));

    return bidderNamesRow?.reduce((acc, cell, index) => {
        if (isBidderName(cell)) {
            const bidder = Bidders[cell.t()];
            acc[bidder] = index;
        }
        return acc;
    }, {});
}

function parseData(data, biddersIndexes, sheetName) {
    const parsedData =  data.reduce((acc, row) => {
        let adunit, device;

        // Найдем сначала адъюнит строки и девайс
        row.forEach(cell => {
            // Можно написать за O(n), зато так тупее и понятнее.
            if (isAdunit(cell)) {
                adunit = getAdunit(cell);
                return;
            }

            if (isDevice(cell)) {
                device = getDevice(cell);
                return;
            }
        });

        if (adunit && device) {
            if (!acc[adunit]) {
                acc[adunit] = {};
            }
            acc[adunit][device] = {};

            Object.entries(biddersIndexes).forEach(([bidder, index]) => {
                if(row[index]) {
                    if (bidder.startsWith('adfox_')) {
                        let json;
                        try {
                            json = prepareJSONCell(row[index]);
                            acc[adunit][device][bidder] = json;
                        } catch(e) {
                            console.log(`Опять программатик несуразицу написали в ${sheetName} ${adunit} ${device} ${bidder}`);
                        }
                    } else {
                        acc[adunit][device][bidder] = {
                            placementId: row[index]
                        };
                    }
                }
            });
        }

        return acc;
    }, {});

    // Перекопируем все параметры биддеров нумерованных инлайнов в инлайн обычный
    NumbericalInlines.forEach((inlinePlacement, inlineIndex) => {
        const inline = parsedData[inlinePlacement];

        for (const device in inline) {
            for (const bidder in inline[device]) {
                const inlineBidder = parsedData['inline'][device][bidder];
                if (!inlineBidder.placementInlineIds) {
                    inlineBidder.placementInlineIds = Array.from({ length: NumbericalInlines.length }).fill(null);
                }
                const inlineData = inline[device][bidder];
                const stuffToPush = inlineData.placementId ? inlineData.placementId : inlineData;
                inlineBidder.placementInlineIds[inlineIndex] = (stuffToPush);
            }
        }
        delete parsedData[inlinePlacement];
    });

    return parsedData;
}

function generateCodeFiles(parsedData, sheetName) {
    const sheetDirPath = `${__dirname}/build/${sheetName.t()}`;
    try {
        fs.mkdirSync(sheetDirPath);
    } catch (e) {} 

    // Приведем структуру даты к виду хранимого кода
    for(const p in parsedData) {
        for(const device in parsedData[p]){
            const bidders = [];
            for(const b in parsedData[p][device]) {
                const bidder = parsedData[p][device][b];
                bidders.push({
                    bidder: b,
                    params: {
                        ...bidder
                    }
                });
            }
            parsedData[p][device] = bidders;
        }

        const data = `const bids = ${JSON5.stringify(parsedData[p], null, '    ')};\n\nexport default bids;\n`;
        fs.writeFileSync(`${sheetDirPath}/${p}.ts`, data);
    }
}
