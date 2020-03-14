export function getScrollY () {
  return window.pageYOffset || window.scrollY || 0
}

export function getScrollX () {
  return window.pageXOffset || window.scrollX || 0
}

export default function getPosition (el: HTMLElement) {
  return {
    size: getSize(el),
    offset: getOffsetPosition(el),
    absolute: getAbsolutePosition(el),
  }
}

export function getOffsetPosition (el: HTMLElement) {
  return {
    parent: el.offsetParent,
    x: el.offsetLeft,
    y: el.offsetTop,
  }
}

export function getAbsolutePosition (el: HTMLElement) {
  const bounds = el.getBoundingClientRect()
  const scrollY = getScrollY()
  const scrollX = getScrollX()

  return {
    x: scrollX + bounds.left,
    y: scrollY + bounds.top,
  }
}

export function getSize (el: HTMLElement) {
  return {
    x: el.offsetWidth,
    y: el.offsetHeight,
  }
}
