const HttpError = require("../models/http-error");

const getDesignTemplate = async (req, res, next) => {
  // Data fetched from database
  let dataContent = {
    body: {
      colors: ["#555", "green", "blue"],
      styles: [0, 1, 2],
    },
    collar: {
      colors: ["salmon", "orange", "cyan", "red"],
      styles: [0, 1, 2, 3, 4],
    },
    placket: {
      colors: ["#ccc", "yellow", "salmon"],
      styles: [4, 5, 6],
    },
    sleeveEdge: {
      colors: ["lightblue", "darkgreen", "purple"],
      styles: [8, 9, 11],
    },
    button: {
      colors: ["blue", "red", "lightgreen", "orange"],
      styles: [20, 30, 40],
    },
  };

  let dataCanvas = { ...dataContent };
  for (let key in dataCanvas) {
    if (!dataCanvas[key]) {
      console.log("Error: no Canvas key");
      continue;
    }
    dataCanvas[key] = { ...dataContent[key] };
    for (let subkey in dataCanvas[key]) {
      if (!dataCanvas[key][subkey]) {
        console.log("Error: no Canvas subkey");
        continue;
      }
      dataCanvas[key][subkey] = dataContent[key][subkey][0];
    }
  }
  res.status(200).json({
    content: dataContent,
    canvas: dataCanvas,
  });
};

module.exports = { getDesignTemplate };
