import Node from "./node";

export type AbstractPatchTree = {
    header: string;
    content: AbstractPatchTree[];
};

export default class Parser {
    private i: number;
    private nodes: Node[];

    constructor(nodes: Node[]) {
        this.i = 0;
        this.nodes = nodes;
    }

    private isEmpty(): boolean {
        return this.i >= this.nodes.length;
    }

    private peekNode(): Node {
        return this.nodes[this.i];
    }

    private nextNode(): Node {
        return this.nodes[this.i++];
    }

    parseOne(): AbstractPatchTree {
        const node = this.nextNode();

        const childrenParser = new Parser(node.children);
        const content = childrenParser.parseAll();

        if (!this.isEmpty() && this.peekNode().tag === "UL") {
            content.push(this.parseOne());

            return {
                header: node.text,
                content,
            };
        }

        while (!this.isEmpty() && this.peekNode().getHeaderRank() < node.getHeaderRank()) {
            content.push(this.parseOne());
        }

        if (node.isHeader()) {
            return {
                header: node.text,
                content,
            };
        }

        if (node.text) {
            content.splice(0, 0, {
                header: node.text,
                content: [],
            });
        }

        if (content.length === 1) {
            return content[0];
        }

        return {
            header: "",
            content,
        };
    }

    parseAll(): AbstractPatchTree[] {
        const result: AbstractPatchTree[] = [];
        while (!this.isEmpty()) {
            result.push(this.parseOne());
        }

        return result;
    }
}
