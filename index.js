function create(element) {

    return proxy(null, element, null, null);
}

function proxy(parent, current, name, parentBindings) {
    var bindings = {};
    var data = {
        bindings: bindings,
        parentBindings: parentBindings,
        parent: parent,
        current: current,
        name: name
    }
    return new Proxy(current, {
        get: function (target, name) {
            if (name.charAt(0) === '$') {
                name = name.substr(1);
                if (!bindings[name]) bindings[name] = {
                    isRefrence: true,
                    owner: current,
                    attached: [],
                    name: name,
                    update: function (value) {
                        this.owner[this.name] = value;
                        this.attached.forEach((obj) => {
                            obj.current[this.name] = value;
                        });
                    }
                };
                return bindings[name];
            } else if (current[name]) {
                if (typeof current[name] === 'object') return proxy(current, current[name], name, bindings);
                else return current[name];
            }
        },
        set: function (target, name, value) {
            if (name.charAt(0) === '$') name = name.substr(1);

            if (value && value.isRefrence) {
                if (bindings[name] !== value) {
                    if (bindings[name]) {
                        var ind = bindings[name].attached.indexOf(data);
                        bindings[name].attached[ind] = bindings[name].attached[bindings[name].attached.length - 1]
                        bindings[name].attached[ind].pop();
                    }
                    value.attached.push(data);
                    current[name] = value.owner[value.name]
                    bindings[name] = value;
                }
            } else {
                if (bindings[name]) {
                    bindings[name].update(value)
                } else {
                    current[name] = value;
                }
            }
        },
        has: function (target, name) {

        },
        deleteProperty: function (target, name) {
            if (name.charAt(0) === '$') {
                name = name.substr(1);
                if (bindings[name]) {
                    if (bindings[name].owner === current) {
                        bindings[name].attached.forEach((att) => {
                            att.bindings[name] = null;
                        })
                        bindings[name].attached = null;
                    } else {
                        var ind = bindings[name].attached.indexOf(data);
                        bindings[name].attached[ind] = bindings[name].attached[bindings[name].attached.length - 1]
                        bindings[name].attached[ind].pop();
                    }
                    bindings[name] = null;
                }
            }
        }
    })
}

var el1 = create({
    value: 'hello'

})

var el2 = create({
    value: 'bye'
})

el1.value = el2.$value;

console.log(el1.value) // bye

el2.value = 1;

console.log(el1.value) // 1

el1.value = 2;

console.log(el2.value) // 2

delete el1.$value // remove bind
