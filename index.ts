abstract class Token {
  public static paths: any[][];
  name: any;
}

class Variable extends Token {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  static find(
    stack: any[][],
    tokens: Token[],
    offset: number
  ): [Token, number] | undefined {
    if (tokens[offset + 1] instanceof Variable) {
      return [tokens[offset + 1], offset + 1];
    }
    return undefined;
  }
}

class Operator extends Token {
  operation: string;

  constructor(name: string) {
    super();
    this.operation = name;
  }

  static find(
    stack: any[][],
    tokens: Token[],
    offset: number
  ): [Token, number] | undefined {
    if (tokens[offset + 1] instanceof Operator) {
      return [tokens[offset + 1], offset + 1];
    }
    return undefined;
  }

  static getEvaluationFor(
    first: boolean,
    second: boolean,
    operation: string
  ): boolean | undefined {
    if (operation == "∧") {
      return first && second;
    }
    if (operation == "∨") {
      return first || second;
    }
    if (operation == "⇒") {
      return !first || second;
    }
    if (operation == "≡") {
      return (!first || second) && (!second || first);
    }
    if (operation == "⊕") {
      return (first || second) && !(first && second);
    }
  }
}

class UnaryOperator extends Token {
  operation: string;

  constructor(name: string) {
    super();
    this.operation = name;
  }

  static find(
    stack: any[][],
    tokens: Token[],
    offset: number
  ): [Token, number] | undefined {
    if (tokens[offset + 1] instanceof UnaryOperator) {
      return [tokens[offset + 1], offset + 1];
    }
    return undefined;
  }
}

class Open extends Token {
  constructor() {
    super();
  }

  static find(
    stack: any[][],
    tokens: Token[],
    offset: number
  ): [Token, number] | undefined {
    if (tokens[offset + 1] instanceof Open) {
      return [tokens[offset + 1], offset + 1];
    }
    return undefined;
  }
}

class Close extends Token {
  constructor() {
    super();
  }

  static find(
    stack: any[][],
    tokens: Token[],
    offset: number
  ): [Token, number] | undefined {
    if (tokens[offset + 1] instanceof Close) {
      return [tokens[offset + 1], offset + 1];
    }
    return undefined;
  }
}

class Expr extends Token {
  value: Token[];

  constructor(value: Token[]) {
    super();
    this.value = value;
  }

  public static paths: any[][] = [
    [Expr, Operator, Expr],
    [UnaryOperator, Expr],
    [Open, Expr, Close],
    [Variable],
  ];

  myPath: Token[] = [];

  stringify(): string | undefined {
    if (this.isOfPath([Variable])) {
      let variable: Variable = this.value[0];
      return variable.name;
    }
    if (this.isOfPath([UnaryOperator, Expr])) {
      let expr: Expr = this.value[1] as Expr;
      return "¬" + expr.stringify();
    }
    if (this.isOfPath([Expr, Operator, Expr])) {
      let expr1: Expr = this.value[0] as Expr;
      let expr2: Expr = this.value[2] as Expr;
      let oper: Operator = this.value[1] as Operator;
      return `${expr1.stringify()} ${oper.operation} ${expr2.stringify()}`;
    }
    if (this.isOfPath([Open, Expr, Close])) {
      let expr: Expr = this.value[1] as Expr;
      return "(" + expr.stringify() + ")";
    }
  }

  isOfPath(path: any[]): boolean {
    for (let i = 0; i < this.myPath.length; i++) {
      if (this.myPath[i].name != path[i].name) {
        return false;
      }
    }
    return true;
  }

  eval(truthValues: Map<string, boolean>): any {
    if (this.isOfPath([Variable])) {
      let variable: Variable = this.value[0];
      if (truthValues.has(variable.name)) {
        return truthValues.get(variable.name);
      } else {
        throw Error("Variable is not given truth value.");
      }
    }
    if (this.isOfPath([UnaryOperator, Expr])) {
      let expr: Expr = this.value[1] as Expr;
      return !expr.eval(truthValues);
    }
    if (this.isOfPath([Expr, Operator, Expr])) {
      let expr1: Expr = this.value[0] as Expr;
      let expr2: Expr = this.value[2] as Expr;
      let oper: Operator = this.value[1] as Operator;
      return Operator.getEvaluationFor(
        expr1.eval(truthValues),
        expr2.eval(truthValues),
        oper.operation
      );
    }
    if (this.isOfPath([Open, Expr, Close])) {
      let expr: Expr = this.value[1] as Expr;
      return expr.eval(truthValues);
    }
  }

