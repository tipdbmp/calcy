if (typeof Object.clone !== 'function') {
(function() {

    // http://jsperf.com/isobject4
    function is_object(value)   { return value !== null && typeof value === 'object'; }

    function is_function(value) { return typeof value === 'function'; }

    var is_array = Array.isArray;

    var slice = [].slice;

    var get_prototype_of = Object.getPrototypeOf;
    var get_own_property_descriptor = Object.getOwnPropertyDescriptor;
    var define_property = Object.defineProperty;


    function embed(dst /*, ...objects */) {
        for (
            var object_index = 1, objects_count = arguments.length;
            object_index < objects_count;
            object_index++
        ) {
            var obj = arguments[object_index];

            if (!is_object(obj) && !is_function(obj)) { continue; }

            var want_define_property = !is_array(obj);

            var slots = Object.keys(obj);
            for (
                var slot_index = 0, slots_count = slots.length;
                slot_index < slots_count;
                slot_index++
            ) {
                var slot = slots[slot_index];
                var src = obj[slot];

                if (is_object(src)) {
                    if (!is_object(dst[slot])) {
                        dst[slot] = is_array(src) ? [] : Object.create(get_prototype_of(src));
                    }
                    embed(dst[slot], src);
                }
                else {
                    if (want_define_property) {
                        define_property(dst, slot, get_own_property_descriptor(obj, slot));
                    }
                    else {
                        dst[slot] = src;
                    }
                }
            }
        }
        return dst;
    }

    function clone(obj) {
        var result = Object.create(get_prototype_of(obj));
        embed(result, obj);
        return result;
    }


    Object.embed = embed;
    Object.clone = clone;
}());
}