const { expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Fund Me", async () => {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.00001")
          // reminder #1: we don't need to create an instance for mockedAggregatorContract
          // because on staging test, we are deploying to TESTNET hence mockedAggregatorContract
          // on hardhat network/ hardhat localhost is NOT NEEDED

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              // reminder #2: we are not going to deploy all contracts here using
              // deloyments.fixtures(['all']) because since staging test shall
              // be run on testnet, hence the contract shall have been deployed to the
              // corresponding testnet before running the test
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allow people to fund and withdraw", async () => {
              await fundMe.fund({
                  value: sendValue,
                  gasLimit: 200000,
              })
              await fundMe.withdraw()

              const contractBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              expect(contractBalance.toString()).equal("0")
          })
      })
