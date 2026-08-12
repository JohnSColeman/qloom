/**
 * Ported from com.tap5.hotelbooking.data.SearchCriteria — the Search page's
 * `@SessionState` SSO. Plain data (query + rowsPerPage), safe to persist.
 */
export class SearchCriteria {
  query = "";
  rowsPerPage = 10;

  /** Tapestry: `getSearchPattern()` — the term to match on, or null when empty. */
  getSearchPattern(): string | null {
    const q = this.query.trim();
    return q === "" ? null : q;
  }
}
