"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.getExprFromTokens = exports.getTokenFor = exports.Expr = exports.Close = exports.Open = exports.UnaryOperator = exports.Operator = exports.Variable = exports.Token = void 0;
class Token {
}
exports.Token = Token;
class Variable extends Token {
    constructor(name) {
        super();
        this.name = name;
    }
    static find(stack, tokens, offset) {
        if (tokens[offset + 1] instanceof Variable) {
            return [tokens[offset + 1], offset + 1];
        }
        return undefined;
    }
}
exports.Variable = Variable;
class Operator extends Token {
    constructor(name) {
        super();
        this.operation = name;
    }
    static find(stack, tokens, offset) {
        if (tokens[offset + 1] instanceof Operator) {
            return [tokens[offset + 1], offset + 1];
        }
        return undefined;
    }
    static getEvaluationFor(first, second, operation) {
        if (operation == "∧") {
            return first && second;
        }
        if (operation == "∨") {
            return first || second;
        }
        if (operation == "⇒") {
            return (!first) || second;
        }
        if (operation == "≡") {
            return ((!first) || second) && ((!second) || first);
        }
        if (operation == "⊕") {
            return (first || second) && (!(first && second));
        }
    }
}
exports.Operator = Operator;
class UnaryOperator extends Token {
    constructor(name) {
        super();
        this.operation = name;
    }
    static find(stack, tokens, offset) {
        if (tokens[offset + 1] instanceof UnaryOperator) {
            return [tokens[offset + 1], offset + 1];
        }
        return undefined;
    }
}
exports.UnaryOperator = UnaryOperator;
class Open extends Token {
    constructor() {
        super();
    }
    static find(stack, tokens, offset) {
        if (tokens[offset + 1] instanceof Open) {
            return [tokens[offset + 1], offset + 1];
        }
        return undefined;
    }
}
exports.Open = Open;
class Close extends Token {
    constructor() {
        super();
    }
    static find(stack, tokens, offset) {
        if (tokens[offset + 1] instanceof Close) {
            return [tokens[offset + 1], offset + 1];
        }
        return undefined;
    }
}
exports.Close = Close;
class Expr extends Token {
    constructor(value) {
        super();
        this.myPath = [];
        this.value = value;
    }
    stringify() {
        if (this.isOfPath([Variable])) {
            let variable = this.value[0];
            return variable.name;
        }
        if (this.isOfPath([UnaryOperator, Expr])) {
            let expr = this.value[1];
            return "¬" + expr.stringify();
        }
        if (this.isOfPath([Expr, Operator, Expr])) {
            let expr1 = this.value[0];
            let expr2 = this.value[2];
            let oper = this.value[1];
            return `${expr1.stringify()} ${oper.operation} ${expr2.stringify()}`;
        }
        if (this.isOfPath([Open, Expr, Close])) {
            let expr = this.value[1];
            return "(" + expr.stringify() + ")";
        }
    }
    isOfPath(path) {
        for (let i = 0; i < this.myPath.length; i++) {
            if (this.myPath[i].name != path[i].name) {
                return false;
            }
        }
        return true;
    }
    eval(truthValues) {
        if (this.isOfPath([Variable])) {
            let variable = this.value[0];
            if (truthValues.has(variable.name)) {
                return truthValues.get(variable.name);
            }
            else {
                throw Error("Variable is not given truth value.");
            }
        }
        if (this.isOfPath([UnaryOperator, Expr])) {
            let expr = this.value[1];
            return (!(expr.eval(truthValues)));
        }
        if (this.isOfPath([Expr, Operator, Expr])) {
            let expr1 = this.value[0];
            let expr2 = this.value[2];
            let oper = this.value[1];
            return Operator.getEvaluationFor(expr1.eval(truthValues), expr2.eval(truthValues), oper.operation);
        }
        if (this.isOfPath([Open, Expr, Close])) {
            let expr = this.value[1];
            return expr.eval(truthValues);
        }
    }
    static find(stack, tokens, offset) {
        for (const path of Expr.paths) {
            if (stack.length > 0) {
                if (stack[stack.length - 1][0].name == path[0].name) {
                    continue;
                }
                if (stack[stack.length - 1][0].name == "UnaryOperator" && path[0].name == "Expr") {
                    continue;
                }
            }
            let now = [];
            Object.assign(now, stack);
            let searchValue = [];
            let off = offset;
            let success = true;
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
                let ret = new Expr(searchValue);
                ret.myPath = path;
                return [ret, off];
            }
        }
        return undefined;
    }
}
exports.Expr = Expr;
Expr.paths = [
    [Expr, Operator, Expr],
    [UnaryOperator, Expr],
    [Open, Expr, Close],
    [Variable]
];
function getTokenFor(input) {
    let map = new Map();
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
exports.getTokenFor = getTokenFor;
function getExprFromTokens(tokens) {
    let ret = Expr.find([], tokens, -1);
    if (ret == undefined) {
        return undefined;
    }
    if (ret[1] != (tokens.length - 1)) {
        let tryAgain = [];
        let remainingTokens = tokens.splice(ret[1] + 1);
        tryAgain.push(new Open());
        tryAgain.push(...tokens.slice(0, ret[1] + 1));
        tryAgain.push(new Close());
        tryAgain.push(...remainingTokens);
        return getExprFromTokens(tryAgain);
    }
    return ret[0];
}
exports.getExprFromTokens = getExprFromTokens;
function tokenize(input) {
    input += " ";
    let madeWord = "";
    let tokens = [];
    let append = [];
    for (const char of input) {
        if (char == " ") {
            if (madeWord == "") {
                continue;
            }
            let variable = new Variable(madeWord);
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
            }
            else {
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
exports.tokenize = tokenize;
