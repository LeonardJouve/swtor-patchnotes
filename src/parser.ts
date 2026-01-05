import Node from "./node";

type Test = string|{
    header: string;
    content: Test[];
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

    parseOne(): Test {
        const node = this.nextNode();

        if (node.isHeader()) {
            const peek = this.peekNode();
            if (!this.isEmpty() && peek.isHeader()) {
                const content = [...new Parser(node.children).parseAll(), this.parseOne()];

                return {
                    header: node.text,
                    content,
                };
            } else {
                const content = new Parser(node.children).parseAll();
                while (!this.isEmpty() && !this.peekNode()!.isHeader()) {
                    content.push(this.parseOne());
                }

                return {
                    header: node.text,
                    content,
                };
            }
        }

        const content = [node.text, ...new Parser(node.children).parseAll()];
        while (!this.isEmpty() && !this.peekNode()!.isHeader()) {
            content.push(this.parseOne());
        }

        return {
            header: "",
            content,
        };
    }

    parseAll(): Test[] {
        const result: Test[] = [];
        while (!this.isEmpty()) {
            result.push(this.parseOne());
        }

        return result;
    }
}
