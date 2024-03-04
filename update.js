import * as fs from "fs";

const FOLDER = "update";
const UPDATE_URL = "http://localhost:4321/releases/";

const main = () => {
  const packageJson = JSON.parse(fs.readFileSync("./package.json"));
  if (fs.existsSync(FOLDER)) {
    fs.rmSync(FOLDER, { force: true, recursive: true });
  }
  fs.mkdirSync(FOLDER);
  fs.cpSync(
    "./src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Snap.app.tar.gz",
    `./${FOLDER}/app-aarch64.app.tar.gz`,
  );
  fs.cpSync(
    "./src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Snap.app.tar.gz.sig",
    `./${FOLDER}/app-aarch64.app.tar.gz.sig`,
  );
  fs.cpSync(
    "./src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Snap.app.tar.gz",
    `./${FOLDER}/app-x86_64.app.tar.gz`,
  );
  fs.cpSync(
    "./src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Snap.app.tar.gz.sig",
    `./${FOLDER}/app-x86_64.app.tar.gz.sig`,
  );

  const manifest = {
    version: `v${packageJson.version}`,
    notes: "Check the complete changelog at https://trysnap.app/changelogs",
    pub_date: new Date().toISOString(),
    platforms: {
      "darwin-x86_64": {
        signature: String(
          fs.readFileSync(`./${FOLDER}/app-x86_64.app.tar.gz.sig`),
        ),
        url: UPDATE_URL + "app-x86_64.app.tar.gz",
      },
      "darwin-aarch64": {
        signature: String(
          fs.readFileSync(`./${FOLDER}/app-aarch64.app.tar.gz.sig`),
        ),
        url: UPDATE_URL + "release/app-aarch64.app.tar.gz",
      },
    },
  };

  fs.writeFileSync(
    `./${FOLDER}/update.json`,
    JSON.stringify(manifest, null, 2),
  );
};

main();
