const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")
const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, hahah } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("Deploying Mock....")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            log: true,
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mock deployed......")
    }
}
module.exports.tags = ["all", "mock"]
