import {getPatchesList, parsePatch} from "./patch";
import {formatCSV, write} from "./format";

getPatchesList()
    .then((list) => Promise.all(list.map(async (patch) => ({
        patch,
        tree: await parsePatch(patch.url),
    }))))
    .then((result) => result
        .flatMap(({patch, tree}) => tree.map((node) => formatCSV(patch, node)))
        .join("\n"))
    .then(write("dump.json"));
