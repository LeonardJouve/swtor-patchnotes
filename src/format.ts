import {writeFileSync} from "node:fs";

export const formatJSON = <T>(value: T) => JSON.stringify(value, null, 4);

export const write = (filename: string) => (content: string) => writeFileSync(filename, content, {encoding: "utf-8"});