  static find(
    stack: any[][],
    tokens: Token[],
    offset: number
  ): [Token, number] | undefined {
    for (const path of Expr.paths) {
      if (stack.length > 0) {
        if (stack[stack.length - 1][0].name == path[0].name) {
          continue;
        }
        if (
          stack[stack.length - 1][0].name == "UnaryOperator" &&
          path[0].name == "Expr"
        ) {
          continue;
        }
      }
      let now: any[][] = [];
      Object.assign(now, stack);
      let searchValue: Token[] = [];
      let off: number = offset;
      let success: boolean = true;
      now.push(path);
      for (const route of path) {
        let answer = route.find(now, tokens, off);
        if (answer == undefined) {
          success = false;
          break;
        }
        let ans = answer[0];
        let offs = answer[1];
        off = offs;
        searchValue.push(ans);
      }
      if (success) {
        let ret: Expr = new Expr(searchValue);
        ret.myPath = path;
        return [ret, off];
      }
    }
    return undefined;
  }
}

function getTokenFor(input: string): Token | undefined {
  let map: Map<string, Token> = new Map<string, Token>();
  map.set("(", new Open());
  map.set(")", new Close());
  map.set("[", new Open());
  map.set("]", new Close());
  map.set("{", new Open());
  map.set("}", new Close());

  map.set("&", new Operator("∧"));
  map.set("and", new Operator("∧"));
  map.set("AND", new Operator("∧"));
  map.set("^", new Operator("∧"));
  map.set(",", new Operator("∧"));

  map.set("OR", new Operator("∨"));
  map.set("or", new Operator("∨"));
  map.set("|", new Operator("∨"));

  map.set("XOR", new Operator("⊕"));
  map.set("xor", new Operator("⊕"));

  map.set("IMPLIES", new Operator("⇒"));
  map.set("implies", new Operator("⇒"));
  map.set("WHEN", new Operator("⇒"));
  map.set("IF", new Operator("⇒"));
  map.set("->", new Operator("⇒"));
  map.set("=>", new Operator("⇒"));

  map.set("<=>", new Operator("≡"));
  map.set("<->", new Operator("≡"));
  map.set("IFF", new Operator("≡"));

  map.set("~", new UnaryOperator("NOT"));
  map.set("NOT", new UnaryOperator("NOT"));
  map.set("not", new UnaryOperator("NOT"));
  map.set("!", new UnaryOperator("NOT"));

  return map.get(input);
}

function getExprFromTokens(tokens: Token[]): Expr | undefined {
  let ret = Expr.find([], tokens, -1);
  if (ret == undefined) {
    return undefined;
  }
  if (ret[1] != tokens.length - 1) {
    let tryAgain: Token[] = [];
    let remainingTokens: Token[] = tokens.splice(ret[1] + 1);

    tryAgain.push(new Open());
    tryAgain.push(...tokens.slice(0, ret[1] + 1));
    tryAgain.push(new Close());

    tryAgain.push(...remainingTokens);
    return getExprFromTokens(tryAgain);
  }
  return ret[0] as Expr;
}

function tokenize(input: string) {
  input += " ";
  let madeWord = "";
  let tokens: Token[] = [];
  let append: Token[] = [];
  for (const char of input) {
    if (char == " ") {
      if (madeWord == "") {
        continue;
      }
      let variable: Variable = new Variable(madeWord);
      tokens.push(variable);
      for (const token of append) {
        tokens.push(token);
      }
      append = [];
      madeWord = "";
      continue;
    }

    let charToken = getTokenFor(char);
    if (charToken != undefined) {
      if (charToken instanceof Close) {
        append.push(charToken);
      } else {
        tokens.push(charToken);
      }
      continue;
    }

    madeWord += char;
    let token = getTokenFor(madeWord);
    if (token != undefined) {
      tokens.push(token);
      madeWord = "";
    }
  }
  return tokens;
}

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
    out += `${"\t".repeat(indent)}----------------------------------------\n`;
    let iter = this.possible();
    if (iter.length == 0) {
      return "COULD NOT PROVE\n";
    }
    let poss = iter[0][0]; // depth // pick the first possibility and stick to it
    for (let seq of poss) {
      out += `${"\t".repeat(indent)}${seq.toString()} (${iter[0][1]})\n`;
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
    if (op.operation === "≡") {
      return And(new Sentence_I(first, second), new Sentence_I(second, first));
    }
    if (op.operation === "⊕") {
      return And(Or(first, second), new Sentence_N(And(first, second)));
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

// let input: string = "(p => (r => s)) => ((p => r) => (p => s))";
// let expr: Expr = getExprFromTokens(tokenize(input)) as Expr;
// let test = fromParserExpression(expr);

// let base: Sequent = new Sequent();

// base.gamma = [

// ];

// base.delta = [
// 	test
// ];

// console.log(base.toString());
// base.depthProve();

function update() {
  let input: HTMLInputElement = document.getElementById(
    "query"
  ) as HTMLInputElement;
  let output = document.getElementById("output");
  let expr = getExprFromTokens(tokenize(input.value));
  if (expr == undefined) {
    return;
  } else {
    let test = fromParserExpression(expr);
    let base: Sequent = new Sequent();
    base.delta = [test];
    let final: string = base.toString() + "\n" + base.depthProve();
    output!.textContent = final;
  }
}
