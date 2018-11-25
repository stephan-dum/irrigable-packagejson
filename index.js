const { Transform } = require("stream");
const ImportProvider = require("@aboutweb/irrigable/src/provider/import.js");
const rollup = require("@aboutweb/irrigable-rollup");

const formats = ["umd", "iife", "amd", "system", "cjs"];

class IrrigablePackageJSON extends Transform {
  constructor(parent) {
    super({ objectMode : true });

    this.sourcemap = parent.sourcemap;
  }
  format(options, output, file) {
    let {
      umd,
      iife,
      amd,
      system,
      cjs,
      sourcemap = this.sourcemap
    } = options;

    if(umd) {
      if(typeof umd == "string") {
        umd = {
          name : umd
        };
      }

      output.push({
        file,
        sourcemap,
        ...umd,
        format: 'umd'
      });
    }
    if(iife) {
      if(typeof iife == "string") {
        iife = {
          name : iife
        };
      }

      output.push({
        file,
        sourcemap,
        ...iife,
        format: 'iife'
      });
    }
    if(amd) {
      if(amd === true) {
        amd = {};
      }

      output.push({
        file,
        amd,
        format: 'iife',
        sourcemap,
      });
    }
    if(system) {
      if(system === true) {
        system = {}
      }

      output.push({
        file,
        format: 'system',
        sourcemap,
        ...system
      });
    }
    if(cjs) {
      if(cjs === true) {
        cjs = {}
      }

      output.push({
        file,
        format: 'cjs',
        ...cjs,
        sourcemap,
      });
    }
  }
  _transform(file, encoding, callback) {
    let options = file.exports;

    let {
      main,
      browser,
      module,
      inputs,
      output = [],
      dependencies = {},
      sourcemap = this.sourcemap
    } = options;

    let noFormat = (
      output.length == 0
      && !formats.some((format) => format in options)
    );



    if(main) {
      if(noFormat) {
        options = {
          ...options,
          cjs : true
        };
      }

      this.format(options, output, main);
    }

    if(browser) {
      if(noFormat) {
        options = {
          ...options,
          amd : true
        };
      }

      this.format(options, output, browser);
    }

    if(module) {
      output.push({
        file : module,
        sourcemap,
        format: 'es'
      });
    }

    file.exports = {
      inputs,
      sourcemap : ".",
      pipeline : [{
        construct : rollup,
        args : {
          input : {
            external : Object.keys(dependencies)
          },
          output
        }
      }]
    };

    callback(null, file);
  }
}

const DEFAULTPATH = "./package.json";

module.exports = function(glob = DEFAULTPATH, parent) {
  if(!parent) {
    parent = glob;
    glob = DEFAULTPATH;
  }

  return new ImportProvider({
    glob,
    pipeline : {
      post : [{
        construct : IrrigablePackageJSON,
        args : [parent]
      }]
    }
  })
}
