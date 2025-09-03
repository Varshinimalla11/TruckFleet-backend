import config from "config";

export default function () {
  if (!config.get("jwtPrivateKey")) {
    console.log("jwt is missing");
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
  }
}
// This function checks if the JWT private key is defined in the configuration
// and throws an error if it is not, ensuring that the application does not run
