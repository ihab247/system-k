
import { getExprFromTokens, tokenize, Expr, Operator, Open, Close, UnaryOperator, Variable } from "./parser";

class Sentence {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  toString(): string {
    return this.name;
  }

  equals(other: Sentence | Sentence_I | Sentence_N): boolean {
    if (!(other instanceof Sentence)) {
      return false;
    }
    return other.name == this.name;
  }
}

class Sentence_I {
  P!: Sentence | Sentence_I | Sentence_N;
  Q!: Sentence | Sentence_I | Sentence_N;

  constructor(
    P: Sentence | Sentence_I | Sentence_N,
    Q: Sentence | Sentence_I | Sentence_N
  ) {
    this.P = P;
    this.Q = Q;
  }

  toString(): string {
    return `(${this.P.toString()} → ${this.Q.toString()})`;
  }

  equals(other: Sentence_I | Sentence | Sentence_N): boolean {
    if (!(other instanceof Sentence_I)) {
      return false;
    }
    return this.P.equals(other.P) && this.Q.equals(other.Q);
  }
}

class Sentence_N {
  P!: Sentence | Sentence_I | Sentence_N;

  constructor(P: Sentence | Sentence_I | Sentence_N) {
    this.P = P;
  }

  toString(): string {
    return `¬(${this.P.toString()})`;
  }

  equals(other: Sentence_N | Sentence | Sentence_I): boolean {
    if (!(other instanceof Sentence_N)) {
      return false;
    }
    return other.P.equals(this.P);
  }
}

class Sequent {
  gamma: Array<Sentence | Sentence_I | Sentence_N> = [];
  delta: Array<Sentence | Sentence_I | Sentence_N> = [];
  justification: Array<Sequent> = [];

  depthProve(indent: number = 0): string {
    let out: string = "";
    out += `${"\t".repeat(indent)}----------------------------------------`;
    console.log(
      `${"\t".repeat(indent)}----------------------------------------`
    );
    let iter = this.possible();
    if (iter.length == 0) {
      console.log("COULD NOT PROVE!");
      return "COULD NOT PROVE";
    }
    let poss = iter[0][0]; // depth // pick the first possibility and stick to it
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
    // TODO: this will find the shortest proof.
  }

  toString(): string {
    return `${this.gamma.join(", ")} ⇒ ${this.delta.join(",")}`;
  }

  isAxiom(): boolean {
    // if (this.gamma.length == 0) {
    //   return true;
    // }
    for (let i = 0; i < this.gamma.length; i++) {
      for (let j = 0; j < this.delta.length; j++) {
        if (this.gamma[i].toString() == this.delta[j].toString()) {
          return true;
        }
      }
    }
    return false;
  }

  possible(): Array<[Array<Sequent>, "→⇒" | "¬⇒" | "⇒¬" | "⇒→" | undefined]> {
    let poss: Array<[Array<Sequent>, "→⇒" | "¬⇒" | "⇒¬" | "⇒→" | undefined]> =
      [];

    // first check if all sentences in delta are atomic sentences and apply =>~ or =>->

    for (let phi of this.delta) {
      // =>~
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

      // =>->

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

    // now use all possible ~=> or ->=>

    for (let phi of this.gamma) {
      // ~=>
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

      // ->=>
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

function And(
  P: Sentence | Sentence_I | Sentence_N,
  Q: Sentence | Sentence_I | Sentence_N
): Sentence_N {
  return new Sentence_N(new Sentence_I(P, new Sentence_N(Q)));
}

function Or(
  P: Sentence | Sentence_I | Sentence_N,
  Q: Sentence | Sentence_I | Sentence_N
): Sentence_I {
  return new Sentence_I(new Sentence_N(P), Q);
}

function fromParserExpression(expr: Expr): Sentence | Sentence_I | Sentence_N {
	if (expr.isOfPath([Expr, Operator, Expr])) {
		let first = fromParserExpression(expr.value[0] as Expr);
		let second = fromParserExpression(expr.value[2] as Expr);
		let op = expr.value[1] as Operator;
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
	if (expr.isOfPath([Open, Expr, Close])) {
		let first = fromParserExpression(expr.value[1] as Expr);
		return first;
	}
	if (expr.isOfPath([UnaryOperator, Expr])) {
		let first = fromParserExpression(expr.value[1] as Expr);
		return new Sentence_N(first);
	}
	if (expr.isOfPath([Variable])) {
		let first = expr.value[0].name;
		return new Sentence(first);
	}
	return new Sentence("DEFAULT");
}

let input: string = "(p => (r => s)) => ((p => r) => (p => s))";
let expr: Expr = getExprFromTokens(tokenize(input)) as Expr;
let test = fromParserExpression(expr);

let base: Sequent = new Sequent();

base.gamma = [

];

base.delta = [
	test
];

console.log(base.toString());
base.depthProve();