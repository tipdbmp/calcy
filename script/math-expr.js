var MathExpr = (function(){
    'use strict';

    var TokenType = {
        NONE:   0,
        EOF:    1,
        NUMBER: 2,
        LP:     3,
        RP:     4,
        OP_ADD: 5,
        OP_SUB: 6,
        OP_MUL: 7,
        OP_DIV: 8,
    };

    var Token = (function() {
        var traits = Object.create(Object.prototype);
        var proto  = Object.create(traits);

        traits.name_from_id = [
            'NONE', '<EOF>', 'NUMBER', 'LP', 'RP', 'OP_ADD', 'OP_MUL'
        ];

        proto.id = 1;
        proto.text = 'NONE';

        function toString() {
            var name = this.name_from_id[ token.type ];
            var text = this.text;
            return '<' + name + ", '" + text  + "'" + '>';
        }
        traits.toString = toString;

        function $new(args) {
            var token = Object.clone(proto);

            token.type = args.type;
            token.text = args.text;

            return token;
        }

        var Token = {
            traits: traits,
            proto: proto,
            $new: $new,
        };

        return Token;
    }());


    var Lexer = (function(TokenType, Token) {

        var traits = Object.create(Object.prototype);
        traits.re_digit = /[0-9]/;
        traits.re_ws    = /\s/;

        var proto  = Object.create(traits);
        proto.text = '';
        proto.cp   = 0;
        proto.c    = '';

        function consume() {
            this.cp++;
            this.c = this.text.substr(this.cp, 1);
        }
        traits.consume = consume;

        function next_token() {

            NEXT_TOKEN:
            while (this.c !== '') {
                switch (this.c) {

                case ' ': case "\t": case "\r": case "\n": {
                    this.ws();
                    continue NEXT_TOKEN;
                }

                case '(': {
                    this.consume();
                    return Token.$new({ type: TokenType.LP, text: '(' });
                }
                case ')': {
                    this.consume();
                    return Token.$new({ type: TokenType.RP, text: ')' });
                }

                case '+': {
                    this.consume();
                    return Token.$new({ type: TokenType.OP_ADD, text: '+' });
                }
                case '-': {
                    this.consume();
                    return Token.$new({ type: TokenType.OP_SUB, text: '-' });
                }

                case '*': {
                    this.consume();
                    return Token.$new({ type: TokenType.OP_MUL, text: '*' });
                }
                case '/': {
                    this.consume();
                    return Token.$new({ type: TokenType.OP_DIV, text: '/' });
                }


                default: {
                    if (this.is_digit(this.c)) {
                        return this.number();
                    }
                    throw "invalid character: '" + this.c + "'";
                }

                }
            }

            return Token.$new({ type: TokenType.EOF, text: '<EOF>' });
        }
        traits.next_token = next_token;

        function ws() {
            while (this.re_ws.test(this.c)) {
                this.consume();
            }
        }
        traits.ws = ws;

        function number() {
            var result = '';

            do {
                result += this.c;
                this.consume();
            } while (this.is_digit(this.c));

            return Token.$new({ type: TokenType.NUMBER, text: result });
        }
        traits.number = number;

        function is_digit(c) {
            return this.re_digit.test(c) || c === '.';
        }
        traits.is_digit = is_digit;


        function $new(input_text) {
            var lexer  = Object.clone(proto);
            lexer.text = input_text;
            lexer.c    = input_text.substr(0, 1);
            return lexer;
        }

        var Lexer = {
            traits: traits,
            proto: proto,
            $new: $new,
        };

        return Lexer;
    }(TokenType, Token));


//     var lexer = Lexer.$new('( (1 + 2) * (3 + 4 ) )');
//     var token = lexer.next_token();
//     console.log(token);
//     while (token.type !== TokenType.EOF) {
//         console.log(token+'');
//         token = lexer.next_token();
//     }

    var Parser = (function(TokenType, Lexer) {
        // https://en.wikipedia.org/wiki/Recursive_descent_parser#C_implementation
        // expr -> term + term
        //      |  term - term
        //      |  term
        //      ;
        //
        // term -> factor * factor
        //      |  factor / factor
        //      |  factor
        //      ;
        //
        // factor -> (expr) | number;
        //
        // number -> digit+
        // digit -> [0-9]

        var traits = Object.create(Object.prototype);
        var proto  = Object.create(traits);

        proto.lexer  = undefined;
        proto._token = undefined;

        function $new() {
            var parser = Object.clone(proto);
            return parser;
        }

        function parse(expr_str) {
            this.lexer = Lexer.$new(expr_str);
            this.next_token();

            var ast = [];
            while (this._token.type !== TokenType.EOF) {
                ast.push(this.expr());
            }

            return ast;
        }
        traits.parse = parse;

        function next_token() {
            this._token = this.lexer.next_token();
        }
        traits.next_token = next_token;

        function expr() {
            var ast = [];

            ast.push(this.term());
            while (
                this._token.type === TokenType.OP_ADD
             || this._token.type === TokenType.OP_SUB
            ) {
                var op = ['op', this._token.type === TokenType.OP_ADD ? '+' : '-'];

                this.next_token();

                op.push(this.term());

                ast.push(op);
            }

            return ast;
        }
        traits.expr = expr;

        function term() {
            var ast = [];

            ast.push(this.factor());
            while (
                this._token.type === TokenType.OP_MUL
             || this._token.type === TokenType.OP_DIV
            ) {
                var op = ['op', this._token.type === TokenType.OP_MUL ? '*' : '/'];

                this.next_token();

                op.push(this.factor());

                ast.push(op);
            }

            return ast;
        }
        traits.term = term;

        function factor() {
            var ast = [];

            if (this.accept(TokenType.LP)) {
                this.next_token();

                ast.push(this.expr());

                this.match(TokenType.RP);
            }
            else if (this.accept(TokenType.NUMBER)) {
                ast.push(this.number());
                this.next_token();
            }
            else {
                throw 'invalid expression';
            }

            return ast;
        }
        traits.factor = factor;

        function number() {
            return ['number', this._token.text];
        }
        traits.number = number;

        function accept(token_type) {
            if (this._token.type === token_type) {
                return true;
            }
            return false;
        }
        traits.accept = accept;

        function match(token_type) {
            if (this._token.type !== token_type) {
                throw 'invalid expression 2';
            }
            this.next_token();
        }
        traits.match = match;

        var Parser = {
            $new: $new,
            parse: parse,
        };
        return Parser;
    }(TokenType, Lexer));


// //     var my_expr = '1';
//     var my_expr = '(1 + 2) * (3 + 4) + 1';
//     // var my_expr = '( ( (1 + 2) * (3 + 4) ) + ( (1 + 2) * (3 + 4) ) )';

//     var parser = Parser.$new();

//     var ast = parser.parse(my_expr);
//     var flattened_ast = flatten_ast(ast);
//     var normalized_ast = normalize_flattened_ast(flattened_ast);

//     console.log(ast);
//     console.log(flattened_ast);
//     console.log(normalized_ast);


    // For the expression: '(1 + 2) * (3 + 4) + 1'

//     var wanted_ast = ['op', '+', ['op', '*', ['op', '+', ['number', 1],
//                                                          ['number', 2]],
//                                              ['op', '+', ['number', 3],
//                                                          ['number', 4]]],
//                                  ['number', 1]];

//     // The ast returned by parser.parse is aweful, even after flattening.

//     var flattened_ast = [
//         ["number", "1"],
//         ["op", "+", [
//             ["number", "2"]
//         ]],
//         ["op", "*", [
//             ["number", "3"],
//             ["op", "+", [
//                 ["number", "4"]
//             ]]
//         ]],
//         ["op", "+", [
//             ["number", "1"]
//         ]]
//     ];

       // The normalized ast is what we want.

//     var normalized_ast
//         = ["op", "+", ["op", "*", ["op", "+", ["number", "1"],
//                                               ["number", "2"]],
//                                   ["op", "+", ["number", "3"],
//                                               ["number", "4"]]],
//                       ["number", "1"]];


    // 1 * (2 + 3)
//     var expected = ['op', '*', ['number', 1],
//                                ['op', '+', ['number', 2],
//                                            ['number', 3]]];
//     // got
//     var flattened_ast = [
//         ["number", "1"],
//         ["op", "*", [
//             ["number", "2"],
//             ["op", "+", [
//                 ["number", "3"]
//             ]]
//         ]]
//     ];

    function $eval(expr_str) {
        var ast    = get_ast(expr_str);
        var result = eval_normalized_ast(ast);

        return result;
    }

    function get_ast(expr_str) {
        var parser = Parser.$new();

        var ast = parser.parse(expr_str);
        var flattened_ast = flatten_ast(ast);
        var normalized_ast = normalize_flattened_ast(flattened_ast);

        return normalized_ast;
    }

    function eval_normalized_ast(node) {
        var node_type = node[0];

        switch (node_type) {

        case 'number': { return parseFloat(node[1]); }

        case 'op': {
            var op = node[1];
            var a = node[2];
            var b = node[3];

            switch (op) {

            case '+': { return eval_normalized_ast(a) + eval_normalized_ast(b); }
            case '-': { return eval_normalized_ast(a) - eval_normalized_ast(b); }
            case '*': { return eval_normalized_ast(a) * eval_normalized_ast(b); }

            case '/': {
                var a_value = eval_normalized_ast(a);
                var b_value = eval_normalized_ast(b);
                if (b_value === 0) {
                    throw 'division by 0';
                }
                return a_value / b_value;
            }

            default: {
                throw 'unknown op: ' + "'" + op + "'";
            }

            } // switch

            break;
        }

        default: {
            throw 'unknown node type: ' + "'" + node_type + "'";
        }

        }

        // unreachable
    }

    function flatten_ast(nested) {
        return flatten_ast_rec(nested, []);
    }

    function flatten_ast_rec(nested, result) {
        if (nested.length > 1) {
            if (!Array.isArray(nested[0])) {
                if (nested[0] === 'number') {
                    result.push(nested);
                }
                else {
                    nested[2] = flatten_ast_rec(nested[2], []);
                    result.push(nested);
                }
            }
            else {
                for (
                    var index = 0;
                    index < nested.length;
                    index++
                ) {
                    flatten_ast_rec(nested[index], result);
                }
            }
        }
        else if (nested.length === 1) {
            return flatten_ast_rec(nested[0], result);
        }

        return result;
    }

    function normalize_flattened_ast(flattened) {
        return normalize_flattened_ast_rec(flattened, flattened.length - 1);
    }

    function normalize_flattened_ast_rec(flattened, index) {
        if (index <= 0) {
            return flattened[0];
        }

        var op = flattened[index];
        if (op[2].length === 1) {
            op[3] = op[2][0];
            op[2] = normalize_flattened_ast_rec(flattened, index - 1);
        }
        else {
            op[3] = normalize_flattened_ast_rec(op[2], op[2].length - 1);
            op[2] = normalize_flattened_ast_rec(flattened, index - 1);
        }

        return op;
    }


    var MathExpr = {
        TokenType: TokenType,
        Token: Token,
        Lexer: Lexer,
        Parser: Parser,
        $eval: $eval,
        get_ast: get_ast,
    };

    return MathExpr;
}());