var IdentityLedger = artifacts.require("./IdentityLedger.sol");
module.exports = function(deployer) {
  deployer.deploy(IdentityLedger);
};
