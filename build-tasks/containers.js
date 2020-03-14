var anathema = require("./config")
var pug = require("pug")

const { src } = anathema.config.paths

anathema.watcher("containers", src + "/**/*.html", ["containers"], {
  runOnStart: true,
})
anathema.task("containers", function(task) {
  const { staticOut, buildRoot } = anathema.config.paths
  return task
    .src(src + "/**/*.pug")
    .transform((file) => {
      file.data = pug.render(file.data, { pretty: true })
      file.name = file.name.replace(".pug", ".html")
    })
    .output(buildRoot)
})
