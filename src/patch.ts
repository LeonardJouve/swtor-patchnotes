import {JSDOM} from "jsdom";
import Node from "./node";
import Parser from "./parser";

export type Patch = {
    id: number;
    url: string;
    date: Date|null;
    name: string;
};

export const getPatchesList = async (): Promise<Patch[]> => {
    const dom = await JSDOM.fromURL("https://www.swtor.com/patchnotes");
    const {document} = dom.window;
    const menu = document.querySelector("#rightSideContent .menu");
    if (!menu) {
        throw new Error("could not find menu element");
    }

    const nodes = menu.querySelectorAll("li > a") as NodeListOf<HTMLAnchorElement>;

    const DATE_REGEXP = new RegExp("(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})");
    const list = Array.from(nodes).map((node, i) => {
        const result = node.textContent.match(DATE_REGEXP);
        const date = result?.[1];

        return {
            id: nodes.length - i,
            url: node.href,
            date: date ? new Date(date) : null,
            name: node.textContent.trim(),
        };
    });

    return list;
};

export const parsePatch = async (url: string) => {
    const dom = await JSDOM.fromURL(url);
    const {document} = dom.window;

    // TODO
    const title = document.querySelector(".pageContainer .mainTitle")?.textContent;
    if (!title) {
        throw new Error("could not parse title");
    }

    const body = Array.from(document.querySelectorAll("#mainContent #contentPad > *"));

    const normalizedBody = body.map(Node.normalize);
    const parser = new Parser(normalizedBody);

    return parser.parseAll();
};
