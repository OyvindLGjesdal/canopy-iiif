const { getCanopyCollection } = require("./shape");
const { getEntries, getLabel } = require("../iiif/label");
const fs = require("fs");
const { getSlug } = require("./slug");
const { log } = require("./log");
const { getRootCollection, getBulkManifests } = require("./request");
const { buildIndexData } = require("./search");

module.exports.build = (env) => {
  const canopyDirectory = ".canopy";
  log(`Building Canopy from IIIF Collection...\n`);
  log(`${env.collection}\n\n`, "yellow");
  getRootCollection(env.collection).then((json) => {
    const canopyCollection = getCanopyCollection(json);

    try {
      if (!fs.existsSync(canopyDirectory)) {
        fs.mkdirSync(canopyDirectory);
      }
    } catch (err) {
      console.error(err);
    }

    fs.writeFile(
      `${canopyDirectory}/collections.json`,
      JSON.stringify([canopyCollection]),
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );

    /**
     * create manifest listing
     */
    log(`Creating Manifest listing...\n`);
    const canopyManifests = canopyCollection.items
      .filter((item) => item.type === "Manifest")
      .map((item) => {
        const slug = getSlug(getLabel(item.label)[0]);
        return {
          collectionId: item.parent,
          id: item.id,
          label: item.label,
          slug: slug,
        };
      });

    fs.writeFile(
      `${canopyDirectory}/manifests.json`,
      JSON.stringify(canopyManifests),
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );

    /**
     * flatten metadata
     */

    fs.writeFile(
      `${canopyDirectory}/metadata.json`,
      JSON.stringify([]),
      (error) => error && console.error(error)
    );

    const responses = getBulkManifests(canopyManifests, 10);

    responses
      .then((manifests) => {
        let canopySearch = [];
        manifests
          .filter((manifest) => manifest?.type === "Manifest")
          .forEach((manifest) => {
            return manifest.metadata.forEach((metadata) => {
              const metadataLabel = getEntries(metadata.label)[0];
              const metadataValues = getEntries(metadata.value);
              if (env.metadata.includes(metadataLabel)) {
                metadataValues.forEach((value) => {
                  const result = {
                    id: manifest.id,
                    label: metadataLabel,
                    value,
                  };
                  canopySearch.push(result);
                });
              }
            });
          });

        fs.writeFile(
          `${canopyDirectory}/metadata.json`,
          JSON.stringify(canopySearch),
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );

        log(`Building search index..\n\n`);
        const canopyIndex = buildIndexData(canopyManifests);
        fs.writeFile(
          `${canopyDirectory}/index.json`,
          JSON.stringify(canopyIndex),
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      })
      .then(() => {
        log(`\n...Ready\n\n`);
      });
  });
};
