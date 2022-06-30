const { ethers, getNamedAccounts } = require("hardhat")

const main = async () => {
    const { deployer } = await getNamedAccounts()
    console.log("Funding contract.....")
    const fundMe = await ethers.getContract("FundMe", deployer)
    await fundMe.fund({
        value: ethers.utils.parseEther("0.07"),
    })
    console.log("Funded...")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
