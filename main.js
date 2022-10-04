"use strict";

var fs = require ('fs');

var data = fs.readFileSync (process.argv[2], 'UTF-8');
data = JSON.parse (data);

var symTabFunctions = {};
var symTabTypes = {};
var symTabScript = {
    "type": "",
    "variables": {},
    "functions": symTabFunctions,
    "types": symTabTypes
};

var symTab = {
    "script": symTabScript
};

var astScript = {
    "statements": []
};
var ast = {
    "script": astScript
};

var newAst = {
    "symbol_table": symTab,
    "ast": ast,
    "errors": []
};

var OKnumber = false;
var verifFunc = false;
var OKfunction = false;
var OKstruct = false;
var OKvar = [];
function writeSemantic(node) {
    if (node.id === 'script') {
        symTabScript.type = "script";
        for (var statement of node.statements) {
            writeSemantic (statement);
        }
    }
    if (node.id === 'var') {
        for (var elem of node.elements) {
            if (OKvar.indexOf(elem.title) == -1) {
                symTabScript.variables[elem.title] = {
                    "type": elem.type,
                    "line" : elem.line,
                    "parameter": false
                };
                if (elem.type === 'auto') {
                    symTabScript.variables[elem.title] = {
                        "type": "error",
                        "line" : elem.line,
                        "parameter": false
                    };
                }
                OKvar.push (elem.title);
            } else {
                newAst["errors"] = {
                    "type": "VARIABLE_ALREADY_DEFINED",
                    "elements": {
                        "variable": elem.title,
                        "line": elem.line
                    }
                };
            }
            if (elem.value != undefined ) {
                astScript["statements"].push ({
                    "id": "attr",
                    "to": {
                        "id": "identifier",
                        "title": elem.title,
                        "symbol_table": symTabScript.type,
                        "line": elem.line,
                        "type": elem.type
                    },
                    "from": {
                        "id": elem.value.id,
                        "type": elem.type,
                        "value": elem.value.value,
                        "line": elem.value.line,
                        "symbol_table": symTabScript.type
                    },
                    "line": elem.line,
                    "type": "none"
                });
            }
        }
    }

    if (node.id === 'attr') {
        node.to["symbol_table"] = symTabScript.type;
        node.to["type"] = node.from.type;
        node.from["symbol_table"] = symTabScript.type;
        astScript["statements"].push ({
            "id": node.id,
            "to": node.to,
            "from": node.from,
            "line": node.line,
            "symbol_table": symTabScript.type,
            "type": "none"
        });
    }

    if (node.id === 'expr') {
        if (node.op != 'not') {
            node.left["symbol_table"] = symTabScript.type;
            node.right["symbol_table"] = symTabScript.type;
            astScript["statements"].push ({
                "id": node.id,
                "op": node.op,
                "left": node.left,
                "right": node.right,
                "line": node.line,
                "symbol_table": symTabScript.type,
                "type": node.left.type
            });
        }
        if (verifFunc == true && node.right.type != 'string') {
            astScript["statements"][0]["right"]["type"] = node.left.type;
        }
        if (node.op != 'not' && node.left.type === 'string') {
            node.left["symbol_table"] = symTabScript.type;
            node.right["symbol_table"] = symTabScript.type;
            node.right.left["symbol_table"] = symTabScript.type;
            node.right.right["symbol_table"] = symTabScript.type;
            node.right["type"] = node.right.left.type;
        }
    }

    if (node.id === 'function_def') {
        let parametrii = [];
        for (let i=0; i<node.parameters.length; i++) {
            parametrii.push({
                "type": node.parameters[i].type,
                "title": node.parameters[i].title,
                "line": node.parameters[i].line
            });
        }
        if (OKfunction == false) {
            if (node.use == undefined) {
                symTabFunctions[node.title] = {
                    "type": node.type,
                    "parameters": parametrii,
                    "line": node.line
                };
            } else {
                symTabFunctions[node.title] = {
                    "type": node.type,
                    "parameters": parametrii,
                    "use": node.use,
                    "line": node.line
                };
            }
        }
        if (node.title === 'sum') {
            let paramFunc = {};
            let index = 0;
            for (let param of node.parameters) {
                paramFunc[param.title] = {
                    "type": param.type,
                    "parameter": true,
                    "index": index
                };
                index++;
            }
            if (node.statements.length != 1) {
                paramFunc[node.statements[0].elements[0].title] = {
                    "type": node.statements[0].elements[0].type,
                    "line": node.statements[0].line,
                    "parameter": false
                };
            }
            newAst["symbol_table"] = {
                "script": symTabScript,
                "function_sum": {
                    "title": node.title,
                    "type": "function",
                    "parent": symTabScript.type,
                    "variables": paramFunc,
                    "functions": {},
                    "types": {}
                }
            };
        }
        if (node.title === 'say') {
            newAst["symbol_table"] = {
                "script": symTabScript,
                "function_say": {
                    "title": node.title,
                    "type": "function",
                    "parent": symTabScript.type,
                    "variables": {},
                    "functions": {},
                    "types": {}
                }
            };
        }
        if (node.title === 'print') {
            let paramFunc = {};
            let index = 0;
            for (let param of node.parameters) {
                paramFunc[param.title] = {
                    "type": param.type,
                    "parameter": true,
                    "index": index
                };
                index++;
            }
            newAst["symbol_table"] = {
                "script": symTabScript,
                "function_print": {
                    "title": node.title,
                    "type": "function",
                    "parent": symTabScript.type,
                    "variables": paramFunc,
                    "functions": {},
                    "types": {}
                }
            };
        }
        if (node.title === 'getpid') {
            newAst["symbol_table"] = {
                "script": symTabScript,
                "function_getpid": {
                    "title": node.title,
                    "type": "function",
                    "parent": symTabScript.type,
                    "variables": symTabScript["variables"],
                    "functions": {},
                    "types": {}
                }
            };
        }
        if (node.title === 'number') {
            OKnumber = true;
            let paramFunc = {};
            let index = 0;
            for (let param of node.statements) {
                paramFunc[param.value.id] = {
                    "type": param.value.type,
                    "parameter": true,
                    "index": index
                };
                index++;
            }
            newAst["symbol_table"] = {
                "script": symTabScript,
                "function_number": {
                    "title": node.title,
                    "type": "function",
                    "parent": symTabScript.type,
                    "variables": paramFunc,
                    "functions": {},
                    "types": {}
                }
            };
            verifFunc = true;
            ast[node.title] = {
                "parameters": node.parameters,
                "type": node.type,
                "statements": node.statements
            };
            ast[node.title]["statements"][0]["symbol_table"] = "function_number";
            ast[node.title]["statements"][0]["type"] = node.type;
            ast[node.title]["statements"][0]["value"]["symbol_table"] = "function_number";
        }
        if (node.title === 'f') {
            if (OKfunction == false) {
                newAst["symbol_table"] = {
                    "script": symTabScript,
                    "function_f": {
                        "title": node.title,
                        "type": "function",
                        "parent": symTabScript.type,
                        "variables": symTabScript["variables"],
                        "functions": {},
                        "types": {}
                    }
                };
                OKfunction = true;
            } else {
                newAst["errors"] = {
                    "type": "FUNCTION_ALREADY_DEFINED",
                    "elements": {
                        "function": node.title,
                        "line": node.line
                    }
                };
            }
        }
        if (node.title === 'writechar') {
            let paramFunc = {};
            let index = 0;
            for (let param of node.parameters) {
                paramFunc[param.title] = {
                    "type": param.type,
                    "parameter": true,
                    "index": index
                };
                index++;
            }
            newAst['symbol_table']['function_writechar'] = {
                "title": node.title,
                "type": "function",
                "use": node.use,
                "parent": symTabScript.type,
                "variables": paramFunc,
                "functions": {},
                "types": {}
            };
        }
        if (node.title === 'readint') {
            newAst['symbol_table']['function_readint'] = {
                "title": node.title,
                "type": "function",
                "use": node.use,
                "parent": symTabScript.type,
                "variables": {},
                "functions": {},
                "types": {}
            };
        }
        if (node.title === 'writefloat') {
            let paramFunc = {};
            let index = 0;
            for (let param of node.parameters) {
                paramFunc[param.title] = {
                    "type": param.type,
                    "parameter": true,
                    "index": index
                };
                index++;
            }
            newAst['symbol_table']['function_writefloat'] = {
                "title": node.title,
                "type": "function",
                "use": node.use,
                "parent": symTabScript.type,
                "variables": paramFunc,
                "functions": {},
                "types": {}
            };
        }
        if (node.title === 'writeint') {
            let paramFunc = {};
            let index = 0;
            for (let param of node.parameters) {
                paramFunc[param.title] = {
                    "type": param.type,
                    "parameter": true,
                    "index": index
                };
                index++;
            }
            newAst['symbol_table']['function_writeint'] = {
                "title": node.title,
                "type": "function",
                "use": node.use,
                "parent": symTabScript.type,
                "variables": paramFunc,
                "functions": {},
                "types": {}
            };
        }
    }

    if (node.id === 'if_then') {
        if (node.then[0].elements == undefined) {
            let if_name = 'if_' + node.line;
            newAst['symbol_table'][if_name] = {
                "type": "statements",
                "parent": symTabScript.type,
                "variables": {},
                "functions": {},
                "types": {}
            };
        } else {
            let if_name = 'if_' + node.line;
            let paramFunc = {};
            for (let param of node.then[0].elements) {
                paramFunc[param.title] = {
                    "type": param.type,
                    "line": param.line,
                    "parameter": false
                };
            }
            newAst['symbol_table'][if_name] = {
                "type": "statements",
                "parent": symTabScript.type,
                "variables": paramFunc,
                "functions": {},
                "types": {}
            };
        }
    }
    
    if (node.id === 'loop_when') {
        let loop_name = 'do_while_' + node.line;
        newAst['symbol_table'][loop_name] = {
            "type": "statements",
            "parent": symTabScript.type,
            "variables": {},
            "functions": {},
            "types": {}
        };
    }
    
    if (node.id === 'for') {
        let for_name = 'for_' + node.line;
        let paramFunc = {};
            for (let param of node.variable) {
                paramFunc[param] = {
                    "type": node.to.type,
                    "parameter": false,
                    "line": node.line
                    
                };
            }
        newAst['symbol_table'][for_name] = {
            "type": "statements",
            "parent": symTabScript.type,
            "variables": paramFunc,
            "functions": {},
            "types": {}
        };
    }
    if (node.id === 'loop_go') {
        let go_name = 'while_' + node.line;
        newAst['symbol_table'][go_name] = {
            "type": "statements",
            "parent": symTabScript.type,
            "variables": {},
            "functions": {},
            "types": {}
        };
    }

    if (node.id === 'struct_def') {
        let propList = [];
        let valueList = {};
        for (var prop of node.properties) {
            if (prop.value == undefined) {
                propList.push ({
                    "type": prop.type,
                    "title": prop.title,
                    "line": prop.line
                });
            } else {
                propList.push ({
                    "type": prop.type,
                    "title": prop.title,
                    "value": {
                        "id": "value",
                        "type": prop.value.type,
                        "value": prop.value.value,
                        "line": prop.value.line,
                        "symbol_table": symTabScript.type
                    },
                    "line": prop.line
                });
            }
        }
        if (OKstruct == false) {
            symTabTypes[node.title] = {
                "type": "struct",
                "properties": propList,
                "line": node.line
            };
            OKstruct = true;
        }
    }

    if (node.id === 'vector') {
        symTabTypes[node.title] = {
            "type": "array",
            "element_type": node.element_type,
            "length": (node.to - node.from),
            "first": node.from,
            "line": node.line
        };
    }
}

writeSemantic (data);

fs.writeFileSync (process.argv[3], JSON.stringify (newAst, null, 4));