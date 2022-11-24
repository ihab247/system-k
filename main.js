"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
class Sentence {
    constructor(name) {
        this.name = name;
    }
    toString() {
        return this.name;
    }
    equals(other) {
        if (!(other instanceof Sentence)) {
            return false;
        }
        return other.name == this.name;
    }
}
class Sentence_I {
    constructor(P, Q) {
        this.P = P;
        this.Q = Q;
    }
    toString() {
        return `(${this.P.toString()} → ${this.Q.toString()})`;
    }
    equals(other) {
        if (!(other instanceof Sentence_I)) {
            return false;
        }
        return this.P.equals(other.P) && this.Q.equals(other.Q);
    }
}
class Sentence_N {
    constructor(P) {
        this.P = P;
    }
    toString() {
        return `¬(${this.P.toString()})`;
    }
    equals(other) {
        if (!(other instanceof Sentence_N)) {
            return false;
        }
        return other.P.equals(this.P);
    }
}
class Sequent {
    constructor() {
        this.gamma = [];
        this.delta = [];
        this.justification = [];
    }
    depthProve(indent = 0) {
        let out = "";
        out += `${"\t".repeat(indent)}----------------------------------------`;
        console.log(`${"\t".repeat(indent)}----------------------------------------`);
        let iter = this.possible();
        if (iter.length == 0) {
            console.log("COULD NOT PROVE!");
            return "COULD NOT PROVE";
        }
        let poss = iter[0][0];
        for (let seq of poss) {
            console.log(`${"\t".repeat(indent)}${seq.toString()} (${iter[0][1]})`);
            out += `${"\t".repeat(indent)}${seq.toString()} (${iter[0][1]})`;
            if (!seq.isAxiom()) {
                out += seq.depthProve(indent + 1);
            }
            this.justification.push(seq);
        }
        return out;
    }
    breadthProve() {
    }
    toString() {
        return `${this.gamma.join(", ")} ⇒ ${this.delta.join(",")}`;
    }
    isAxiom() {
        for (let i = 0; i < this.gamma.length; i++) {
            for (let j = 0; j < this.delta.length; j++) {
                if (this.gamma[i].toString() == this.delta[j].toString()) {
                    return true;
                }
            }
        }
        return false;
    }
    possible() {
        let poss = [];
        for (let phi of this.delta) {
            if (phi instanceof Sentence_N) {
                let seq = new Sequent();
                seq.gamma = [...this.gamma, phi.P];
                seq.delta = [];
                for (let psi of this.delta) {
                    if (!phi.equals(psi)) {
                        seq.delta.push(psi);
                    }
                }
                poss.push([[seq], "⇒¬"]);
            }
            if (phi instanceof Sentence_I) {
                let p = phi.P;
                let q = phi.Q;
                let seq = new Sequent();
                seq.gamma = [...this.gamma, p];
                seq.delta = [];
                for (let psi of this.delta) {
                    if (!phi.equals(psi)) {
                        seq.delta.push(psi);
                    }
                }
                seq.delta.push(q);
                poss.push([[seq], "⇒→"]);
            }
        }
        if (poss.length > 0) {
            return poss;
        }
        for (let phi of this.gamma) {
            if (phi instanceof Sentence_N) {
                let seq = new Sequent();
                seq.delta = [...this.delta, phi.P];
                seq.gamma = [];
                for (let psi of this.gamma) {
                    if (!phi.equals(psi)) {
                        seq.gamma.push(psi);
                    }
                }
                poss.push([[seq], "¬⇒"]);
            }
            if (phi instanceof Sentence_I) {
                let p = phi.P;
                let q = phi.Q;
                let seq1 = new Sequent();
                seq1.delta = [...this.delta, p];
                seq1.gamma = [];
                for (let psi of this.gamma) {
                    if (!phi.equals(psi)) {
                        seq1.gamma.push(psi);
                    }
                }
                let seq2 = new Sequent();
                seq2.delta = [...this.delta];
                seq2.gamma = [q];
                for (let psi of this.gamma) {
                    if (!phi.equals(psi)) {
                        seq2.gamma.push(psi);
                    }
                }
                poss.push([[seq1, seq2], "→⇒"]);
            }
        }
        return poss;
    }
}
function And(P, Q) {
    return new Sentence_N(new Sentence_I(P, new Sentence_N(Q)));
}
function Or(P, Q) {
    return new Sentence_I(new Sentence_N(P), Q);
}
function fromParserExpression(expr) {
    if (expr.isOfPath([parser_1.Expr, parser_1.Operator, parser_1.Expr])) {
        let first = fromParserExpression(expr.value[0]);
        let second = fromParserExpression(expr.value[2]);
        let op = expr.value[1];
        if (op.operation === "∧") {
            return And(first, second);
        }
        if (op.operation === "∨") {
            return Or(first, second);
        }
        if (op.operation === "⇒") {
            return new Sentence_I(first, second);
        }
    }
    if (expr.isOfPath([parser_1.Open, parser_1.Expr, parser_1.Close])) {
        let first = fromParserExpression(expr.value[1]);
        return first;
    }
    if (expr.isOfPath([parser_1.UnaryOperator, parser_1.Expr])) {
        let first = fromParserExpression(expr.value[1]);
        return new Sentence_N(first);
    }
    if (expr.isOfPath([parser_1.Variable])) {
        let first = expr.value[0].name;
        return new Sentence(first);
    }
    return new Sentence("DEFAULT");
}
let input = "(p => (r => s)) => ((p => r) => (p => s))";
let expr = (0, parser_1.getExprFromTokens)((0, parser_1.tokenize)(input));
let test = fromParserExpression(expr);
let base = new Sequent();
base.gamma = [];
base.delta = [
    test
];
console.log(base.toString());
base.depthProve();
