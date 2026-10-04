import {
  GoogleGenerativeAI,
  ModelParams,
  RequestOptions,
  GenerateContentResult,
  Part,
} from "@google/generative-ai";

export const GEMINI_MODEL_CANDIDATES = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

// Module-level cache of the model that last worked (reset on server restart)
let cachedWorkingModel: string | null = null;

export function getCachedWorkingModel(): string | null {
  return cachedWorkingModel;
}

export function resetCachedModel(): void {
  cachedWorkingModel = null;
}

export type FallbackOptions = Omit<ModelParams, "model"> & {
  requestOptions?: RequestOptions;
};

export type GenerateContentInput =
  | string
  | Array<string | Part | Record<string, unknown>>
  | Parameters<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>[0];

function isModelNotFoundError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const status = (err as { status?: number })?.status;
  if (status === 404) return true;
  if (msg.includes("404")) return true;
  if (msg.includes("no longer available")) return true;
  if (msg.includes("not found")) return true;
  if (msg.includes("is not supported")) return true;
  return false;
}

export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("429")) return true;
  if (msg.includes("quota")) return true;
  if (msg.includes("rate limit") || msg.includes("rate_limit")) return true;
  if (msg.includes("resource_exhausted") || msg.includes("resource exhausted")) return true;
  if (msg.includes("too many requests")) return true;
  return false;
}

function getCandidateModels(): string[] {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const list = envModel
    ? [envModel, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== envModel)]
    : [...GEMINI_MODEL_CANDIDATES];

  // If there is a cached working model, try it first
  if (cachedWorkingModel && list.includes(cachedWorkingModel)) {
    return [
      cachedWorkingModel,
      ...list.filter((m) => m !== cachedWorkingModel),
    ];
  }

  return list;
}

export async function generateWithFallback(
  genAI: GoogleGenerativeAI,
  request: GenerateContentInput,
  options?: FallbackOptions
): Promise<GenerateContentResult> {
  const candidates = getCandidateModels();
  const triedCandidates: string[] = [];
  const { requestOptions, ...modelOptions } = options || {};

  for (const model of candidates) {
    triedCandidates.push(model);
    try {
      const generativeModel = genAI.getGenerativeModel(
        { model, ...modelOptions },
        requestOptions
      );
      const result = await generativeModel.generateContent(
        request as Parameters<typeof generativeModel.generateContent>[0]
      );

      if (cachedWorkingModel !== model) {
        console.error(`Gemini model chosen: ${model}`);
        cachedWorkingModel = model;
      }

      return result;
    } catch (err: unknown) {
      if (isModelNotFoundError(err)) {
        console.error(`Gemini model ${model} failed (not found / unavailable).`);
        if (cachedWorkingModel === model) {
          cachedWorkingModel = null;
        }
        continue;
      }

      // Any other error (quota, network, bad request, auth) is thrown immediately without trying other models
      throw err;
    }
  }

  throw new Error(
    `No available Gemini model for this API key. Tried: ${triedCandidates.join(", ")}.`
  );
}
