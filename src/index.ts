import {parsePatch, Patch} from "./patch";
import {formatJSON, write} from "./format";

parsePatch({url: "https://www.swtor.com/patchnotes/1.1.0/rise-rakghouls"} as Patch)
    .then(formatJSON)
    .then(write("dump.json"));

// getPatchesList()
//     .then((list) => Promise.all(list.filter(({id}) => id <= 165).map(parsePatch)))
//     .then((result) => writeFileSync("dump.json", JSON.stringify(result, null, 4)));

// const parseElement = (rest: Element[]): {result: Test; rest: Element[]} => {
//     let i = 0;
//     const element = rest[i++];

//     if (isHeader(element)) {
//         if (i < rest.length && isHeader(rest[i])) {
//             const result = parseElement(rest.slice(i));
//             return {
//                 result: {
//                     header: getTextContent(element),
//                     content: [result.result],
//                 },
//                 rest: result.rest,
//             }
//         } else {
//             let j = i;
//             while (j < rest.length && !isHeader(rest[j])) ++j;

//             return {
//                 result: {
//                     header: getTextContent(element),
//                     content: process([...element.children, ...rest.slice(i, j)]),
//                 },
//                 rest: rest.slice(j),
//             };
//         }
//     }

//     if (!element.children.length) {
//         return {
//             result: element.textContent.trim(),
//             rest: rest.slice(i),
//         };
//     }

//     let j = i;
//     while (j < rest.length && !isHeader(rest[j])) ++j;

//     return {
//         result: {
//             header: "",
//             content: [getTextContent(element), ...process([...element.children, ...rest.slice(i, j)])],
//         },
//         rest: rest.slice(j),
//     };
// };

// const process = (elements: Element[]) => {
//     const result = [];
//     let rest = [...elements];
//     while (rest.length) {
//         const parse = parseElement(rest);
//         rest = parse.rest;
//         result.push(parse.result);
//     }

//     return result;
// };

// const normalize = (node: Test): Test|null => {
//     if (typeof node === "string") {
//         return node.trim() || null;
//     }

//     const normalizedContent = node.content
//         .map(normalize)
//         .filter(Boolean) as Test[];

//     const [firstChild] = normalizedContent;
//     if (firstChild && typeof firstChild !== "string" && !firstChild.header) {
//         return {
//             header: node.header,
//             content: firstChild.content,
//         };
//     }

//     let skipNext = false;
//     const content = normalizedContent.reduce<Test[]>((acc, child, i, self) => {
//             if (skipNext) {
//                 skipNext = false;
//                 return acc;
//             }

//             const next = self[i + 1];
//             if (typeof child === "string" && typeof next === "object" && !next.header) {
//                 skipNext = true;
//                 acc.push({
//                     header: child,
//                     content: next.content,
//                 });

//                 return acc;
//             }

//             acc.push(child);

//             return acc;
//         }, []);

//     return {
//         header: node.header,
//         content,
//     };
// };


// const isHeader = (element: Element) => {
//     switch (element.tagName) {
//         case "H1":
//         case "H2":
//         case "H3":
//         case "H4":
//         case "H5":
//         case "H6":
//             return true;
//         case "P":
//             return !getTextContent(element) && element.querySelector("strong:only-child") !== null;
//         default:
//             return false;
//     }
// };


// const getTextContent = (element: Element) => Array.from(element.childNodes)
//     .filter(({nodeType}) => nodeType === NodeType.TEXT)
//     .map(({textContent}) => textContent)
//     .join("")
//     .trim();
