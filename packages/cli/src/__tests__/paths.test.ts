import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getCacheDir,
  getCacheFile,
  getHistoryPath,
  getJelmaCloudConfigPath,
  getJelmaDir,
  getSshDir,
  getTmpDir,
  getUpdateFailedPath,
  getUserHome,
} from "../shared/paths";

describe("paths", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = {
      ...process.env,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getUserHome", () => {
    it("returns HOME env var when set", () => {
      process.env.HOME = "/custom/home";
      expect(getUserHome()).toBe("/custom/home");
    });

    it("falls back to a non-empty string when HOME is unset", () => {
      delete process.env.HOME;
      const result = getUserHome();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getJelmaDir", () => {
    it("returns ~/.jelma by default", () => {
      delete process.env.SPAWN_HOME;
      expect(getJelmaDir()).toBe(join(getUserHome(), ".jelma"));
    });

    it("uses SPAWN_HOME when set to valid absolute path", () => {
      const testPath = join(getUserHome(), ".custom-spawn");
      process.env.SPAWN_HOME = testPath;
      expect(getJelmaDir()).toBe(testPath);
    });

    it("rejects relative SPAWN_HOME", () => {
      process.env.SPAWN_HOME = "relative/path";
      expect(() => getJelmaDir()).toThrow("must be an absolute path");
    });

    it("rejects dot-relative SPAWN_HOME", () => {
      process.env.SPAWN_HOME = "./local/dir";
      expect(() => getJelmaDir()).toThrow("must be an absolute path");
    });

    it("resolves .. segments in absolute SPAWN_HOME within home", () => {
      const pathWithDots = join(getUserHome(), "foo", "..", "bar");
      process.env.SPAWN_HOME = pathWithDots;
      expect(getJelmaDir()).toBe(join(getUserHome(), "bar"));
    });

    it("rejects SPAWN_HOME outside home directory", () => {
      process.env.SPAWN_HOME = "/tmp/spawn";
      expect(() => getJelmaDir()).toThrow("must be within your home directory");
    });

    it("rejects path traversal outside home directory", () => {
      process.env.SPAWN_HOME = "/tmp/../../root/.spawn";
      expect(() => getJelmaDir()).toThrow("must be within your home directory");
    });

    it("accepts home directory itself as SPAWN_HOME", () => {
      process.env.SPAWN_HOME = getUserHome();
      expect(getJelmaDir()).toBe(getUserHome());
    });
  });

  describe("getHistoryPath", () => {
    it("returns history.json inside jelma dir", () => {
      delete process.env.SPAWN_HOME;
      expect(getHistoryPath()).toBe(join(getUserHome(), ".jelma", "history.json"));
    });
  });

  describe("getJelmaCloudConfigPath", () => {
    it("returns ~/.config/spawn/{cloud}.json", () => {
      expect(getJelmaCloudConfigPath("aws")).toBe(join(getUserHome(), ".config", "jelma", "aws.json"));
    });

    it("works for different cloud names", () => {
      expect(getJelmaCloudConfigPath("hetzner")).toBe(join(getUserHome(), ".config", "jelma", "hetzner.json"));
    });
  });

  describe("getCacheDir", () => {
    it("returns XDG_CACHE_HOME/jelma when XDG_CACHE_HOME is set", () => {
      process.env.XDG_CACHE_HOME = "/custom/cache";
      expect(getCacheDir()).toBe("/custom/cache/jelma");
    });

    it("falls back to ~/.cache/spawn", () => {
      delete process.env.XDG_CACHE_HOME;
      expect(getCacheDir()).toBe(join(getUserHome(), ".cache", "jelma"));
    });
  });

  describe("getCacheFile", () => {
    it("returns manifest.json inside cache dir", () => {
      delete process.env.XDG_CACHE_HOME;
      expect(getCacheFile()).toBe(join(getUserHome(), ".cache", "jelma", "manifest.json"));
    });
  });

  describe("getUpdateFailedPath", () => {
    it("returns ~/.config/spawn/.update-failed", () => {
      expect(getUpdateFailedPath()).toBe(join(getUserHome(), ".config", "jelma", ".update-failed"));
    });
  });

  describe("getSshDir", () => {
    it("returns ~/.ssh", () => {
      expect(getSshDir()).toBe(join(getUserHome(), ".ssh"));
    });
  });

  describe("getTmpDir", () => {
    it("returns os.tmpdir()", () => {
      expect(getTmpDir()).toBe(tmpdir());
    });
  });
});
