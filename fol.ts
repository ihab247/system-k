type wff = Predicate | Formula_Q | Formula_N | Formula_I;
type quantifer = "A" | "E";
type rule = "→⇒" | "¬⇒" | "⇒¬" | "⇒→" | "∀L" | "∀R" | "∃L" | "∃R" | undefined;

let domain: Array<string> = ["a", "b", "c", "d"];

class Predicate {
  name: string;
  arguments: Array<string>;

  constructor(name: string, args: Array<string>) {
    this.name = name;
    this.arguments = args;
  }

  toString(): string {
    return `${this.name}(${this.arguments.join(", ")})`;
  }

  equals(other: wff) {
    if (other instanceof Predicate) {
      if (this.arguments.toString() == other.arguments.toString() && this.name == other.name) {
        return true;
      }
    }
    return false;
  }

  // TODO MANY WAYS TO REPLACE 
  replace(first: string, second: string): wff {
    let args: Array<string> = [];
    for (let arg of this.arguments) {
      if (arg == first) {
        args.push(second);
        continue;
      }
      args.push(arg)
    }
    return new Predicate(this.name, args);
  }
}

class Formula_Q {
  quantifer: "A" | "E";
  bound: string;
  formula: wff;

  constructor(q: quantifer, bound: string, formula: wff) {
    this.quantifer = q;
    this.bound = bound;
    this.formula = formula;
  }

  toString(): string {
    let q = this.quantifer == "A" ? "∀" : "∃";
    return `${q}${this.bound}(${this.formula.toString()})`;
  }

  equals(other: wff) {
    if (other instanceof Formula_Q) {
      if (this.quantifer == other.quantifer && this.bound == other.bound && this.formula.equals(other.formula)) {
        return true;
      }
    }
    return false;
  }

  // replace(first: string, second: string): wff {

  // }

}

class Formula_N {
  P: wff;

  constructor(P: wff) {
    this.P = P;
  }

  toString(): string {
    return `¬(${this.P.toString()})`;
  }

  equals(other: wff) {
    if (other instanceof Formula_N) {
      if (this.P.equals(other)) {
        return true;
      }
    }
    return false;
  }

  // replace(first: string, second: string): wff {

  // }

}

class Formula_I {
  P: wff;
  Q: wff;

  constructor(P: wff, Q: wff) {
    this.P = P;
    this.Q = Q;
  }

  toString(): string {
    return `${this.P.toString()} → ${this.Q.toString()}`;
  }

  equals(other: wff) {
    if (other instanceof Formula_I) {
      if (this.P.equals(other)) {
        return true;
      }
    }
    return false;
  }

  // replace(first: string, second: string): wff {

  // }

}

function F_And(
  P: Predicate | Formula_Q | Formula_I | Formula_N,
  Q: Predicate | Formula_Q | Formula_I | Formula_N
): Formula_N {
  return new Formula_N(new Formula_I(P, new Formula_N(Q)));
}

function F_Or(
  P: Predicate | Formula_Q | Formula_I | Formula_N,
  Q: Predicate | Formula_Q | Formula_I | Formula_N
): Formula_I {
  return new Formula_I(new Formula_N(P), Q);
}

class F_Sequent {
  gamma: Array<wff> = [];
  delta: Array<wff> = [];
  justification: Array<Sequent> = [];

  validate(): boolean {
    return true;
  }

  without(list: Array<wff>, phi: wff) {
    let out: Array<wff> = [];
    for (let psi of list) {
      if (!psi.equals(phi)) {
        out.push(psi);
      } 
    }
    return out;
  }

  // depthProve(indent: number = 0): string {

  // }

  // toString(): string {
  //   return `${this.gamma.join(", ")} ⇒ ${this.delta.join(",")}`;
  // }

  // isAxiom(): boolean {

  // }

  possible(): Array<[Array<F_Sequent>, rule]> {
    let poss: Array<[Array<F_Sequent>, rule]> = [];

    for (let phi of this.delta) {
      // =>~
      if (phi instanceof Formula_N) {
        let seq = new F_Sequent();
        seq.gamma = [...this.gamma, phi.P];
        seq.delta = this.without(this.delta, phi);
        poss.push([[seq], "⇒¬"]);
      }

      // =>->
      if (phi instanceof Formula_I) {
        let p = phi.P;
        let q = phi.Q;

        let seq = new F_Sequent();
        seq.gamma = [...this.gamma, p];
        seq.delta = this.without(this.delta, phi);
        seq.delta.push(q);

        poss.push([[seq], "⇒→"]);
      }

    }

    for (let phi of this.gamma) {
      // ~=>
      if (phi instanceof Formula_N) {
        let seq = new F_Sequent();
        seq.delta = [...this.delta, phi.P];
        seq.gamma = this.without(this.gamma, phi);
        poss.push([[seq], "¬⇒"]);
      }

      // ->=>
      if (phi instanceof Formula_I) {
        let p = phi.P;
        let q = phi.Q;

        let seq1 = new F_Sequent();
        seq1.delta = [...this.delta, p];
        seq1.gamma = this.without(this.gamma, phi);

        let seq2 = new F_Sequent();
        seq2.delta = [...this.delta];
        seq2.gamma = this.without(this.gamma, phi);
        seq2.gamma.push(q);

        poss.push([[seq1, seq2], "→⇒"]);
      }

      // AL and EL
      if (phi instanceof Formula_Q) {
        let seq = new F_Sequent();
        if (phi.quantifer == "A") {
          seq.delta = this.delta;
          seq.gamma = this.without(this.gamma, phi);
          // TODO: seq.gamma.push(phi.formula.replace("t"));
        }
      }

    }

    return poss;
  }
}

let p1 = new Formula_Q(
  "A",
  "x",
  new Formula_I(new Predicate("H", ["x"]), new Predicate("M", ["x"]))
);
let p2 = new Predicate("H", ["s", "s"]);
let c = new Predicate("M", ["s"]);

let arg = new F_Sequent();

arg.gamma = [
  p1,
  p2
]

arg.delta = [
  c
]

console.log(p2.replace("s", "b"));
