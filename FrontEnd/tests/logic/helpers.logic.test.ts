// apiService and axiosInterceptor use import.meta.env (Vite-only), which ts-jest cannot compile to CommonJS.
jest.mock("../../src/services/apiService", () => ({}));
jest.mock("../../src/services/axiosInterceptor", () => ({ ApiError: class extends Error {} }));

import {
  formatBytes, getFileExtension, getFileKind, isPreviewableFile,
} from "../../src/utils/fileHelpers";
import uiReducer, { setSelectedFiles, toggleFileSelected } from "../../src/reducers/ui";

describe("LC-40 dotIndex === -1", () => {
  test.each([["README", ""], ["a.txt", "txt"], [".gitignore", "gitignore"], ["a.", ""]])(
    "LC-40 %s -> %j", (p, ext) => expect(getFileExtension(p)).toBe(ext));
});

describe("LC-41 getFileKind chain", () => {
  test.each([["a.png", "image"], ["a.mp4", "video"], ["a.pdf", "document"], ["a.zip", "other"]])(
    "LC-41 %s -> %s", (p, k) => expect(getFileKind(p)).toBe(k));
});

describe("LC-42 isImageFile || isPdfFile (CACC)", () => {
  test("LC-42-1 image=T,pdf=F -> T", () => expect(isPreviewableFile("a.png")).toBe(true));
  test("LC-42-2 image=F,pdf=T -> T", () => expect(isPreviewableFile("a.pdf")).toBe(true));
  test("LC-42-3 image=F,pdf=F -> F", () => expect(isPreviewableFile("a.txt")).toBe(false));
});

describe("LC-43 formatBytes", () => {
  test.each([[0, "0 B"], [1023, "1023 B"], [1024, "1.00 KB"], [1024 ** 5, "1024.0 TB"]])(
    "LC-43 %d -> %s (last: unit index clamped to TB)", (n, s) => expect(formatBytes(n)).toBe(s));
});

describe("LC-44 toggleFileSelected", () => {
  const start = { ...uiReducer(undefined, { type: "init" }) };
  test("LC-44-T add absent", () =>
    expect(uiReducer(start, toggleFileSelected("/a")).selectedFiles).toEqual(["/a"]));
  test("LC-44-F remove present", () => {
    const s = uiReducer(start, toggleFileSelected("/a"));
    expect(uiReducer(s, toggleFileSelected("/a")).selectedFiles).toEqual([]);
  });
});

// LC-45: the all-but-one decision lives inside ResultsView.tsx (a component), so only the
// reducer side (setSelectedFiles) is testable without a React renderer.
describe("LC-45 (reducer side only) setSelectedFiles", () => {
  test("replaces selection; empty array clears", () => {
    const s = uiReducer(undefined, setSelectedFiles(["/b", "/c"]));
    expect(s.selectedFiles).toEqual(["/b", "/c"]);
    expect(uiReducer(s, setSelectedFiles([])).selectedFiles).toEqual([]);
  });
});
