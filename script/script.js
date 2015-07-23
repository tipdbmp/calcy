window.onload = function() {
    'use strict';

    var $document = document;
    $document.title = '<TITLE>';

    var $body = $document.body;

    var $calcy = $document.createElement('div');
    $calcy.classList.add('cacly');

    var $input = $document.createElement('input');
    $input.classList.add('calcy-input');
    $input.type = 'text';

    var input_selected = false;
    $input.addEventListener('focus', function on_input_focus() { input_selected = true;  }, false);
    $input.addEventListener('blur',  function on_input_focus() { input_selected = false; }, false);


    var InputAction = (function($default_input) {

        function $new(args) {
            var $input = args.input !== undefined ? args.input : $default_input;
            var text   = args.text;

            function $do() {
                $input.value += text;
                return true;
            }

            function undo() {
                $input.value = $input.value.substring(0, $input.value.length - text.length);
            }

            return {
                $do: $do,
                undo: undo,
            };
        }

        return {
            $new: $new,
        };
    }($input));

    var OutputAction = (function(default_input) {
        var proto = {
            $input: undefined,
            prev_input_values: [],

            $do: function() {
                var input_value = this.$input.value;

                if (input_value !== '') {
                    this.prev_input_values.push(input_value);
                    this.$input.value = this.func(input_value);
                    return true;
                }
                return false;
            },
            undo: function() {
                this.$input.value = this.prev_input_values.pop();
            },

            func: undefined,
        };

        function $new(func, $input) {
            var self = Object.clone(proto);
            self.func = func;
            self.$input = $input === undefined ? default_input : $input;
            return self;
        }

        var OutputAction = {
            $new: $new,
        };
        return OutputAction;
    }($input));


    var clear_action = OutputAction.$new(function(value) { return ''; });
    var result_action = OutputAction.$new(function(value) {
        return MathExpr.$eval(value);
    });

    var actions_table = [ undefined,
        InputAction.$new({ text: '1' }),
        InputAction.$new({ text: '2' }),
        InputAction.$new({ text: '3' }),
        InputAction.$new({ text: '4' }),
        InputAction.$new({ text: '5' }),
        InputAction.$new({ text: '6' }),
        InputAction.$new({ text: '7' }),
        InputAction.$new({ text: '8' }),
        InputAction.$new({ text: '9' }),
        InputAction.$new({ text: '0' }),
        InputAction.$new({ text: '.' }),
        InputAction.$new({ text: '(' }),
        InputAction.$new({ text: ')' }),
        InputAction.$new({ text: ' + ' }),
        InputAction.$new({ text: ' - ', }),
        InputAction.$new({ text: ' * ' }),
        InputAction.$new({ text: ' / ', }),
        clear_action,
        result_action,
    ];

    var $Button = (function(actions_table) {
        var actions_history = [];

        function $new(args) {
            var action_id = args.action_id;
            var label     = args.label;

            var $button = $document.createElement('button');
            $button.$action_id = action_id;
            $button.classList.add('calcy-btn');
            $button.textContent = label;
            $button.addEventListener('click', on_button_click_dispatch, false);

            return $button;
        }

        function on_button_click_dispatch(event) {
            var action_id = this.$action_id;

            if (action_id !== 0) {
                var action = actions_table[action_id];

                var add_to_history = action.$do(event);

                if (add_to_history) {
                    actions_history.push(action_id);
                }
            }
            else {
                // undo button clicked

                if (actions_history.length > 0) {
                    var prev_action_id = actions_history.pop();
                    var prev_action = actions_table[prev_action_id];
                    prev_action.undo();
                }
            }
        }

        return {
            $new: $new,
            actions_history: actions_history,
        }
    }(actions_table));

    var $btn_map = {};

    var $buttons = (function() {
        var action_id = 0;

        return [ $btn_map['undo'] = $Button.$new({ action_id: 0, label: 'undo' }),
            $btn_map['1']  = $Button.$new({ action_id: ++action_id, label: '1' }),
            $btn_map['2']  = $Button.$new({ action_id: ++action_id, label: '2' }),
            $btn_map['3']  = $Button.$new({ action_id: ++action_id, label: '3' }),
            $btn_map['4']  = $Button.$new({ action_id: ++action_id, label: '4' }),
            $btn_map['5']  = $Button.$new({ action_id: ++action_id, label: '5' }),
            $btn_map['6']  = $Button.$new({ action_id: ++action_id, label: '6' }),
            $btn_map['7']  = $Button.$new({ action_id: ++action_id, label: '7' }),
            $btn_map['8']  = $Button.$new({ action_id: ++action_id, label: '8' }),
            $btn_map['9']  = $Button.$new({ action_id: ++action_id, label: '9' }),
            $btn_map['0']  = $Button.$new({ action_id: ++action_id, label: '0' }),
            $btn_map['.']  = $Button.$new({ action_id: ++action_id, label: '.' }),
            $btn_map['(']  = $Button.$new({ action_id: ++action_id, label: '(' }),
            $btn_map[')']  = $Button.$new({ action_id: ++action_id, label: ')' }),
            $btn_map['+']  = $Button.$new({ action_id: ++action_id, label: '+' }),
            $btn_map['-']  = $Button.$new({ action_id: ++action_id, label: '-' }),
            $btn_map['*']  = $Button.$new({ action_id: ++action_id, label: '*' }),
            $btn_map['/']  = $Button.$new({ action_id: ++action_id, label: '/' }),
            $btn_map['^l'] = $Button.$new({ action_id: ++action_id, label: 'clear' }),
            $btn_map['=']  = $Button.$new({ action_id: ++action_id, label: '=' }),
        ];
    }());

    var buttons_info = new Array($buttons.length);
    for (var i = 0; i < buttons_info.length; i++) {
        buttons_info[i] = { visible: false };
    }

    function buttons_info_reset_visibility() {
        for (var i = 0; i < buttons_info.length; i++) {
            buttons_info[i] = { visible: false };
        }
    }

    function b(button_index) {
        buttons_info[button_index].visible = true;
        return $buttons[button_index];
    }

    var $$node = Dom.$$node;
    var $node  = Dom.$node;


    var $view_select_box = (function() {
        var $view_select_box = $document.createElement('div');
        $view_select_box.classList.add('view-select-box');

        var $view_label = $document.createElement('span');
        $view_label.classList.add('view-label');
        $view_label.textContent = 'View: ';

        var value = $$node('span.option-value');

        Dom.node_push($view_select_box,
            $view_label,
            $node('select.view-select', {}, { change: on_change_view },
                $node('option', { value: 'debug-view',                           }, {}, value('debug')),
                $node('option', { value: 'simple-view',                          }, {}, value('simple')),
                $node('option', { value: 'simple-view-big', selected: 'selected' }, {}, value('"big mode"')),
                $node('option', { value: 'autopilot',                            }, {}, value('autopilot'))
            )
        );

        function on_change_view() {
            var select = this;
            var view = select.options[select.selectedIndex];
            
            if (view !== 'autopilot') {
                autopilot.stop();

                for (var i = 0; i < $buttons.length; i++) {
                    $buttons[i].classList.remove('pressed-btn');
                }

                var action_clear_id = 18;
                actions_table[action_clear_id].$do();
            }

            switch (view.value) {

            case 'debug-view': {
                set_debug_view();
                break;
            }
            case 'simple-view': {
                set_simple_view('simple-view');
                break;
            }
            case 'simple-view-big': {
                set_simple_view('simple-view-big');
                break;
            }
            case 'autopilot': {
                set_autopilot_view();
                autopilot.start();
                break;
            }            
            default:{
                throw 'unknown view';
            }

            }
        }

        return $view_select_box;
    }());


    var calcy_input_box = $$node('div.calcy-input-box');
    var $calcy_input_box = calcy_input_box($input);

    var set_debug_view = (function() {
        var $debug_view = $document.createElement('div');
        $debug_view.classList.add('debug-view');

        function set_debug_view() {
            Dom.node_remove_all_children($debug_view);

            Dom.node_push($debug_view,
                $calcy_input_box,
                $buttons
            );

            Dom.node_remove_all_children($calcy);
            Dom.node_push($calcy, $debug_view);


            buttons_info_reset_visibility();

            for (var i = 0; i < buttons_info.length; i++) {
                buttons_info[i].visible = true;
            }
        }

        return set_debug_view;
    }());

    var set_simple_view = (function() {
        var row = $$node('tr.row');

        var h1 = $$node('td.btn-h1');
        var h2 = $$node('td.btn-h2', { colspan: 2 });
        var h3 = $$node('td.btn-h3', { colspan: 3 });
        var h5 = $$node('td.btn-h5', { colspan: 5 });

        var v2 = $$node('td.btn-v2', { rowspan: 2 });

        var $parents = [];

        var $simple_view = $document.createElement('div');
        $simple_view.classList.add('simple-view');

        function set_simple_view(table_class_name) {
            Dom.node_remove_all_children($simple_view);

            buttons_info_reset_visibility();

            var simple_view_table = $$node('table.' + table_class_name);

            Dom.node_push($simple_view,
                $node('div.' + table_class_name, {}, {}, $calcy_input_box),

                simple_view_table(
                    row( h2( b(0) ), h3( b(18) ) ),
                    row( h1( b(7) ), h1( b(8) ), h1( b(9) ), v2( b(14) ), v2( b(15) ) ),
                    row( h1( b(4) ), h1( b(5) ), h1( b(6) ) ),
                    row( h1( b(1) ), h1( b(2) ), h1( b(3) ), v2( b(16) ), v2( b(17) ) ),
                    row( h2( b(10) ), h1( b(11) ) ),
                    row( h3( b(19) ), h1( b(12) ), h1( b(13) ) )
                )
            );

            Dom.node_remove_all_children($calcy);
            Dom.node_push($calcy, $simple_view);
        }

        return set_simple_view;
    }());

    var set_autopilot_view = (function() {
        var $speed_box = $document.createElement('div');
        $speed_box.classList.add('speed-select-box');

        var $speed_label = $document.createElement('span');
        $speed_label.classList.add('speed-label');
        $speed_label.textContent = 'speed: ';

        var value = $$node('span.option-value');

        Dom.node_push($speed_box,
            $speed_label,
            $node('select.speed-select', {}, { change: on_change_speed },
                $node('option', { value: '1',                      }, {}, value('1')),
                $node('option', { value: '2',                      }, {}, value('2')),
                $node('option', { value: '3',                      }, {}, value('3')),
                $node('option', { value: '4',                      }, {}, value('4')),
                $node('option', { value: '5', selected: 'selected' }, {}, value('5')),
                $node('option', { value: '6',                      }, {}, value('6')),
                $node('option', { value: '7',                      }, {}, value('7')),
                $node('option', { value: '8',                      }, {}, value('8')),
                $node('option', { value: '9',                      }, {}, value('9')),
                $node('option', { value: '10',                     }, {}, value('10'))
            )
        );

        function on_change_speed(event) {
            var select = this;
            var speed = select.options[select.selectedIndex];
            var value = speed.value;
            var new_speed = parseInt(value, 10);
            new_speed = (11 - new_speed) * 100; // ms
            autopilot.exec_actions_delay[0] = new_speed;
        }


        var row = $$node('tr.row');

        var h1 = $$node('td.btn-h1');
        var h2 = $$node('td.btn-h2', { colspan: 2 });
        var h3 = $$node('td.btn-h3', { colspan: 3 });
        var h5 = $$node('td.btn-h5', { colspan: 5 });

        var v2 = $$node('td.btn-v2', { rowspan: 2 });

        var $parents = [];

        var $autopilot_view = $document.createElement('div');
        $autopilot_view.classList.add('autopilot-view');

        function set_autopilot_view() {
            Dom.node_remove_all_children($autopilot_view);

            buttons_info_reset_visibility();

            var autopilot_view_table = $$node('table.autopilot-view');

            Dom.node_push($autopilot_view,
                $speed_box,
                $node('div', {}, {}, $calcy_input_box),

                autopilot_view_table(
                    row( h2( b(0) ), h3( b(18) ) ),
                    row( h1( b(7) ), h1( b(8) ), h1( b(9) ), v2( b(14) ), v2( b(15) ) ),
                    row( h1( b(4) ), h1( b(5) ), h1( b(6) ) ),
                    row( h1( b(1) ), h1( b(2) ), h1( b(3) ), v2( b(16) ), v2( b(17) ) ),
                    row( h2( b(10) ), h1( b(11) ) ),
                    row( h3( b(19) ), h1( b(12) ), h1( b(13) ) )
                )
            );

            Dom.node_remove_all_children($calcy);
            Dom.node_push($calcy, $autopilot_view);
        }

        return set_autopilot_view;
    }());
//     set_debug_view();
//     set_simple_view('simple-view');
    set_simple_view('simple-view-big');
//     set_autopilot_view();


    Dom.node_push($body,
        $view_select_box,
        $calcy
    );


    (function keyboard_shortcuts() {

    // We want to immediately see the result of the key press (that's why we do the
    // actions at 'keydown' event and not 'keyup') but don't want
    // holding it down to trigger multiple actions.
    var is_key_up = {
        '1': true, '3': true, '5': true, '7': true, '9': true,
        '2': true, '4': true, '6': true, '8': true, '0': true,
        '=': true, '.': true,
        '+': true, '-': true, '*': true, '/': true, 
        '(': true, ')': true,
        'undo': true, '^l': true,
    };

    var pressed_key = [];
//     window.pressed_key = pressed_key;

    $document.addEventListener('keydown', on_key_down, false);
    function on_key_down(event) {
        if (input_selected) { return; }

        var key_code = event.keyCode;

        // backspace -> go to previous page by default
        // we remap it to 'undo'
        if (key_code === 8) { event.preventDefault(); }

        // '/' -> quick find in firefox
        // we remap it to '/' (of course =))
        if (key_code === 191) { event.preventDefault(); } 

        if (key_code === 16 || key_code === 17) { return ''; } // shift and ctrl keys

        // Ctrl-L -> select the text in the URL bar by default
        // we remap it to 'clear'
        if (key_code === 76 && event.ctrlKey) { event.preventDefault(); }

        var key = get_key(key_code, event.shiftKey, event.ctrlKey);
        if (key === '') { return; }

        var $btn = $btn_map[key];
        $btn.classList.add('pressed-btn');

        // prevent spam except for the 'undo' key
        if (!is_key_up[key] && event.keyCode !== 8) { return; }

        if (key !== 'undo') {
            pressed_key.push(key);
        }
        is_key_up[key] = false;
        
        var btn = buttons_info[$btn.$action_id];
        if (btn.visible) {
            $btn.dispatchEvent(new Event('click'));
        }
    }

    $document.addEventListener('keyup', on_key_up, false);
    function on_key_up(event) {
        if (input_selected) { return; }

        var key_code = event.keyCode;

        // 'undo' key is special/spamable
        if (key_code === 8) {
            var $btn = $btn_map['undo'];
            $btn.classList.remove('pressed-btn');
            is_key_up['undo'] = true;
            return;
        }
       
        if (key_code === 16 || key_code === 17) { return; } // shift and ctrl keys

        var key = pressed_key.shift();
        if (key === undefined) { return; }

        var $btn = $btn_map[key];
        $btn.classList.remove('pressed-btn');

        is_key_up[key] = true;
    }

    function get_key(key_code, shift_key, ctrl_key) {
        // Is this keyboard layout dependant?

        if      (key_code === 61)  { key_code = 187; } // firefox(+) => chrome(+)
        else if (key_code === 173) { key_code = 189; } // firefox(-) => chrome(-)
//         else if (key_code === 56)  { key_code = }

        if      (key_code ===   8 && !shift_key && !ctrl_key) { return 'undo'; } // backspace
        else if (key_code ===  49 && !shift_key && !ctrl_key) { return '1';    }
        else if (key_code ===  50 && !shift_key && !ctrl_key) { return '2';    }
        else if (key_code ===  51 && !shift_key && !ctrl_key) { return '3';    }
        else if (key_code ===  52 && !shift_key && !ctrl_key) { return '4';    }
        else if (key_code ===  53 && !shift_key && !ctrl_key) { return '5';    }
        else if (key_code ===  54 && !shift_key && !ctrl_key) { return '6';    }
        else if (key_code ===  55 && !shift_key && !ctrl_key) { return '7';    }
        else if (key_code ===  56 && !shift_key && !ctrl_key) { return '8';    }
        else if (key_code ===  57 && !shift_key && !ctrl_key) { return '9';    }
        else if (key_code ===  48 && !shift_key && !ctrl_key) { return '0';    }
        else if (key_code === 187 && !shift_key && !ctrl_key) { return '=';    }
        else if (key_code ===  13 && !shift_key && !ctrl_key) { return '=';    } // return 
        else if (key_code === 187 &&  shift_key && !ctrl_key) { return '+';    }
        else if (key_code === 189 && !shift_key && !ctrl_key) { return '-';    }
        else if (key_code ===  56 &&  shift_key && !ctrl_key) { return '*';    }
        else if (key_code === 191 && !shift_key && !ctrl_key) { return '/';    }
        else if (key_code === 190 && !shift_key && !ctrl_key) { return '.';    }
        else if (key_code === 57  &&  shift_key && !ctrl_key) { return '(';    }
        else if (key_code === 48  &&  shift_key && !ctrl_key) { return ')';    }
        else if (key_code ===  76 && !shift_key &&  ctrl_key) { return '^l';   } // Ctrl-L

        return '';
    }

    }());


    var autopilot = (function() {
        var exec_actions_delay = [500];

        var action_id_for = { 
            '(': 12, ')': 13,
            '+': 14, '-': 15, '*': 16, '/': 17, 
            '^l': 18, '=': 19
        };

        var precedence_of = {
            '+': 1, '-': 1,
            '*': 2, '/': 2,
        };

// //         var expr = '(1 + 2) * 3';
//         var expr = '(14 + 16 - 32) / 4 - 28 / 4';

// //         var ast = ['op', '+', ['number', 1], ['number', 2]];
// //         var ast = MathExpr.get_ast(expr);
//         var ast = random_ast(4);
//         console.log(ast);

// //         var actions = [1, 14, 2, 19]; // 1 + 2 =     
//         var actions = ast_to_actions(ast);
//         actions.push(action_id_for['=']);
//         console.log(actions);

// //         exec_actions(actions);

        var actions;
        var timer = [];
        var running = false;

// //         start();
        function start() {
            running = true;

            var depth = rand(2, 4);
            var ast = random_ast(depth);
            actions = ast_to_actions(ast);
            actions.unshift(action_id_for['^l']);
            actions.push(action_id_for['=']);

            exec_actions(actions, function() {
                setTimeout(start, 1000);
            });
        }

        function stop() {
            if (!running) { return; }

            running = false;
            clearTimeout(timer);
        }

        function random_ast(depth) {
            return random_ast_rec([], depth);
        }

        function random_ast_rec(ast, depth) {
            if (depth <= 0) {
                return ['number', random_number(rand(1, 4)) ];
            }

            ast[0] = 'op';                
            var ops = ['+', '-', '*', '/'];
            var random_op = ops[rand(0, 3)];
            ast[1] = random_op;

            ast.push(random_ast_rec([], depth - 1));
            ast.push(random_ast_rec([], depth - 1));

            return ast;
        }
    
        function random_number(length) {
            var random_number = ''+(rand(1, 9));
            length -= 1;
            for (var i = 1; i <= length; i++) {
                var random_digit = rand(0, 9);
                random_number += ''+random_digit;
            }
            return random_number;
        }

        function ast_to_actions(ast) {
            return ast_to_actions_rec(ast, [], 0);
        }

        function ast_to_actions_rec(ast, actions, parent_op_precedence) {
            var node_type = ast[0];

            switch (node_type) {

            case 'op': {
                var op = ast[1];
                if (!action_id_for[op]) {
                    throw 'unknown op: ' + "'" + op + "'";
                }
                
                var op_precedence = precedence_of[op];

                if (parent_op_precedence > op_precedence) {
                    actions.push(action_id_for['(']);
                }

                ast_to_actions_rec(ast[2], actions, op_precedence);

                actions.push(action_id_for[op]);

                ast_to_actions_rec(ast[3], actions, op_precedence);

                if (parent_op_precedence > op_precedence) {
                    actions.push(action_id_for[')']);
                }

                break;
            }

            case 'number': {
                var number = ast[1];
                var digits 
                  = (''+number)
                    .split('')
                    .map(function(digit) {
                        var action_id = parseInt(digit, 10);
                        // the action_id of '0' is 10, because action_id 0
                        // is for 'undo'
                        return action_id === 0 ? 10 : action_id 
                    })
                    ;
                actions.push.apply(actions, digits);
                
                break;
            }

            default: {
                throw 'unknown ast node: ' + "'" + node_type + "'";
            }

            }

            return actions;
        }

        function exec_actions(actions, callback_on_finish) {
            var actions_count = actions.length;
            
            var $prev_btn;
            timer[0] = setTimeout(loop, exec_actions_delay[0]);

            function loop() {
                if ($prev_btn) {
                    $prev_btn.classList.remove('pressed-btn');
                }

                actions_count--;
                if (actions_count < 0) {
                    if (typeof callback_on_finish === 'function') {
                        callback_on_finish();
                    }
                    return;
                }
                
                var action_id = actions[actions.length - actions_count - 1];
                var $btn = $buttons[action_id];
                actions_table[action_id].$do();
//                 $btn.dispatchEvent(new Event('click'));

                $btn.classList.add('pressed-btn');

                $prev_btn = $btn;
                timer[0] = setTimeout(loop, exec_actions_delay[0]);
            }

            return timer;
        }

        return {
            exec_actions_delay,
            start: start,
            stop: stop,
        }
    }());


    function cl() {
        return Dom.clear_node();
    }

    // [a, b]
    function rand(a, b) {
        var t = Math.random();
        var result = a +  t * (b - a + 1);
        return Math.floor(result);
    }    
};