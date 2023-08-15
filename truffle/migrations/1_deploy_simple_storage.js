const SimpleStorage = artifacts.require("ManufacturingTraceability");

module.exports = function (deployer) {
  deployer.deploy(SimpleStorage);
};
