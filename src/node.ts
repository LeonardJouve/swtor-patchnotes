enum NodeType {
    ELEMENT = 1,
    TEXT = 3,
}

export default class Node {
    private static HEADER_RANKS = ["H6", "H5", "H4", "H3", "H2"];
    text: string;
    tag: null|string;
    children: Node[];

    constructor(text: string, tag: null|string, children: Node[]) {
        this.text = text;
        this.tag = tag;
        this.children = children;
    }

    isHeader() {
        return !this.children.length && this.tag && Node.HEADER_RANKS.includes(this.tag);
    }

    getHeaderRank() {
        return this.tag ?
            Node.HEADER_RANKS.findIndex((tag) => this.tag === tag) :
            -1;
    }

    isInline() {
        return !this.children.length && [null, "SPAN", "I", "A", "B", "STRONG", "EM", "CODE"].includes(this.tag);
    }

    static normalize(element: Element): Node {
        const normalizedChildren = Array.from(element.childNodes)
            .map((node) => {
                switch (node.nodeType) {
                case NodeType.ELEMENT:
                    return Node.normalize(node as Element);
                case NodeType.TEXT:
                    return new Node(node.textContent!.trim(), null, []);
                default:
                    throw new Error(`Unhandled node type: ${node.nodeType}`);
                }
            }).filter((child) => child.text || child.children.length);

        // merge inline elements
        const mergedChildren: Node[] = [];
        for (let i = 0; i < normalizedChildren.length; ++i) {
            const child = normalizedChildren[i];
            if (child.isInline()) {
                while (normalizedChildren[i + 1]?.isInline()) {
                    child.text += " " + normalizedChildren[++i].text;
                }
            }

            mergedChildren.push(child);
        }

        if (mergedChildren.length === 1) {
            const [{text, children}] = mergedChildren;
            return new Node(text, element.tagName, children);
        }

        return new Node("", element.tagName, mergedChildren);
    }
};
