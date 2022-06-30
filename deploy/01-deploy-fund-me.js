const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, hahah } = await getNamedAccounts()
    const chainId = network.config.chainId
    // const ehtUsdPriceFeedAddress = networkConfig[chainId].ehtUsdPriceFeedAddress
    let ehtUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const mockedAggregator = await deployments.get("MockV3Aggregator")
        ehtUsdPriceFeedAddress = mockedAggregator.address
    } else {
        ehtUsdPriceFeedAddress = networkConfig[chainId].ehtUsdPriceFeedAddress
    }

    log(
        "-----------------------------------------------------------------------------"
    )
    log("deploying FundMe.....")
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ehtUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.confirmationBlocks || 1,
    })
    log("FundMe deployed")

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ehtUsdPriceFeedAddress])
    }
}

module.exports.tags = ["all", "fundme"]
