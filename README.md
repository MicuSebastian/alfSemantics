# About
The purpose of the assignment is to create the symbol table and write the semantic analysis for the Alf language. You will receive an AST from the parser that correctly parses an Alf language source and must write: 
* the symbol table, 
* a new AST with the following modifications, 
  * the new AST is a list of function statements, all nodes in the AST will have a property called symbol_table that will reference the entry in the symbol table where they declare variables, functions and types 
  * the main program is called "script", 
    * all other function definitions will be transferred from the old AST to the new AST, 
    * all variable definition nodes are deleted or, if they have an @var i assignment: int ← 3;, will be replaced with an i ← 3; assignment node
* the error list.
