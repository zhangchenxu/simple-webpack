const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const options = require('./webpack.config');
const traverse = require('@babel/traverse').default;
const {transformFromAst} = require('@babel/core');
const Parser = {
  getAts (path) {
    const content = fs.readFileSync(path, 'utf-8');
    return parser.parse(content, {
      sourceType: 'module'
    });
  },
  getDependencies (ast, filename) {
    const dependencies = [];
    traverse(ast, {
      ImportDeclaration ({node}) {
        const dirname = path.dirname(filename);
        console.log(node.source.value);
        const filepath = './' + path.join(dirname, node.source.value).replace('\\', '/');
        dependencies[node.source.value] = filepath;
      }
    });
    return dependencies;
  },
  getCode (ast) {
    const {code} = transformFromAst(ast, null, {
      presets: ['@babel/preset-env']
    });
    return code;
  }
};


class Compiler {
  constructor (options) {
    const {entry, output} = options;
    this.entry = entry;
    this.outout = output;
    this.modules = [];
  }

  build (filename) {
    const {getAts, getDependencies, getCode} = Parser;
    const ast = getAts(filename);
    const dependencies = getDependencies(ast, filename);
    const code = getCode(ast);
    return {
      filename,
      dependencies,
      code
    };
  }

  run () {

    const info = this.build(this.entry);
    console.log(info);
    return
    this.modules.push(info);
    this.modules.forEach(({dependencies}) => {
      if (dependencies) {
        for (const dependency in dependencies) {
          this.modules.push(this.build(dependencies[dependency]));
        }
      }
    });
    const dependencyGraph = this.modules.reduce((graph, item) => ({
      ...graph,
      [item.filename]: {
        dependencies: item.dependencies,
        code: item.code
      }
    }), {});
  }

  generate () {
  }

}

new Compiler(options).run();
