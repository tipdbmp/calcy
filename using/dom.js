var Dom = (function() {

    var is_array = Array.isArray;
    var slice    = [].slice;

    function node_push(node) {
        for (var i = 1; i < arguments.length; i++) {
            if (is_array(arguments[i])) {
                var array = arguments[i];
                for (var j = 0; j < array.length; j++) {
                    node_push(node, array[j]);
                }
            }
            else if (typeof arguments[i] === 'string') {
                // auto-convert strings to Text nodes
                arguments[i] = new Text(arguments[i]);
                node.appendChild(arguments[i]);
            }
            else {
                node.appendChild(arguments[i]);
            }
        }
    }

    function node_unshift(node) {
        var fc = node.firstElementChild;

        function _node_unshift() {
            for (var i = 0; i < arguments.length; i++) {
                if (is_array(arguments[i])) {
                    var array = arguments[i];
                    for (var j = 0; j < array.length; j++) {
                        _node_unshift(array[j]);
                    }
                }
                else if (typeof arguments[i] === 'string') {
                    // auto-convert strings to Text nodes
                    arguments[i] = new Text(arguments[i]);
                    arguments[i].parentNode = node;
                    node.insertBefore(arguments[i], fc);
                }
                else {
                    arguments[i].parentNode = node;
                    node.insertBefore(arguments[i], fc);
                }
            }
        }

        _node_unshift.apply(null, slice.call(arguments, 1));
    }

    function node_remove_all_children(node) {
        while (node.firstChild) { node.removeChild(node.firstChild); }
    }

    function clear_node() {
//         .clear { clear: both; display: block; margin: 0; padding: 0; }
        var clear = document.createElement('span');
//         clear.style.background = 'yellow';
//         clear.textContent = 'foo';
        clear.style.clear = 'both';
        clear.style.display = 'block';
//         clear.style.margin = 0;
//         clear.style.padding = 0;
        return clear;
    }


    function $$node(node_type_name_and_class_string, attrs_kv, events_kv) {
        var node_type_name;
        var class_string;

        if (node_type_name_and_class_string.indexOf('.') >= 0) {
            var pair = node_type_name_and_class_string.split('.');
            node_type_name = pair[0];
            class_string = pair[1];
        }
        else {
            node_type_name = node_type_name_and_class_string;
        }

        var attr_names = [];
        var attr_values = [];

        if (typeof attrs_kv === 'object') {
            attr_names = Object.keys(attrs_kv);
            for (
                var attr_name_index = 0, attr_names_count = attr_names.length;
                attr_name_index < attr_names_count;
                attr_name_index++
            ) {
                var attr_name = attr_names[attr_name_index];
                var attr_value = attrs_kv[attr_name];

                attr_values[attr_name_index] = attr_value;
            }
        }

        var event_names = [];
        var events = [];

        if (typeof events_kv === 'object') {
            event_names = Object.keys(events_kv);
            for (
                var event_name_index = 0, event_names_count = event_names.length;
                event_name_index < event_names_count;
                event_name_index++
            ) {
                var event_name = event_names[event_name_index];
                var event = events_kv[event_name];

                events[event_name_index] = event;
            }

        }

        var $node_maker = function $node_maker(/* ...$nodes */) {
            var $node = document.createElement(node_type_name);

            if (typeof class_string === 'string') {
                $node.setAttribute('class', class_string);
            }

            for (
                var attr_name_index = 0, attr_names_count = attr_names.length;
                attr_name_index < attr_names_count;
                attr_name_index++
            ) {
                var attr_name = attr_names[attr_name_index];
                var attr_value = attr_values[attr_name_index];

                $node.setAttribute(attr_name, attr_value);
            }

            for (
                var event_name_index = 0, event_names_count = event_names.length;
                event_name_index < event_names_count;
                event_name_index++
            ) {
                var event_name = event_names[event_name_index];
                var event = events[event_name_index];

                $node.addEventListener(event_name, event);
            }

            var $nodes = Array.prototype.slice.call(arguments, 0, arguments.length);
            node_push($node, $nodes);

            return $node;
        };

        return $node_maker;
    }

    function $node(node_type_name_and_class_string, attrs_kv, events_kv /*, ...$nodes */) {
        var node_type_name;
        var class_string;

        if (node_type_name_and_class_string.indexOf('.') >= 0) {
            var pair = node_type_name_and_class_string.split('.');
            node_type_name = pair[0];
            class_string = pair[1];
        }
        else {
            node_type_name = node_type_name_and_class_string;
        }

        var $node = document.createElement(node_type_name);

        if (typeof class_string === 'string') {
            $node.setAttribute('class', class_string);
        }

        var attr_names = Object.keys(attrs_kv);
        for (
            var attr_name_index = 0, attr_names_count = attr_names.length;
            attr_name_index < attr_names_count;
            attr_name_index++
        ) {
            var attr_name = attr_names[attr_name_index];
            var attr_value = attrs_kv[attr_name];

            $node.setAttribute(attr_name, attr_value);
        }

        var event_names = Object.keys(events_kv);
        for (
            var event_name_index = 0, event_names_count = event_names.length;
            event_name_index < event_names_count;
            event_name_index++
        ) {
            var event_name = event_names[event_name_index];
            var event = events_kv[event_name];

            $node.addEventListener(event_name, event, false);
        }

        var $nodes = Array.prototype.slice.call(arguments, 3);
        node_push($node, $nodes);

        return $node;
    }

    return {
        node_push:    node_push,
        node_unshift: node_unshift,

        node_remove_all_children: node_remove_all_children,

        clear_node: clear_node,

        $$node: $$node,
        $node:  $node,
    };
}());