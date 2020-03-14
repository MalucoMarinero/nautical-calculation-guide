var anathema = require("./config")
var webpack = require("webpack")
var path = require("path")
var ReplacePlugin = require("webpack-plugin-replace")
var BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin
var nodeExternals = require("webpack-node-externals")

const scriptsMonitor = anathema.monitor("webpack")

const projectName = anathema.config.projectName

function generateWebpackConfig(task) {
  const {
    src,
    staticOut,
  } = anathema.config.paths
  const PACKED = anathema.config.packed

  const bundleAnalyzerPlugin = new BundleAnalyzerPlugin({
    generateStatsFile: true,
  })

  const serverDefinePlugin = anathema.config.packed
    ? new webpack.DefinePlugin({
        "process.env": {
          COMPONENT_MEDIA_SRC: "__dirname + '/../../../front-end/cms-media'",
        },
      })
    : new webpack.DefinePlugin({})

  const COMMON_CONFIG = {
    mode: PACKED ? "production" : "development",
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
        "react-dom/server": "preact/compat",
      },
    },
    module: {
      rules: PACKED
        ? [
            {
              test: /\.tsx?$/,
              include: path.resolve(__dirname, "../lib"),
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: "ts-loader",
                options: {
                  transpileOnly: true,
                },
              },
            },
          ]
        : [
            {
              test: /\.tsx?$/,
              loader: "ts-loader",
            },
          ],
    },
  }

  const CLIENT_COMMON_CONFIG = {
    externals: {
      jsdom: "false",
    },
    module: {
      rules: PACKED
        ? [
            {
              test: /\.tsx?$/,
              include: path.resolve(__dirname, "../lib"),
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: "ts-loader",
                options: {
                  transpileOnly: true,
                },
              },
            },
            {
              test: /\.js$/,
              include: path.resolve(__dirname, "../lib"),
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: "babel-loader",
                options: {
                  cacheDirectory: true,
                  presets: ["babel-preset-es2015"],
                },
              },
            },
          ]
        : [
            { test: /\.tsx?$/, loader: "ts-loader" },
            // supporting IE10 requires the below rule, add for testing
            {
              test: /\.js$/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: ["@babel/preset-env"],
                },
              },
            },
          ],
    },
  }

  const SERVER_COMMON_CONFIG = {
    externals: [nodeExternals()],
    target: "node",
    node: { __dirname: false },
  }

  const WEBPACK_CONFIG = [
    Object.assign({}, COMMON_CONFIG, CLIENT_COMMON_CONFIG, {
      entry: anathema.rootDirectory + "/lib/Main.tsx",
      node: { express: "empty", fs: "empty", net: "empty" },
      output: {
        filename: projectName + "Client.pkg.js",
        path: anathema.rootDirectory + "/" + staticOut,
      },
    }),
  ]

  return WEBPACK_CONFIG
}

function addIsolatedScriptTask(name, ix) {
  anathema.task(`scripts:isolated:${name}`, async function(task) {
    const {
      src,
      staticOut,
    } = anathema.config.paths
    const PACKED = anathema.config.packed
    const WEBPACK_CONFIG = generateWebpackConfig(task)
    await new Promise((resolve, reject) => {
      const compiler = webpack(WEBPACK_CONFIG[ix])
      compiler.run((err, stats) => {
        console.log(`Finished Compile: ${name}`)
        if (err) {
          return reject(err)
        }
        if (stats.hasErrors()) {
          return reject(
            stats.toString({
              all: false,
              errors: true,
              colors: true,
              chunks: false,
            })
          )
        }
        resolve(stats)
      })
    })
    task.stats.filesOutput.push(
      WEBPACK_CONFIG[ix].output.path + "/" + WEBPACK_CONFIG[ix].output.filename
    )
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    console.log(`The script uses approximately ${used} MB`)
    return true
  })
}

addIsolatedScriptTask("client", 0)
// addIsolatedScriptTask("viewlayer", 1)
// addIsolatedScriptTask("componentserver", 2)
// addIsolatedScriptTask("componentclient", 3)

anathema.task("scripts:isolated", async function(task) {
  const {
    src,
    staticOut,
    componentServerOut,
    viewLayerOut,
  } = anathema.config.paths
  const PACKED = anathema.config.packed
  const WEBPACK_CONFIG = generateWebpackConfig(task)
  await new Promise((resolve, reject) => {
    const compiler = webpack(WEBPACK_CONFIG[0])
    compiler.run((err, stats) => {
      console.log("Finished Compile: Spanner Client")
      if (err) {
        return reject(err)
      }
      if (stats.hasErrors()) {
        return reject(
          stats.toString({
            all: false,
            errors: true,
            colors: true,
            chunks: false,
          })
        )
      }
      resolve(stats)
    })
  })

  return true
})

anathema.task("scripts", function(task) {
  const {
    src,
    staticOut,
  } = anathema.config.paths
  const PACKED = anathema.config.packed
  const WEBPACK_CONFIG = generateWebpackConfig(task)
  const compiler = webpack(WEBPACK_CONFIG)

  if (task.runContext.dashboard) {
    compiler.watch({}, (err, stats) => {
      if (err) {
        return scriptsMonitor.reportFailure(err)
      }

      if (stats.hasErrors()) {
        return scriptsMonitor.reportFailure(
          stats.toString({
            all: false,
            errors: true,
            colors: true,
            chunks: false,
          })
        )
      }

      const start = Math.min(stats.stats.map((s) => s.startTime))
      const end = Math.max(stats.stats.map((s) => s.endTime))

      scriptsMonitor.reportSuccess(
        stats.toString({ colors: true }),
        end - start
      )
    })

    return Promise.resolve(true)
  } else {
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          return reject(err)
        }

        if (stats.hasErrors()) {
          return reject(
            stats.toString({
              all: false,
              errors: true,
              colors: true,
              chunks: false,
            })
          )
        }

        resolve(stats)
      })
    })
  }
})
