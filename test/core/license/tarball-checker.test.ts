import { describe, expect, test } from "bun:test";
import { detectLicenseFromText } from "../../../src/core/license/tarball-checker.js";

describe("detectLicenseFromText", () => {
  test("detects MIT license", () => {
    const text = `MIT License

Copyright (c) 2024 Example

Permission is hereby granted, free of charge, to any person obtaining a copy`;
    expect(detectLicenseFromText(text)).toBe("MIT");
  });

  test("detects Apache-2.0 license", () => {
    const text = `Apache License, Version 2.0

Licensed under the Apache License, Version 2.0`;
    expect(detectLicenseFromText(text)).toBe("Apache-2.0");
  });

  test("detects GPL-3.0 license", () => {
    const text = `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007`;
    expect(detectLicenseFromText(text)).toBe("GPL-3.0");
  });

  test("detects GPL-2.0 license", () => {
    const text = `GNU GENERAL PUBLIC LICENSE
Version 2, June 1991`;
    expect(detectLicenseFromText(text)).toBe("GPL-2.0");
  });

  test("detects AGPL-3.0 license", () => {
    const text = `GNU AFFERO GENERAL PUBLIC LICENSE
Version 3, 19 November 2007`;
    expect(detectLicenseFromText(text)).toBe("AGPL-3.0");
  });

  test("detects LGPL-2.1 license", () => {
    const text = `GNU LESSER GENERAL PUBLIC LICENSE
Version 2.1, February 1999`;
    expect(detectLicenseFromText(text)).toBe("LGPL-2.1");
  });

  test("detects ISC license", () => {
    const text = `ISC License

Permission to use, copy, modify, and/or distribute this software`;
    expect(detectLicenseFromText(text)).toBe("ISC");
  });

  test("detects BSD-3-Clause license", () => {
    const text = `BSD 3-Clause License

Redistributions of source code must retain the above copyright notice`;
    expect(detectLicenseFromText(text)).toBe("BSD-3-Clause");
  });

  test("detects BSD-2-Clause license", () => {
    const text = `BSD 2-Clause Simplified License`;
    expect(detectLicenseFromText(text)).toBe("BSD-2-Clause");
  });

  test("detects Unlicense", () => {
    const text = `This is free and unencumbered software released into the public domain.`;
    expect(detectLicenseFromText(text)).toBe("Unlicense");
  });

  test("detects MPL-2.0 license", () => {
    const text = `Mozilla Public License Version 2.0`;
    expect(detectLicenseFromText(text)).toBe("MPL-2.0");
  });

  test("returns null for unknown text", () => {
    expect(detectLicenseFromText("Some random text")).toBeNull();
  });
});
