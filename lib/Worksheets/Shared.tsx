import { h, Component, createContext } from "preact"
import { observable, computed, action } from "mobx"
import { useObserver, useObservable } from "mobx-react-lite"

export function cos(degrees: number) {
  return Math.cos((degrees * Math.PI) / 180)
}
export function acos(distance: number) {
  return (Math.acos(distance) * 180) / Math.PI
}
export function tan(degrees: number) {
  return Math.tan((degrees * Math.PI) / 180)
}
export function atan(distance: number) {
  return (Math.atan(distance) * 180) / Math.PI
}

export function courseAngleToTrue(
  lat: "N" | "S",
  angle: number,
  lon: "E" | "W"
) {
  return lat == "N"
    ? lon == "E"
      ? angle
      : 360 - angle
    : lon == "E"
    ? 180 - angle
    : 180 + angle
}

export function courseTrueToAngle(
  course: number
): ["N" | "S", number, "E" | "W"] {
  if (course < 90) {
    return ["N", course, "E"]
  } else if (course < 180) {
    return ["S", 180 - course, "E"]
  } else if (course < 270) {
    return ["S", course - 180, "W"]
  } else {
    return ["N", 360 - course, "W"]
  }
}

export function latFromFloat(lat: number) {
  const sign = lat > 0 ? "N" : "S"
  const mins = (Math.abs(lat) % 1) * 60
  return new Latitude(Math.floor(Math.abs(lat)), mins, sign)
}

export function lonFromFloat(lon: number) {
  if (lon > 180) {
    lon = 360 - lon
  } else if (lon < -180) {
    lon = -360 - lon
  }
  const sign = lon > 0 ? "E" : "W"
  const mins = (Math.abs(lon) % 1) * 60
  return new Longitude(Math.floor(Math.abs(lon)), mins, sign)
}

export class Latitude {
  @observable degrees: number
  @observable minutes: number
  @observable sign: "N" | "S"

  constructor(d = 0, m = 0, s: "N" | "S" = "N") {
    this.degrees = d
    this.minutes = m
    this.sign = s
  }

  asFloat() {
    return this.sign == "N" ? this.asDegrees() : this.asDegrees() * -1
  }

  asString() {
    return `${this.degrees.toFixed(0)}\u00b0 ${this.minutes.toFixed(2)}" ${
      this.sign
    }`
  }

  asDegrees() {
    return this.degrees + this.minutes / 60
  }

  asMinutes() {
    return this.degrees * 60 + this.minutes
  }

  getDlat(lat: Latitude) {
    if (lat.sign == this.sign) {
      if (lat.asDegrees() > this.asDegrees()) {
        const degs = lat.asDegrees() - this.asDegrees()
        const minutes = (degs % 1) * 60
        return new Latitude(Math.floor(degs), minutes, this.sign)
      } else {
        const degs = this.asDegrees() - lat.asDegrees()
        const minutes = (degs % 1) * 60
        return new Latitude(
          Math.floor(degs),
          minutes,
          this.sign == "S" ? "N" : "S"
        )
      }
    } else {
      const degs = lat.asDegrees() + this.asDegrees()
      const minutes = (degs % 1) * 60
      return new Latitude(Math.floor(degs), minutes, lat.sign)
    }
  }
}

export class Longitude {
  @observable degrees: number
  @observable minutes: number
  @observable sign: "E" | "W"

  constructor(d = 0, m = 0, s: "E" | "W" = "E") {
    this.degrees = d
    this.minutes = m
    this.sign = s
  }

  asFloat() {
    return this.sign == "E" ? this.asDegrees() : this.asDegrees() * -1
  }

  asString() {
    return `${this.degrees.toFixed(0)}\u00b0 ${this.minutes.toFixed(2)}" ${
      this.sign
    }`
  }

  asDegrees() {
    return this.degrees + this.minutes / 60
  }

  asMinutes() {
    return this.degrees * 60 + this.minutes
  }

  getDlon(lon: Longitude) {
    if (lon.sign == this.sign) {
      if (lon.asDegrees() > this.asDegrees()) {
        const degs = lon.asDegrees() - this.asDegrees()
        const minutes = (degs % 1) * 60
        return new Longitude(Math.floor(degs), minutes, this.sign)
      } else {
        const degs = this.asDegrees() - lon.asDegrees()
        const minutes = (degs % 1) * 60
        return new Longitude(
          Math.floor(degs),
          minutes,
          this.sign == "E" ? "W" : "E"
        )
      }
    } else {
      let degs = lon.asDegrees() + this.asDegrees()
      let minutes = (degs % 1) * 60
      let sign = lon.sign
      if (degs > 180) {
        degs = 360 - degs
        minutes = (degs % 1) * 60
        sign = this.sign
      }
      return new Longitude(Math.floor(degs), minutes, sign)
    }
  }
}

export interface LatitudeInputProps {
  lat: Latitude
}

export function LatitudeInput(props: LatitudeInputProps) {
  return useObserver(() => {
    return (
      <span>
        <input
          onChange={(e) =>
            (props.lat.degrees = (e.target as HTMLInputElement).valueAsNumber)
          }
          type="number"
          max="90"
          step="1"
          min="0"
          value={props.lat.degrees}
        />
        {"\u00B0 "}
        <input
          onChange={(e) =>
            (props.lat.minutes = (e.target as HTMLInputElement).valueAsNumber)
          }
          type="number"
          max="60"
          min="0"
          value={props.lat.minutes}
        />
        {'" '}
        <select
          value={props.lat.sign}
          onChange={(e) =>
            (props.lat.sign = (e.target as HTMLInputElement).value as "N" | "S")
          }
        >
          <option value="N">{"N"}</option>
          <option value="S">{"S"}</option>
        </select>
      </span>
    )
  })
}

export interface LongitudeInputProps {
  lon: Longitude
}

export function LongitudeInput(props: LongitudeInputProps) {
  return useObserver(() => {
    return (
      <span>
        <input
          onChange={(e) =>
            (props.lon.degrees = (e.target as HTMLInputElement).valueAsNumber)
          }
          type="number"
          max="180"
          step="1"
          min="0"
          value={props.lon.degrees}
        />
        {"\u00B0 "}
        <input
          onChange={(e) =>
            (props.lon.minutes = (e.target as HTMLInputElement).valueAsNumber)
          }
          type="number"
          max="60"
          min="0"
          value={props.lon.minutes}
        />
        {'" '}
        <select
          value={props.lon.sign}
          onChange={(e) =>
            (props.lon.sign = (e.target as HTMLInputElement).value as "E" | "W")
          }
        >
          <option value="E">{"E"}</option>
          <option value="W">{"W"}</option>
        </select>
      </span>
    )
  })
}
