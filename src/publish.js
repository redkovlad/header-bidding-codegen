import { config } from 'dotenv';
import path  from 'path';
import fs from 'fs';
import { Projects, Adunits } from './types.js';

config();

if (!process.env.PATH_TO_PUBLIC) {
    throw new Error('Следует создать .env с полем PATH_TO_PUBLIC');
}

const __dirname = path.resolve();
const sheets = Object.keys(Projects);
let movedFilesTotal = 0;
let skippedFilesTotal = 0;

console.log('\nНачинаем копировать файлы...');

sheets.forEach(sheetName => {
    const localDir = `${__dirname}/build/${sheetName}`;
    const publicProject = Projects[sheetName];

    const publicDir = `${process.env.PATH_TO_PUBLIC}/src/projects/${publicProject}/creatives/adfoxBids`;

    if(!fs.existsSync(localDir)) {
        throw new Error(`ENOENT: no such directory ${publicDir}`);
    }

    if(!fs.existsSync(publicDir)) {
        throw new Error(`ENOENT: no such directory ${publicDir}`);
    }

    const files = fs.readdirSync(localDir);
    files.forEach(fileName => {
        if (!Adunits.includes(fileName.replace('.ts', ''))) {
            skippedFilesTotal += 1;
            return;
        }

        fs.copyFileSync(`${localDir}/${fileName}`, `${publicDir}/${fileName}`);
        movedFilesTotal += 1;
    });
});

console.log(
`Cкопированно файлов: ${movedFilesTotal},
Пропущено файлов: ${skippedFilesTotal},
Итого файлов: ${movedFilesTotal + skippedFilesTotal}`
);