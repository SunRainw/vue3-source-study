import minimist from "minimist";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { resolve } from "path";
import { createRequire } from "module";
import esbuild from "esbuild";

// node 中命令行参数通过process 来获取 process.argv
const args = minimist(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url); // 获取文件的绝对路径 file: => /user
const __dirname = dirname(__filename); // 获取文件的目录
const require = createRequire(import.meta.url);

const target = args._[0] || "reactivity"; // 打包的目录
const format = args.f || "iife"; // 打包后的模块化规范
 
// 入口文件，根据命令行提供的目录，找到对应的入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

esbuild.context({
  entryPoints: [entry], // 入口
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`), // 出口
  bundle: true, // 是否打包到一起
  platform: 'browser', // 打包给浏览器使用
  sourcemap: true, // 是否生成sourcemap
  format, // cjs esm iife
  globalName: pkg.buildOptions?.name, // 全局变量名, iife需要
}).then(ctx => {
  ctx.watch(); 
  ctx.serve({
    port: 3000,
    host: '0.0.0.0',
  });
});