import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import {terser} from "rollup-plugin-terser";

const script = "swim-ripple";
const namespace = "swim";

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
    input: "./lib/main/index.js",
    output: {
      file: `./dist/main/${script}.js`,
      name: namespace,
      format: "umd",
      globals: globals,
      sourcemap: true,
      interop: false,
      extend: true,
      plugins: [beautify],
    },
    external: external,
    plugins: [
      nodeResolve({customResolveOptions: {paths: "."}}),
      sourcemaps(),
    ],
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY") return;
      warn(warning);
    },
  },
];
