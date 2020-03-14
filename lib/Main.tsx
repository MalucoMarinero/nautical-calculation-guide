import { h, Component, createContext, render } from "preact"
import { useState, useContext } from "preact/hooks"
import LocalizeContext from "./platform/Localize"
import localeEn from "./locales/en.json"
import { RenderContext, generateFullContext } from "./RenderContext"
import PlaneSailingAtoB from "./Worksheets/PlaneSailingAtoB"
import PlaneSailingDR from "./Worksheets/PlaneSailingDR"

document.addEventListener("DOMContentLoaded", function(event) {
  const appContainer = document.getElementById("app")
  const localize = new LocalizeContext("en", {
    en: localeEn,
  })
  const context = {
    localize,
  }

  render(generateFullContext(context, <MainView />), appContainer)
})

function MainView() {
  const { localize: l10n } = useContext(RenderContext)
  const [page, setPage] = useState("home")

  let view = null

  console.log(page)

  switch (page) {
    case "plane_sailing_ab":
      view = <PlaneSailingAtoB />
      break
    case "plane_sailing_dr":
      view = <PlaneSailingDR />
      break
    default:
      view = <ChooseWorksheet setPage={setPage} />
      break
  }

  return (
    <div>
      <header>
        <h1>{l10n.t("title")}</h1>
      </header>
      <main>{view}</main>
    </div>
  )
}

interface ChooseWorksheetProps {
  setPage: (id: string) => void
}

function ChooseWorksheet(props: ChooseWorksheetProps) {
  const { localize: l10n } = useContext(RenderContext)

  return (
    <ul>
      <li>
        <a onClick={() => props.setPage("plane_sailing_ab")}>
          {l10n.t("plane_sailing_ab.title")}
        </a>
      </li>
      <li>
        <a onClick={() => props.setPage("plane_sailing_dr")}>
          {l10n.t("plane_sailing_dr.title")}
        </a>
      </li>
    </ul>
  )
}
