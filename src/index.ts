import {writeFileSync} from "node:fs";
import {JSDOM} from "jsdom";

type Patch = {
    id: number;
    url: string;
    date: Date|null;
    name: string;
};

// TODO normalize text element

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

const isHeader = (element: Element) => {
    switch (element.tagName) {
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
            return true;
        case "P":
            return !getTextContent(element) && element.querySelector("strong:only-child") !== null;
        default:
            return false;
    }
};

enum NodeType {
    ELEMENT = 1,
    TEXT = 3,
}

const getTextContent = (element: Element) => Array.from(element.childNodes)
    .filter(({nodeType}) => nodeType === NodeType.TEXT)
    .map(({textContent}) => textContent)
    .join("")
    .trim();

type Test = string|{
    header: string;
    content: Test[];
};

type Node = {
    text: string;
    tag: null|string;
    children: Node[];
};

const parseElement = (rest: Element[]): {result: Test; rest: Element[]} => {
    let i = 0;
    const element = rest[i++];

    if (isHeader(element)) {
        if (i < rest.length && isHeader(rest[i])) {
            const result = parseElement(rest.slice(i));
            return {
                result: {
                    header: getTextContent(element),
                    content: [result.result],
                },
                rest: result.rest,
            }
        } else {
            let j = i;
            while (j < rest.length && !isHeader(rest[j])) ++j;

            return {
                result: {
                    header: getTextContent(element),
                    content: process([...element.children, ...rest.slice(i, j)]),
                },
                rest: rest.slice(j),
            };
        }
    }

    if (!element.children.length) {
        return {
            result: element.textContent.trim(),
            rest: rest.slice(i),
        };
    }

    let j = i;
    while (j < rest.length && !isHeader(rest[j])) ++j;

    return {
        result: {
            header: "",
            content: [getTextContent(element), ...process([...element.children, ...rest.slice(i, j)])],
        },
        rest: rest.slice(j),
    };
};

const process = (elements: Element[]) => {
    const result = [];
    let rest = [...elements];
    while (rest.length) {
        const parse = parseElement(rest);
        rest = parse.rest;
        result.push(parse.result);
    }

    return result;
};

const normalize = (node: Test): Test|null => {
    if (typeof node === "string") {
        return node.trim() || null;
    }

    const normalizedContent = node.content
        .map(normalize)
        .filter(Boolean) as Test[];

    const [firstChild] = normalizedContent;
    if (firstChild && typeof firstChild !== "string" && !firstChild.header) {
        return {
            header: node.header,
            content: firstChild.content,
        };
    }

    let skipNext = false;
    const content = normalizedContent.reduce<Test[]>((acc, child, i, self) => {
            if (skipNext) {
                skipNext = false;
                return acc;
            }

            const next = self[i + 1];
            if (typeof child === "string" && typeof next === "object" && !next.header) {
                skipNext = true;
                acc.push({
                    header: child,
                    content: next.content,
                });

                return acc;
            }

            acc.push(child);

            return acc;
        }, []);

    return {
        header: node.header,
        content,
    };
};

const normalizeElement = (element: Element): Node => {
    const normalizedChildren = Array.from(element.childNodes)
        .map((node) => {
            switch (node.nodeType) {
            case NodeType.ELEMENT:
                return normalizeElement(node as Element);
            case NodeType.TEXT:
                return {
                    text: node.textContent!.trim(),
                    tag: null,
                    children: [],
                }
            default:
                throw new Error(`Unhandled node type: ${node.nodeType}`);
            }
        }).filter((child) => child.text || child.children.length);

    if (normalizedChildren.length === 1) {
        return {
            ...normalizedChildren[0],
            tag: element.tagName,
        };
    }

    return {
        text: "",
        tag: element.tagName,
        children: normalizedChildren,
    };
};

const parsePatch = async (patch: Patch) => {
    const dom = await JSDOM.fromURL(patch.url);
    const {document} = dom.window;

    const title = document.querySelector(".pageContainer .mainTitle")?.textContent;
    if (!title) {
        throw new Error("could not parse title");
    }

    const body = Array.from(document.querySelectorAll("#mainContent #contentPad > *"));

    const result = process(body);

    return body.map(normalizeElement);
};

// getPatchesList()
//     .then((list) => Promise.all(list.filter(({id}) => id <= 165).map(parsePatch)))
//     .then((result) => writeFileSync("dump.json", JSON.stringify(result, null, 4)));

parsePatch({url: "https://www.swtor.com/patchnotes/1.1.0/rise-rakghouls"} as Patch)
    .then((result) => writeFileSync("dump.json", JSON.stringify(result, null, 4)));

