import { afterEach, describe, expect, it, vi } from "vitest";
import { diagnoseDisease, fetchAdvisory, geocodePlace, registerFederationNode } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("fetchAdvisory", () => {
  it("posts the payload and returns parsed JSON on success", async () => {
    const payload = { location: { latitude: 1, longitude: 2 } };
    const responseBody = { soil_health_score: 80 };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAdvisory(payload);

    expect(result).toEqual(responseBody);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/advisory");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it("throws the server-provided detail message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ detail: "Weather provider error" }),
      })
    );

    await expect(fetchAdvisory({})).rejects.toThrow("Weather provider error");
  });

  it("falls back to statusText when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    await expect(fetchAdvisory({})).rejects.toThrow("Internal Server Error");
  });
});

describe("geocodePlace", () => {
  it("url-encodes the query", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    await geocodePlace("São Paulo, Brazil");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain(encodeURIComponent("São Paulo, Brazil"));
  });
});

describe("registerFederationNode", () => {
  it("does not send an X-API-Key header when VITE_FEDERATION_API_KEY is unset", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await registerFederationNode({ node_id: "n1", country: "India", region: "Bihar" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/federation/nodes");
    expect(options.headers["X-API-Key"]).toBeUndefined();
  });

  it("sends an X-API-Key header when VITE_FEDERATION_API_KEY is set", async () => {
    vi.stubEnv("VITE_FEDERATION_API_KEY", "demo-secret");
    vi.resetModules();
    const { registerFederationNode: registerWithKey } = await import("./api");

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await registerWithKey({ node_id: "n1", country: "India", region: "Bihar" });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["X-API-Key"]).toBe("demo-secret");
  });
});

describe("diagnoseDisease", () => {
  it("sends the file as multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ stress_level: "healthy" }) });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["leaf"], "leaf.png", { type: "image/png" });

    const result = await diagnoseDisease(file);

    expect(result.stress_level).toBe("healthy");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/disease/diagnose");
    expect(options.body).toBeInstanceOf(FormData);
  });
});
