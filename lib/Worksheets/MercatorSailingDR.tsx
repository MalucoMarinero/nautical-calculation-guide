import { h, Component, createContext, Fragment } from "preact"
import { useContext } from "preact/hooks"
import { observable, computed, action } from "mobx"
import { useObserver, useObservable } from "mobx-react-lite"
import { RenderContext } from "../RenderContext"
import {
  cos,
  acos,
  tan,
  atan,
  courseAngleToTrue,
  courseTrueToAngle,
  Latitude,
  LatitudeInput,
  Longitude,
  LongitudeInput,
  latFromFloat,
  lonFromFloat,
} from "./Shared"

export class MercatorSailingDRState {
  @observable point_a_lat: Latitude
  @observable point_a_lon: Longitude
  @observable course: number
  @observable speed: number
  @observable time: number
  @observable start_mer_part: number
  @observable dest_mer_part: number

  constructor() {
    this.point_a_lat = new Latitude(36, 45, "S")
    this.point_a_lon = new Longitude(0, 28, "W")
    this.course = 67
    this.speed = 10
    this.time = 126
    this.start_mer_part = 2359.87
    this.dest_mer_part = 1777.41
  }
}

export default function MercatorSailingDR() {
  const { localize: l10n } = useContext(RenderContext)
  const state = useObservable(new MercatorSailingDRState())

  return useObserver(() => {
    const startingPoints = (
      <Fragment>
        <label>{l10n.t("mercator_sailing_dr.start")}</label>
        <LatitudeInput lat={state.point_a_lat} />{" "}
        <LongitudeInput lon={state.point_a_lon} />
        <br />
        <label>
          {l10n.t("mercator_sailing_dr.course")}
          <input
            onChange={(e) =>
              (state.course = (e.target as HTMLInputElement).valueAsNumber)
            }
            type="number"
            max="360"
            min="0"
            value={state.course}
          />
        </label>
        <br />
        <label>
          {l10n.t("mercator_sailing_dr.speed")}
          <input
            onChange={(e) =>
              (state.speed = (e.target as HTMLInputElement).valueAsNumber)
            }
            type="number"
            min="0"
            value={state.speed}
          />
        </label>
        <br />
        <label>
          {l10n.t("mercator_sailing_dr.time")}
          <input
            onChange={(e) =>
              (state.time = (e.target as HTMLInputElement).valueAsNumber)
            }
            type="number"
            min="0"
            value={state.time}
          />
        </label>
        <br />
      </Fragment>
    )

    const distance = state.speed * state.time
    const [ca_lat, ca, ca_lon] = courseTrueToAngle(state.course)

    const measures = (
      <Fragment>
        <p>
          {`Distance = ${distance.toFixed(2)} nm`}
          <br />
          {`Course Angle = ${ca_lat} ${ca.toFixed(1)}\u00b0 ${ca_lon}`}
          <br />
        </p>
      </Fragment>
    )

    const dlat_deg = (distance * cos(ca)) / 60
    const dlat = latFromFloat(ca_lat == "S" ? dlat_deg * -1 : dlat_deg)
    const dest_lat = latFromFloat(state.point_a_lat.asFloat() + dlat.asFloat())

    const calculationOne = (
      <Fragment>
        <p>
          {`D'Lat = Distance * Cos Course Angle`}
          <br />
          {`D'Lat = ${dlat.asString()} = ${dlat
            .asMinutes()
            .toFixed(2)} = ${dlat.asDegrees().toFixed(3)}\u00b0`}
          <br />
        </p>
      </Fragment>
    )

    const meridionalParts = (
      <Fragment>
        <p>{l10n.t("mercator_sailing_dr.meridional_parts")}</p>
        <label>
          {l10n.t("mercator_sailing_dr.start_latitude") +
            " " +
            state.point_a_lat.asString()}
          <input
            onChange={(e) =>
              (state.start_mer_part = (e.target as HTMLInputElement).valueAsNumber)
            }
            type="number"
            min="0"
            value={state.start_mer_part}
          />
        </label>
        <br />
        <label>
          {l10n.t("mercator_sailing_dr.end_latitude") +
            " " +
            dest_lat.asString()}
          <input
            onChange={(e) =>
              (state.dest_mer_part = (e.target as HTMLInputElement).valueAsNumber)
            }
            type="number"
            min="0"
            value={state.dest_mer_part}
          />
        </label>
      </Fragment>
    )

    const dmp = Math.abs(state.start_mer_part - state.dest_mer_part)
    const dlon_deg = (dmp * tan(ca)) / 60
    const dlon = lonFromFloat(ca_lon == "E" ? dlon_deg : dlon_deg * -1)

    const dest_lon = lonFromFloat(state.point_a_lon.asFloat() + dlon.asFloat())

    const calculationTwo = (
      <Fragment>
        <p>
          <br />
          {`DMP = Start Meridional Part - Dest Meridional Part`}
          <br />
          {`DMP = ${dmp.toFixed(2)}`}
          <br />
          {`D'Lon = DMP * Tan Course Angle`}
          <br />
          {`D'Lon = ${dlon.asString()} = ${dlon
            .asMinutes()
            .toFixed(2)} = ${dlon.asDegrees().toFixed(3)}\u00b0`}
          <br />
        </p>
        <hr />
        <p>{`Destination = ${dest_lat.asString()}, ${dest_lon.asString()}`}</p>
      </Fragment>
    )

    return (
      <Fragment>
        <h1>{l10n.t("mercator_sailing_dr.title")}</h1>
        <hr />
        {startingPoints}
        <hr />
        {measures}
        <hr />
        {calculationOne}
        <hr />
        {meridionalParts}
        <hr />
        {calculationTwo}
        <hr />
      </Fragment>
    )
  })
}
