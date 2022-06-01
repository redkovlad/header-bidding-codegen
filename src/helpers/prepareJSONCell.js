export default function prepareJSONCell (cell) {
    // Если форматирование строки сменят я за себя не отвечаю
    // А формат был такой:
    // p1: 'cuhgb', p2: 'ul'
    const JSONString = cell.split(',').map(l => {
        const line = l.trim();
        let [prop, ...value] = line.split(':');
        prop = `"${prop}"`;
        value = value.join('').replace(/'/g, '"');
        return `${prop}: ${value}`
    }).join(', ');
    return JSON.parse(`{${JSONString}}`);
}