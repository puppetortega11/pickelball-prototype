import { render } from "@testing-library/react";
import React from "react";
import Home from "../src/app/page";

describe("Home page", () => {
  it("renders canvas element", () => {
    render(<Home />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas?.width).toBe(900);
    expect(canvas?.height).toBe(550);
  });
});
