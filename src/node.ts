enum NodeType {
    ELEMENT = 1,
    TEXT = 3,
}

export default class Node {
    text: string;
    tag: null|string;
    children: Node[];

    constructor(text: string, tag: null|string, children: Node[]) {
        this.text = text;
        this.tag = tag;
        this.children = children;
    }

    isHeader() {
        switch (this.tag) {
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
            return !this.children.length;
        default:
            return false;
        }
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

        if (normalizedChildren.length === 1) {
            const [{text, tag, children}] = normalizedChildren;
            return new Node(text, tag, children);
        }

        return new Node("", element.tagName, normalizedChildren);
    }
};
