import { render, screen } from "../test-utils";
import { describe, expect, it } from "vitest";
import AdvisoryResults from "./AdvisoryResults";

const SAMPLE_DATA = {
  location: { latitude: 21.14, longitude: 79.08, place_name: "Nagpur, India" },
  soil_health_score: 82.5,
  crop_recommendations: [
    { crop: "cotton", confidence: 0.51, rationale: "Matches cotton requirements." },
    { crop: "sorghum", confidence: 0.3, rationale: "Matches sorghum requirements." },
  ],
  weather: {
    source: "open-meteo.com",
    daily_dates: ["2026-01-01", "2026-01-02"],
    temperature_max_c: [30, 31],
    temperature_min_c: [20, 21],
    precipitation_mm: [5, 8],
    relative_humidity_pct: 70,
  },
  climate: {
    source: "power.larc.nasa.gov (satellite + reanalysis)",
    solar_radiation_kwh_m2: 6.2,
    avg_precipitation_mm_day: 3.1,
    avg_temperature_c: 26.4,
    soil_moisture_proxy_pct: 45.0,
    period: "2026-01-01 to 2026-01-30",
  },
  regenerative_practices: [
    { practice: "Rotate in a nitrogen-fixing legume", reason: "Low nitrogen", priority: "high" },
  ],
  generated_at: "2026-01-30T00:00:00Z",
};

describe("AdvisoryResults", () => {
  it("renders nothing when there is no data", () => {
    const { container } = render(<AdvisoryResults data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the soil health score, crop recommendations and practices", () => {
    render(<AdvisoryResults data={SAMPLE_DATA} />);

    expect(screen.getByText("82.5")).toBeInTheDocument();
    expect(screen.getByText("cotton")).toBeInTheDocument();
    expect(screen.getByText("51%")).toBeInTheDocument();
    expect(screen.getByText(/rotate in a nitrogen-fixing legume/i)).toBeInTheDocument();
    expect(screen.getByText(/open-meteo.com/)).toBeInTheDocument();
    expect(screen.getByText(/power.larc.nasa.gov/)).toBeInTheDocument();
  });
});
