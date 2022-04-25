# header-bidding-codegen

## Установка
1. npm i
2. Создать в корне .env с переменной PATH_TO_PUBLIC, пример:
PATH_TO_PUBLIC="/home/user/reps/webapp-public"
3. Поместить в /assets/ xlsx-файл, назвать его bidders.xlsx

## Использование
* npm run build, которая состоит из:
    * npm run codegen - генерирует конфиги в /build
    * npm run publish - копирует файлы конфигов в проекты по пути PATH_TO_PUBLIC

Также в файле /src/types.js можно закомментить ненужные проекты, адъюниты, биддеров, codegen их пропустит.