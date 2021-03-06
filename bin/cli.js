#!/usr/bin/env node
"use strict";

const irrigable = require("@aboutweb/irrigable");
const OptionParser = require("@aboutweb/irrigable-cli/option-parser");
const rollupPackageJSON = require("../index.js");
const exec = require("child_process").exec;

const options = new OptionParser({
  t : {
    long : "test",
    default : "npm run test"
  },
  w : {
    long : "watch",
    default : true
  },
  o : "outputs",
  g : "glob",
  s : {
    long : "sourcemap",
    default : "."
  }
}).parse();

let {
  test,
  watch,
  glob,
  sourcemap,
  outputs = "."
} = options;

const config = {
  outputs,
  watch,
  sourcemap,
  providers : {
    invoke : rollupPackageJSON,
    args : [glob]
  }
};

if(test) {
  config.sync = () => {
    return exec(test, {
      stdio : "inherit"
    }, function(error, stdout, stderr) {
      if(error) {
        console.log(error.stack || error);
      }
      if(stdout) {
        console.log(stdout);
      }
    }).on("error", console.warn);
  }
}

irrigable.write({
  bundleId : "cli-packagejson",
  config
});
