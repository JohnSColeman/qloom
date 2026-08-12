import { Page, Property } from "@qloom/runtime";
import { swapiApi } from "../../dal/Swapi";

interface FilmRow {
  title: string | null;
  episodeID: number | null;
  director: string | null;
  releaseDate: string | null;
}

export class Films extends Page {
  @Property films: FilmRow[] = [];
  @Property film!: FilmRow; // loop variable
  @Property error = "";

  override async onActivate(): Promise<void> {
    const result = await swapiApi.AllFilms({});
    result.fold(
      (err) => {
        this.error = err.message;
      },
      (data) => {
        this.films = (data.allFilms?.films ?? []).filter((f): f is FilmRow => f !== null);
      },
    );
  }

  get hasError(): boolean {
    return this.error.length > 0;
  }
}
