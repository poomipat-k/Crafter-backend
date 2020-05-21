const paypalSDK = require("@paypal/checkout-server-sdk");

const client = () => {
  return new paypalSDK.core.PayPalHttpClient(environment());
};

const environment = () => {
  let clientId =
    process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID_DEV;

  let clientSecret =
    process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET_DEV;

  return new paypalSDK.core.SandboxEnvironment(clientId, clientSecret);
};

const prettyPrint = async (jsonData, pre = "") => {
  let pretty = "";
  const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toUpperCase();
  };

  for (let key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      if (isNaN(key)) {
        pretty += pre + capitalize(key) + ": ";
      } else {
        pretty += pre + (+parseInt(key) + 1) + ": ";
      }
      if (typeof jsonData[key] === "object") {
        pretty += "\n";
        pretty += await prettyPrint(jsonData[key], pre + "    ");
      } else {
        pretty += jsonData[key] + "\n";
      }
    }
  }
  return pretty;
};

module.exports = { client, prettyPrint };
