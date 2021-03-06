let keyValueStore: {[key: string]: any} = {}
let fallbackNeeded = false


function setKeyValueItem (key: string, value: any) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    fallbackNeeded = true
    keyValueStore[key] = value
  }
}

function getKeyValueItem (key: string, defaultValue: any = null): any {
  if (!fallbackNeeded) {
    const value = window.sessionStorage.getItem(key)
    return value == null ? defaultValue : JSON.parse(value)
  } else {
    if (keyValueStore[key] != undefined) {
      return keyValueStore[key]
    } else {
      return defaultValue
    }
  }
}

function removeKeyValueItem (key: string): any {
  if (!fallbackNeeded) {
    window.sessionStorage.removeItem(key)
  } else {
    delete keyValueStore[key]
  }
}

function clearKeyValue (): any {
  if (!fallbackNeeded) {
    window.sessionStorage.clear()
  } else {
    keyValueStore = {}
  }
}

export default {
  set: setKeyValueItem,
  get: getKeyValueItem,
  remove: removeKeyValueItem,
  clear: clearKeyValue,
}
