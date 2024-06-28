"use strict";
let domain = ["a", "b", "c", "d"];
class Predicate {
    constructor(name, args) {
        this.name = name;
        this.arguments = args;
    }
    toString() {
        return `${this.name}(${this.arguments.join(", ")})`;
    }
    equals(other) {
        if (other instanceof Predicate) {
            if (this.arguments.toString() == other.arguments.toString() && this.name == other.name) {
                return true;
            }
        }
        return false;
    }
    replace(first, second) {
        let args = [];
        for (let arg of this.arguments) {
            if (arg == first) {
                args.push(second);
                continue;
            }
            args.push(arg);
        }
        return new Predicate(this.name, args);
    }
}
class Formula_Q {
    constructor(q, bound, formula) {
        this.quantifer = q;
        this.bound = bound;
        this.formula = formula;
    }
    toString() {
        let q = this.quantifer == "A" ? "∀" : "∃";
        return `${q}${this.bound}(${this.formula.toString()})`;
    }
    equals(other) {
        if (other instanceof Formula_Q) {
            if (this.quantifer == other.quantifer && this.bound == other.bound && this.formula.equals(other.formula)) {
                return true;
            }
        }
        return false;
    }
}
class Formula_N {
    constructor(P) {
        this.P = P;
    }
    toString() {
        return `¬(${this.P.toString()})`;
    }
    equals(other) {
        if (other instanceof Formula_N) {
            if (this.P.equals(other)) {
                return true;
            }
        }
        return false;
    }
}
class Formula_I {
    constructor(P, Q) {
        this.P = P;
        this.Q = Q;
    }
    toString() {
        return `${this.P.toString()} → ${this.Q.toString()}`;
    }
    equals(other) {
        if (other instanceof Formula_I) {
            if (this.P.equals(other)) {
                return true;
            }
        }
        return false;
    }
}
function F_And(P, Q) {
    return new Formula_N(new Formula_I(P, new Formula_N(Q)));
}
function F_Or(P, Q) {
    return new Formula_I(new Formula_N(P), Q);
}
class F_Sequent {
    constructor() {
        this.gamma = [];
        this.delta = [];
        this.justification = [];
    }
    validate() {
        return true;
    }
    without(list, phi) {
        let out = [];
        for (let psi of list) {
            if (!psi.equals(phi)) {
                out.push(psi);
            }
        }
        return out;
    }
    possible() {
        let poss = [];
        for (let phi of this.delta) {
            if (phi instanceof Formula_N) {
                let seq = new F_Sequent();
                seq.gamma = [...this.gamma, phi.P];
                seq.delta = this.without(this.delta, phi);
                poss.push([[seq], "⇒¬"]);
            }
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
            if (phi instanceof Formula_N) {
                let seq = new F_Sequent();
                seq.delta = [...this.delta, phi.P];
                seq.gamma = this.without(this.gamma, phi);
                poss.push([[seq], "¬⇒"]);
            }
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
            if (phi instanceof Formula_Q) {
                let seq = new F_Sequent();
                if (phi.quantifer == "A") {
                    seq.delta = this.delta;
                    seq.gamma = this.without(this.gamma, phi);
                }
            }
        }
        return poss;
    }
}
let p1 = new Formula_Q("A", "x", new Formula_I(new Predicate("H", ["x"]), new Predicate("M", ["x"])));
let p2 = new Predicate("H", ["s", "s"]);
let c = new Predicate("M", ["s"]);
let arg = new F_Sequent();
arg.gamma = [
    p1,
    p2
];
arg.delta = [
    c
];
console.log(p2.replace("s", "b"));
