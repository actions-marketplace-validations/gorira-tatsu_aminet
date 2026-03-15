import { classifyLicense } from "./spdx.js";

export type FsfStatus = "free" | "nonfree" | "unknown";

export interface LicenseReference {
  spdxId: string;
  displayName: string;
  category: ReturnType<typeof classifyLicense>;
  osiApproved: boolean | null;
  fsfStatus: FsfStatus;
  originalTextUrl: string;
  japaneseTextUrl: string | null;
}

interface LicenseReferenceSeed {
  displayName?: string;
  osiApproved?: boolean | null;
  fsfStatus?: FsfStatus;
  japanesePath?: string | null;
}

const LICENSE_REFERENCE_SEEDS: Record<string, LicenseReferenceSeed> = {
  MIT: { displayName: "MIT License", osiApproved: true, fsfStatus: "free" },
  ISC: { displayName: "ISC License", osiApproved: true, fsfStatus: "free" },
  "BSD-2-Clause": {
    displayName: 'BSD 2-Clause "Simplified" License',
    osiApproved: true,
    fsfStatus: "free",
  },
  "BSD-3-Clause": {
    displayName: 'BSD 3-Clause "New" or "Revised" License',
    osiApproved: true,
    fsfStatus: "free",
  },
  "Apache-2.0": { displayName: "Apache License 2.0", osiApproved: true, fsfStatus: "free" },
  Unlicense: { displayName: "The Unlicense", osiApproved: true, fsfStatus: "free" },
  "BlueOak-1.0.0": { displayName: "Blue Oak Model License 1.0.0", osiApproved: null },
  "Artistic-2.0": { displayName: "Artistic License 2.0", osiApproved: true, fsfStatus: "free" },
  Zlib: { displayName: "zlib License", osiApproved: true, fsfStatus: "free" },
  "PSF-2.0": {
    displayName: "Python Software Foundation License 2.0",
    osiApproved: true,
    fsfStatus: "free",
  },
  "Python-2.0": { displayName: "Python License 2.0", osiApproved: true, fsfStatus: "free" },
  X11: { displayName: "X11 License", osiApproved: true, fsfStatus: "free" },
  "CC-BY-3.0": {
    displayName: "Creative Commons Attribution 3.0",
    osiApproved: null,
    fsfStatus: "unknown",
  },
  "CC-BY-4.0": {
    displayName: "Creative Commons Attribution 4.0",
    osiApproved: null,
    fsfStatus: "unknown",
  },
  "BSL-1.0": { displayName: "Boost Software License 1.0", osiApproved: true, fsfStatus: "free" },
  W3C: { displayName: "W3C Software Notice and License", osiApproved: true, fsfStatus: "free" },
  "GPL-2.0": {
    displayName: "GNU General Public License v2.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "GPL-2.0-only": {
    displayName: "GNU General Public License v2.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "GPL-2.0-or-later": {
    displayName: "GNU General Public License v2.0 or later",
    osiApproved: true,
    fsfStatus: "free",
  },
  "GPL-3.0": {
    displayName: "GNU General Public License v3.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "GPL-3.0-only": {
    displayName: "GNU General Public License v3.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "GPL-3.0-or-later": {
    displayName: "GNU General Public License v3.0 or later",
    osiApproved: true,
    fsfStatus: "free",
  },
  "AGPL-3.0": {
    displayName: "GNU Affero General Public License v3.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "AGPL-3.0-only": {
    displayName: "GNU Affero General Public License v3.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "AGPL-3.0-or-later": {
    displayName: "GNU Affero General Public License v3.0 or later",
    osiApproved: true,
    fsfStatus: "free",
  },
  "EUPL-1.1": {
    displayName: "European Union Public Licence 1.1",
    osiApproved: true,
    fsfStatus: "free",
  },
  "EUPL-1.2": {
    displayName: "European Union Public Licence 1.2",
    osiApproved: true,
    fsfStatus: "free",
  },
  "SSPL-1.0": {
    displayName: "Server Side Public License 1.0",
    osiApproved: false,
    fsfStatus: "nonfree",
  },
  "OSL-3.0": { displayName: "Open Software License 3.0", osiApproved: true, fsfStatus: "free" },
  "LGPL-2.0": {
    displayName: "GNU Lesser General Public License v2.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-2.0-only": {
    displayName: "GNU Lesser General Public License v2.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-2.0-or-later": {
    displayName: "GNU Lesser General Public License v2.0 or later",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-2.1": {
    displayName: "GNU Lesser General Public License v2.1 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-2.1-only": {
    displayName: "GNU Lesser General Public License v2.1 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-2.1-or-later": {
    displayName: "GNU Lesser General Public License v2.1 or later",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-3.0": {
    displayName: "GNU Lesser General Public License v3.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-3.0-only": {
    displayName: "GNU Lesser General Public License v3.0 only",
    osiApproved: true,
    fsfStatus: "free",
  },
  "LGPL-3.0-or-later": {
    displayName: "GNU Lesser General Public License v3.0 or later",
    osiApproved: true,
    fsfStatus: "free",
  },
  "MPL-2.0": { displayName: "Mozilla Public License 2.0", osiApproved: true, fsfStatus: "free" },
  "EPL-1.0": { displayName: "Eclipse Public License 1.0", osiApproved: true, fsfStatus: "free" },
  "EPL-2.0": { displayName: "Eclipse Public License 2.0", osiApproved: true, fsfStatus: "free" },
  "CDDL-1.0": {
    displayName: "Common Development and Distribution License 1.0",
    osiApproved: true,
    fsfStatus: "free",
  },
  "CDDL-1.1": {
    displayName: "Common Development and Distribution License 1.1",
    osiApproved: true,
    fsfStatus: "free",
  },
  "CPL-1.0": { displayName: "Common Public License 1.0", osiApproved: true, fsfStatus: "free" },
};

const OPEN_SOURCE_JP_BASE = "https://github.com/opensource-jp/licenses/tree/master";

export function resolveLicenseReference(spdxId: string): LicenseReference {
  const seed = LICENSE_REFERENCE_SEEDS[spdxId];
  const encodedId = encodeURIComponent(spdxId);

  return {
    spdxId,
    displayName: seed?.displayName ?? spdxId,
    category: classifyLicense(spdxId),
    osiApproved: seed?.osiApproved ?? null,
    fsfStatus: seed?.fsfStatus ?? "unknown",
    originalTextUrl: `https://spdx.org/licenses/${encodedId}.html#licenseText`,
    japaneseTextUrl:
      seed?.japanesePath === null
        ? null
        : `${OPEN_SOURCE_JP_BASE}/${seed?.japanesePath ?? encodedId}`,
  };
}
