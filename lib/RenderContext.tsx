import { createElement, createContext } from "preact"
import LocalizeContext from "./platform/Localize"

export interface NCGAppContext {
  localize?: LocalizeContext
}

export const RenderContext = createContext({} as NCGAppContext)

export function generateFullContext(context: NCGAppContext, children: any) {
  return createElement(RenderContext.Provider, {
    value: context,
    children: children,
  })
}
