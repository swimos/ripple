import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import {terser} from "rollup-plugin-terser";
import * as pkg from "../package.json";
const script = "ripple-demo";

const external = [
  /^@nstream\//,
  /^@swim\//
];

const globals = function (name) {
  if (/^@nstream\//.test(name)) {
    return "nstream";
  } else if (/^@swim\//.test(name)) {
    return "swim";
  }
  return void 0;
};

const beautify = terser({
  compress: false,
  mangle: false,
  output: {
    preamble: `// ${pkg.name} v${pkg.version} (c) ${pkg.copyright}`,
    beautify: true,
    comments: false,
    indent_level: 2,
  },
});
export default [
  {
    input: "../build/typescript/index.js",
    output: {
      file: `../build/javascript/${script}.min.js`,
      format: "esm",
      generatedCode: {
        preset: "es2015",
        constBindings: true,
      },
      sourcemap: true,
      plugins: [beautify],
    },
    external: external.concat("tslib"),
    plugins: [
      nodeResolve(),
      sourcemaps(),
    ],
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY") return;
      warn(warning);
    },
  },
  {
    input: "../build/typescript/index.js",
    output: {
      file: `../build/javascript/${script}.min.js`,
      name: "swim.rippleDemo",
      format: "umd",
      globals: globals,
      generatedCode: {
        preset: "es2015",
        constBindings: true,
      },
      sourcemap: true,
      interop: "esModule",
      extend: true,
      plugins: [beautify],
    },
    external: external,
    plugins: [
      nodeResolve(),
      sourcemaps(),
    ],
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY") return;
      warn(warning);
    },
  },
];
