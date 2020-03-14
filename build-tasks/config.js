var { Anathema } = require("anathema")
let anathema = new Anathema()

anathema.config = {
  projectName: "NauticalCalculationGuide",
  paths: {
    src: "lib",
    staticOut: "build/assets",
    buildRoot: "build",
  },
  packed: false,
}

module.exports = anathema
