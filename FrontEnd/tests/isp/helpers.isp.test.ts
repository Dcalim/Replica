import { formatBytes, getFileKind, isPreviewableFile } from "../../src/utils/fileHelpers";

describe("ISP-20 C4 extension class", () => {
  test.each([
    ["P4.1 image", "a.jpg", "image"],
    ["P4.2 video", "a.mov", "video"],
    ["P4.3 document", "a.docx", "document"],
    ["P4.4 no extension", "README", "other"],
    ["P4.5 unknown", "a.xyz", "other"],
    ["P4.6 mixed case", "A.PNG", "image"],
    ["path with dots in dir", "/x.y/file", "other"],
    ["windows separators", "C:\\a\\b.MP4", "video"],
  ])("%s", (_n, p, kind) => expect(getFileKind(p)).toBe(kind));
});

describe("ISP-21 preview-eligible vs not", () => {
  test.each([["a.png", true], ["a.PDF", true], ["a.mp4", false], ["a.txt", false], ["noext", false]])(
    "%s -> %s", (p, ok) => expect(isPreviewableFile(p)).toBe(ok));
});

describe("ISP-24 formatBytes by magnitude", () => {
  test.each([
    [0, "0 B"], [512, "512 B"], [2048, "2.00 KB"], [15 * 1024, "15.0 KB"],
    [5 * 1024 ** 2, "5.00 MB"], [3 * 1024 ** 3, "3.00 GB"], [1024 ** 5, "1024.0 TB"],
  ])("%d -> %s", (n, s) => expect(formatBytes(n)).toBe(s));
});
