export default function (el: HTMLElement, match: (el: HTMLElement) => boolean): HTMLElement | null {
  while (!match(el) && el.parentNode) {
    el = (el.parentNode as HTMLAnchorElement)
  }
  return match(el) ? el : null
}
