import { h, Component, createContext, Fragment } from "preact"
import { useContext } from "preact/hooks"
import { observable, computed, action } from "mobx"
import { useObserver, useObservable } from "mobx-react-lite"
import { RenderContext } from "../RenderContext"
import {
  cos,
  atan,
  courseAngleToTrue,
  Latitude,
  LatitudeInput,
  Longitude,
  LongitudeInput,
  latFromFloat,
  lonFromFloat,
} from "./Shared"

export class MercatorSailingAtoBState {
  @observable point_a_lat: Latitude
  @observable point_a_lon: Longitude
  @observable point_b_lat: Latitude
  @observable point_b_lon: Longitude
  @observable start_mer_part: number
  @observable dest_mer_part: number

  constructor() {
    this.point_a_lat = new Latitude(34, 40, "S")
    this.point_a_lon = new Longitude(15, 20, "E")
    this.point_b_lat = new Latitude(11, 46, "N")
    this.point_b_lon = new Longitude(24, 39, "W")
    this.start_mer_part = 2206.61
    this.dest_mer_part = 706.25
  }
}

export default function MercatorSailingAtoB() {
  const { localize: l10n } = useContext(RenderContext)
  const state = useObservable(new MercatorSailingAtoBState())

  return useObserver(() => {
    const startingPoints = (
      <Fragment>
        <label>{l10n.t("mercator_sailing_ab.point_a")}</label>
        <LatitudeInput lat={state.point_a_lat} />{" "}
        <LongitudeInput lon={state.point_a_lon} />
        <br />
        <label>{l10n.t("mercator_sailing_ab.point_b")}</label>
        <LatitudeInput lat={state.point_b_lat} />{" "}
        <LongitudeInput lon={state.point_b_lon} />
        <br />
      </Fragment>
    )

    const dlat = state.point_a_lat.getDlat(state.point_b_lat)
    const dlon = state.point_a_lon.getDlon(state.point_b_lon)

    const measures = (
      <Fragment>
        <p>
          {`D'Lat = ${dlat.asString()} = ${dlat.asMinutes().toFixed(2)}'`}
          <br />
          {`D'Lon = ${dlon.asString()} = ${dlon.asMinutes().toFixed(2)}'`}
          <br />
        </p>
      </Fragment>
    )

    let calculation = null
    if (state.point_a_lat.asFloat() == state.point_b_lat.asFloat()) {
      const departure = dlon.asMinutes() * cos(state.point_a_lat.asDegrees())

      const course = dlon.sign == "E" ? "90\u00b0 T" : "270\u00b0 T"

      calculation = (
        <Fragment>
          <p>
            {l10n.t("mercator_sailing_ab.parallel_sailing")}
            <br />
            {`Latitude: ${state.point_a_lat.asString()}`}
            <br />
            {`Departure = D'Long (in minutes) * Cos Latitude`}
            <br />
            {`Departure = ${departure.toFixed(2)}nm`}
            <br />
            {`Distance = ${departure.toFixed(2)}nm`}
            <br />
            {`Course = ${course}`}
          </p>
        </Fragment>
      )
    } else {
      const meridionalParts = (
        <Fragment>
          <p>{l10n.t("mercator_sailing_ab.meridional_parts")}</p>
          <label>
            {l10n.t("mercator_sailing_ab.start_latitude") +
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
            {l10n.t("mercator_sailing_ab.end_latitude") +
              " " +
              state.point_b_lat.asString()}
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

      const dmp =
        state.point_b_lat.sign != state.point_a_lat.sign
          ? Math.abs(state.start_mer_part + state.dest_mer_part)
          : Math.abs(state.start_mer_part - state.dest_mer_part)
      const course_angle = atan(dlon.asMinutes() / dmp)
      const true_course = courseAngleToTrue(dlat.sign, course_angle, dlon.sign)
      const distance = dlat.asMinutes() / cos(course_angle)

      calculation = (
        <Fragment>
          {meridionalParts}
          <hr />
          <p>
            {l10n.t("mercator_sailing_ab.mercator_sailing")}
            <br />
            {`DMP: ${dmp.toFixed(2)}`}
            <br />
            {`Course Angle = Tan`}
            <sup>{"-1"}</sup>
            {` (D'Lon / DMP)`}
            <br />
            {`Course Angle = ${dlat.sign} ${course_angle.toFixed(1)}\u00b0 ${
              dlon.sign
            }`}
            <br />
            {`Course = ${true_course.toFixed(1)}\u00b0 T`}
            <br />
            {`Distance = D'Lat / Cos Course Angle`}
            <br />
            {`Distance = ${distance.toFixed(2)}nm`}
            <br />
          </p>
        </Fragment>
      )
    }
    return (
      <Fragment>
        <h1>{l10n.t("mercator_sailing_ab.title")}</h1>
        <hr />
        {startingPoints}
        <hr />
        {measures}
        <hr />
        {calculation}
      </Fragment>
    )
  })
}
