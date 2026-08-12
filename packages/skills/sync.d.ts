/** The skills source directory (bundled copy when published, `.agents/skills` in-repo). */
export declare const skillsDir: string;

/** The Tapestry template schema directory (bundled copy when published, repo-root `schema/` in-repo). */
export declare const schemaDir: string;

/**
 * Copy Qloom's authoring skills into a project so an AI coding agent discovers them.
 * @param projectRoot target project root (default: process.cwd())
 * @param opts.subdir location under the project (default ".agents/skills")
 * @param opts.source override the skills source directory
 * @returns the skill names synced
 */
export declare function syncSkills(
  projectRoot?: string,
  opts?: { subdir?: string; source?: string },
): Promise<string[]>;

/**
 * Copy Qloom's bundled Tapestry template schema into a project so a `.tml`'s
 * `xmlns:t` declaration resolves locally (e.g. for an IDE's XML validator).
 * @param projectRoot target project root (default: process.cwd())
 * @param opts.subdir location under the project (default "schema")
 * @param opts.source override the schema source directory
 * @returns the schema file names synced
 */
export declare function syncSchema(
  projectRoot?: string,
  opts?: { subdir?: string; source?: string },
): Promise<string[]>;
