var anathema = require("./config")
var path = require("path")
var gitRev = require("git-rev")

const { src } = anathema.config.paths
const fontExts = ["eot", "woff", "woff2", "ttf"]
const imageExts = ["jpg", "png", "gif", "jpeg", "svg", "ico"]
const videoExts = ["mp4", "mov", "webm"]
const dataExts = ["json", "xml"]
const matcherPath =
  src +
  "/ui/**/*.{" +
  [].concat(fontExts, videoExts, imageExts, dataExts).join(",") +
  "}"

anathema.watcher("assets", matcherPath, ["assets"], { runOnStart: true })
anathema.task("assets", function(task) {
  const { staticOut, componentServerAssetsOut } = anathema.config.paths

  return task
    .src(matcherPath)
    .setWorkerThreshold(5)
    .transform((file) => {
      const segments = file.directory.split(path.sep)
      file.directory = segments.pop() || "Miscellaneous"
      // preserve binary data by setting original
      file.data = file.originalData
    })
    .output(staticOut)
    .output(componentServerAssetsOut)
})
