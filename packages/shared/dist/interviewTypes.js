import { parse, stringify } from 'smol-toml';
// Parsers
export function parseInterviewConfig(toml) {
    return parse(toml);
}
export function stringifyInterviewResults(results) {
    return stringify(results);
}
