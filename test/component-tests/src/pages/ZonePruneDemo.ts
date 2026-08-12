import { Page } from "@qloom/runtime";

/** Two zones + a link to a zero-zone page. After navigating away, the two
 *  registrations must be pruned (not leaked). */
export class ZonePruneDemo extends Page {}
