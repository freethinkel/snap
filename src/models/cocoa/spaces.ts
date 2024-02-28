import { Command } from "@tauri-apps/plugin-shell";

export type Space = {
  id: string;
  windowIds: number[];
};

export type MonitorSpace = {
  id: string;
  index: number;
  managedId: number;
};

export type Monitor = {
  id: string;
  isMain: boolean;
  currentSpace: MonitorSpace;
  spaces: MonitorSpace[];
};

export type SpacesInfo = {
  allSpaces: Space[];
  monitors: Monitor[];
};

export class Spaces {
  static async getSpacesInfo(): Promise<SpacesInfo> {
    const cmd = Command.create("defaults", "read com.apple.spaces".split(" "));
    const res = await cmd.execute();
    const out = res.stdout.replace(/\n\n/gim, "\n");
    const data = this._parseOutput(out);

    const parseMonitorSpace =
      (item: any) =>
      (i: number): MonitorSpace => ({
        id: item["uuid"],
        index: i,
        managedId: Number(item["ManagedSpaceID"]),
      });

    const monitors: Monitor[] = data["SpacesDisplayConfiguration"][
      "Management Data"
    ]["Monitors"].map((item: any) => {
      const spaces: MonitorSpace[] = item["Spaces"].map(
        (space: any, i: number) => parseMonitorSpace(space)(i),
      );
      return {
        id: item["Display Identifier"],
        isMain: item["Display Identifier"] === "Main",
        currentSpace: parseMonitorSpace(item["Current Space"])(
          spaces.findIndex(
            (space) => space.id === item["Current Space"]["uuid"],
          ),
        ),
        spaces,
      } satisfies Monitor;
    });
    const allSpaces: Space[] = data["SpacesDisplayConfiguration"][
      "Space Properties"
    ].map((item: any, i: number) => ({
      id: item["name"],
      windowIds: item["windows"],
      index: i,
    }));

    return {
      monitors,
      allSpaces,
    };
  }

  private static _parseOutput(out: string): any {
    const jsonLike = out
      .replace(/\(/g, "[") // Convert plist arrays to JSON arrays
      .replace(/\)/g, "]") // Convert plist arrays to JSON arrays
      .replace(/;/g, ",") // Replace semicolons with commas
      .replace(/=/g, ":") // Replace equals with colons for key-value pairs
      .replace(/(\w+) *:/g, '"$1":') // Quote keys
      .replace(/,(\s*[\]}])/g, "$1") // Remove trailing commas before closing brackets or braces
      .replace(/:\s?(\w+)(,?)/g, ': "$1"$2');

    return JSON.parse(jsonLike);
  }
}
