import { Component, Parameter } from "@qloom/runtime";
import { Assets } from "@qloom/core";

/**
 * Tapestry: `com.tap5.hotelbooking.components.HotelClass` — used with beandisplay
 * to show the star-rating image for a hotel's class.
 *
 * Mechanical port of the Java: `@Parameter(required=true) stars` plus a
 * `getHotelClass()` returning the star image path. Tapestry resolves the path via
 * `assetSource.getContextAsset("/static/%d-star.gif")`; Qloom resolves the same
 * `public/static/N-star.gif` asset through `Assets.contextPath` (the client
 * analogue), so it honours the mount base-path under a sub-path deployment.
 * Rendering comes from the unchanged `HotelClass.tml`
 * (`<dd class="stars"><img src="${hotelClass}" .../></dd>`).
 */
export class HotelClass extends Component {
  @Parameter({ required: true }) stars = 0;

  /** Path to the star image for this hotel's number of stars. */
  get hotelClass(): string {
    return Assets.contextPath(`/static/${this.stars}-star.gif`);
  }
}
