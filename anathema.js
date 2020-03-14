const anathema = require("./build-tasks/config.js")
const tar = require("tar")
const path = require("path")
const mkdirp = require("mkdirp")
const livereload = require("livereload")
const LocalWebServer = require("local-web-server")
const { exec } = require("child_process")
const staticify = require("staticify")
const rename = require("rename")

require("./build-tasks/styles.js")
require("./build-tasks/assets.js")
require("./build-tasks/scripts.js")
require("./build-tasks/containers.js")

var gitRev = require("git-rev")
var del = require("del")

const { staticOut } = anathema.config.paths
const projectName = anathema.config.projectName

anathema.task("clean", function(task) {
  return del([anathema.rootDirectory + "/" + staticOut + "/**/*"]).then(
    (paths) => {
      task.stats.filesMatched = task.stats.filesMatched.concat(paths)
      return true
    }
  )
})

anathema.task("clean:dist", function(task) {
  const { serverDist } = anathema.config.paths
  return del([anathema.rootDirectory + "/" + serverDist + "/**/*"]).then(
    (paths) => {
      task.stats.filesMatched = task.stats.filesMatched.concat(paths)
      return true
    }
  )
})

let livereloadServer

anathema.dashboard("default", function(dashboard) {
  dashboard.task(["clean"])
  dashboard.task(["scripts"])
  dashboard.watch(["styles", "assets", "containers"])
  dashboard.monitor(["webpack"])
})

anathema.task("package:version", function(task) {
  return new Promise((resolve, reject) => {
    gitRev.short((str) => {
      task
        .srcFromString({
          name: "build_version",
          data: str,
        })
        .output("dist")
        .then(resolve, reject)
    })
  })
})

function doPackage(task, folder, name) {
  const tarDir = anathema.rootDirectory + "/dist"
  const tarPath = anathema.rootDirectory + "/dist/" + name
  return new Promise((resolve, reject) => {
    mkdirp(tarDir, function(err) {
      if (err) {
        return reject(err)
      }
    })

    Promise.all([
      tar
        .create(
          {
            gzip: true,
            cwd: anathema.rootDirectory + folder,
            file: tarPath,
          },
          ["."]
        )
        .then((out) => {
          task.stats.filesOutput.push(tarPath)
          return true
        }),
    ]).then(resolve, reject)
  })
}

anathema.task("package:deploy-scripts", function(task) {
  return task.src("deployment/*.sh").output("dist")
})
anathema.task("package:deployment", function(task) {
  return doPackage(task, "/deployment", "deployment.tar.gz")
})
anathema.task("package:server", function(task) {
  return doPackage(task, "/build/dist/server", "server.tar.gz")
})
anathema.task("package:styleguide", function(task) {
  return doPackage(task, "/build/dist/styleguide", "styleguide.tar.gz")
})
anathema.task("package:viewlayer", function(task) {
  return doPackage(task, "/build/dist/viewlayer", "viewlayer.tar.gz")
})

function setupBuildVars() {
  anathema.config.paths.staticOut = "build/assets"
  anathema.config.packed = true
}

anathema.task("build:dev", async function(task) {
  await anathema.run("clean", { source: "cli" })
  await anathema.run("scripts", { source: "cli" })
  await anathema.run("styles", { source: "cli" })
  await anathema.run("assets", { source: "cli" })
  await anathema.run("containers", { source: "cli" })
  return true
})

anathema.task("build", async function(task) {
  setupBuildVars()
  await anathema.run("build:initial", { source: "cli" })
  await anathema.run("build:scripts", { source: "cli" })
  await anathema.run("build:package", { source: "cli" })
  return true
})

anathema.task("build:initial", async function(task) {
  setupBuildVars()
  await Promise.all([anathema.run("clean:dist", { source: "cli" })])
  await Promise.all([
    anathema.run("server:files", { source: "cli" }),
    anathema.run("viewlayer:files", { source: "cli" }),
    anathema.run("styles", { source: "cli" }),
    anathema.run("assets", { source: "cli" }),
  ])
  return true
})

anathema.task("build:scripts", async function(task) {
  setupBuildVars()
  await Promise.all([anathema.run("scripts:isolated", { source: "cli" })])
  await Promise.all([
    anathema.run("build-static-styleguide", { source: "cli" }),
  ])
  return true
})

function addIsolatedScriptBuild(name) {
  anathema.task("build:scripts:" + name, async function(task) {
    setupBuildVars()
    await Promise.all([
      anathema.run("scripts:isolated:" + name, { source: "cli" }),
    ])
    return true
  })
}

addIsolatedScriptBuild("client")
// addIsolatedScriptBuild("viewlayer")
// addIsolatedScriptBuild("componentserver")
// addIsolatedScriptBuild("componentclient")

anathema.task("build:staticstyleguide", async function(task) {
  setupBuildVars()
  await Promise.all([
    anathema.run("build-static-styleguide", { source: "cli" }),
  ])
  return true
})

anathema.task("package:staticify", async function(task) {
  const staticRoot = staticify(
    path.join(__dirname, "build/dist/server/priv/static")
  )

  await task
    .src(
      [
        "build/dist/server/priv/static/" + projectName + "Main.css",
        "build/dist/server/priv/static/" + projectName + ".pkg.js",
        "build/dist/server/priv/static/admin.css",
        "build/dist/server/priv/static/Favicons/browserconfig.xml",
        "build/dist/server/priv/static/Favicons/site.webmanifest",
        "build/dist/server/**/*.eex",
        // "build/dist/viewlayer/" + projectName + "ViewLayer.server.js",
      ],
      {
        base: "build/dist",
      }
    )
    .transform((file) => {
      file.data = staticRoot.replacePaths(file.data)
    })
    .output("build/dist")

  await task
    .src(
      "build/dist/server/priv/static/**/*.{js,css,eot,svg,jpg,png,xml,json,ico,mp4,webm,woff,woff2,webmanifest}"
    )
    .transform((file) => {
      const key = path.join(file.directory || "/", file.name)
      file.name = path.basename(staticRoot.getVersionedPath(key))
      file.data = file.originalData
    })
    .output("build/dist/server/priv/static")

  return true
})

anathema.task("build:package", async function(task) {
  setupBuildVars()

  await Promise.all([anathema.run("package:staticify", { source: "cli" })])

  await Promise.all([
    anathema.run("package:deploy-scripts", { source: "cli" }),
    anathema.run("package:deployment", { source: "cli" }),
    anathema.run("package:server", { source: "cli" }),
    anathema.run("package:styleguide", { source: "cli" }),
    anathema.run("package:viewlayer", { source: "cli" }),
    anathema.run("package:version", { source: "cli" }),
  ])
  return true
})

module.exports = anathema
