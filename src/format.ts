import {writeFileSync} from "node:fs";
import {AbstractPatchTree} from "./parser";
import {Patch} from "./patch";

const COLUMN_SEPARATOR = "\t";
const HEADER_SEPARATOR = "<|>";

export const formatJSON = <T>(value: T) => JSON.stringify(value, null, 4);

export const formatCSVHeader = () => ["id", "headers", "claim", "name", "url", "date"].join(COLUMN_SEPARATOR);

export const formatCSV = (patch: Patch, tree: AbstractPatchTree, header = ""): string => {

    if (!tree.content.length) {
        const {id, name, url, date} = patch;
        return [id, header, tree.header, name, url, date].join(COLUMN_SEPARATOR);
    }

    const nodeHeader = tree.header.trim();
    if (nodeHeader) {
        if (header) {
            header += HEADER_SEPARATOR;
        }
        header += nodeHeader;
    }
    return tree.content
        .map((node) => formatCSV(patch, node, header))
        .join("\n");
};

export const write = (filename: string) => (content: string) => writeFileSync(filename, content, {encoding: "utf-8"});
