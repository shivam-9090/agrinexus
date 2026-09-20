import { render, screen, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdvisoryForm from "./AdvisoryForm";

vi.mock("../api", () => ({
  geocodePlace: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("AdvisoryForm", () => {
  it("submits well-formed defaults without showing validation errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AdvisoryForm onSubmit={onSubmit} loading={false} />);

    await user.click(screen.getByRole("button", { name: /get regenerative advisory/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.location.latitude).toBeCloseTo(21.1458);
    expect(payload.soil.nitrogen).toBe(60);
    expect(screen.queryByText(/must be between/i)).not.toBeInTheDocument();
  });

  it("blocks submission and shows an error when pH is out of range", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AdvisoryForm onSubmit={onSubmit} loading={false} />);

    const phInput = screen.getByLabelText(/^pH$/i);
    await user.clear(phInput);
    await user.type(phInput, "20");
    await user.click(screen.getByRole("button", { name: /get regenerative advisory/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/ph must be between 0 and 14/i)).toBeInTheDocument();
  });

  it("blocks submission when nitrogen is negative", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AdvisoryForm onSubmit={onSubmit} loading={false} />);

    const nitrogenInput = screen.getByLabelText(/nitrogen/i);
    await user.clear(nitrogenInput);
    await user.type(nitrogenInput, "-5");
    await user.click(screen.getByRole("button", { name: /get regenerative advisory/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/nitrogen must be between 0 and 300/i)).toBeInTheDocument();
  });

  it("disables the submit button while loading", () => {
    render(<AdvisoryForm onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByRole("button", { name: /fetching advisory/i })).toBeDisabled();
  });

  it("populates location fields when a geocode suggestion is picked", async () => {
    const { geocodePlace } = await import("../api");
    geocodePlace.mockResolvedValue([
      { name: "Nagpur", country: "India", latitude: 21.15, longitude: 79.09, admin1: "Maharashtra" },
    ]);
    const user = userEvent.setup();
    render(<AdvisoryForm onSubmit={vi.fn()} loading={false} />);

    await user.type(screen.getByPlaceholderText(/e.g. nagpur/i), "Nagpur");
    await user.click(screen.getByRole("button", { name: "Search" }));

    const suggestion = await screen.findByText(/Nagpur, Maharashtra, India/i);
    await user.click(suggestion);

    await waitFor(() => {
      expect(screen.getByLabelText(/latitude/i)).toHaveValue(21.15);
    });
  });
});
