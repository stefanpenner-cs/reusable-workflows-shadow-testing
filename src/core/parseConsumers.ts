export type Consumer = { repo: string; ref: string };

const REPO_RE = /^[^/\s]+\/[^/\s]+$/;

function parseConsumer(entry: unknown, index: number): Consumer {
  if (typeof entry !== 'object' || entry === null) {
    throw new TypeError(`consumer[${index}]: expected an object, got ${entry === null ? 'null' : typeof entry}`);
  }
  const { repo, ref } = entry as Record<string, unknown>;
  if (typeof repo !== 'string' || !REPO_RE.test(repo)) {
    throw new TypeError(`consumer[${index}].repo: expected "owner/name", got ${JSON.stringify(repo)}`);
  }
  if (ref !== undefined && (typeof ref !== 'string' || ref.length === 0)) {
    throw new TypeError(`consumer[${index}].ref: expected a non-empty string, got ${JSON.stringify(ref)}`);
  }
  return { repo, ref: ref === undefined ? 'main' : ref };
}

/** Parse + validate the provider's shadow-consumers.json. Throws on bad JSON or shape. */
export function parseConsumers(json: string): Consumer[] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) {
    throw new TypeError(`expected an array of consumers, got ${data === null ? 'null' : typeof data}`);
  }
  return data.map(parseConsumer);
}
