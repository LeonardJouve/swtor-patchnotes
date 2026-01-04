import {writeFileSync} from "node:fs";
import {JSDOM} from "jsdom";

type Patch = {
    id: number;
    url: string;
    date: Date|null;
    name: string;
};

type Node = string|{
    title: string;
    content: Node[];
};

const getPatchesList = async (): Promise<Patch[]> => {
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
            name: node.textContent,
        };
    });

    return list;
};

const parsePatch = async (patch: Patch) => {
    const dom = await JSDOM.fromURL(patch.url);
    const {document} = dom.window;

    const title = document.querySelector(".pageContainer .mainTitle")?.textContent;
    if (!title) {
        throw new Error("could not parse title");
    }

    const body = document.querySelectorAll("#mainContent #contentPad > *");

    let currentSection = "";
    const content = Array.from(body).reduce<Record<string, Node[]>>((acc, element) => {
        switch (element.tagName) {
        case "H2":
        case "H3":
        case "H4": {
            const header = element.querySelector("strong:only-child")?.textContent ?? element.textContent;
            currentSection = header;
            break;
        }
        case "P": {
            const header = element.querySelector("strong:only-child")?.textContent;
            if (header) {
                currentSection = header;
                break;
            }

            // otherwise fallthrough
        }
        default:
            if (!(currentSection in acc)) {
                acc[currentSection] = [];
            }
            acc[currentSection].push(parseContent(element));
            break;
        }

        return acc;
    }, {});

    const node = {
        title,
        content: Object.entries(content).map(([title, content]) => ({
            title,
            content,
        })),
    };

    return {
        patch,
        node,
    };
};

const parseContent = (node: Element): Node => {
    if (!node.children.length) {
        return node.textContent;
    }

    return {
        title: node.textContent,
        content: Array.from(node.children).map(parseContent),
    };
};

getPatchesList()
    .then((list) => Promise.all(list.map(parsePatch)))
    .then((result) => writeFileSync("dump.json", JSON.stringify(result, null, 4)));
