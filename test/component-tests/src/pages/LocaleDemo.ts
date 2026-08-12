import { Page } from "@qloom/runtime";

/** Static text comes from the co-located `.properties` bundles
 *  (`LocaleDemo.properties` = default/en, `LocaleDemo_fr.properties` = fr),
 *  consolidated at build time and registered in main.ts. `onlyEn` exists only in
 *  the default locale — a missing `fr` key falls back to it. A `<t:localeselector>`
 *  lets the user switch language at runtime (persisted, re-renders the page). */
export class LocaleDemo extends Page {}
