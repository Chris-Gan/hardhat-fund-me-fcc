const { expect, assert } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMeContract
          let mockedAggregatorContract
          let deployer
          // const sendEth = 1000000000000000000
          const sendEth = ethers.utils.parseEther("1")

          beforeEach(async function () {
              // this will deploy the 'fundMe' & 'mockedAggregatorVe' contract
              await deployments.fixture(["all"])

              // reminder: private key is not really needed when we are inside 'hardhat networks
              // or 'hardhat-localhost' but we are getting it to be passed down when
              // creating contract instance
              const availableAccounts = await getNamedAccounts()
              deployer = availableAccounts.deployer
              mockedAggregatorContract = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
              fundMeContract = await ethers.getContract("FundMe", deployer)
          })
          describe("constructor method", () => {
              it("sets the aggregator address correctly", async () => {
                  const mockedContractAddress = mockedAggregatorContract.address
                  // reminder: the s_priceFeed state variable inside the FundMe contract
                  // is a contract instance of the AggregatorV3Interface & it shall has an ADDRESS
                  const aggregatorInstanceAddressInFundMe =
                      await fundMeContract.getPriceFeed()
                  expect(mockedContractAddress).equal(
                      aggregatorInstanceAddressInFundMe
                  )
              })
          })

          describe("fund method", () => {
              it("will fails when the amount transferred is less than USD 50", async () => {
                  await expect(fundMeContract.fund()).revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("update the transfer amount in smart contract", async () => {
                  await fundMeContract.fund({ value: sendEth })
                  const response =
                      await fundMeContract.getAddressToAmountFunded(deployer)
                  expect(response.toString()).equal(sendEth.toString())
              })

              it("add funder to s_funders array", async () => {
                  await fundMeContract.fund({ value: sendEth })
                  const funder = await fundMeContract.getFunder(0)
                  expect(funder).equal(deployer)
              })
          })

          describe("withdraw method", () => {
              beforeEach(async () => {
                  await fundMeContract.fund({ value: sendEth })
              })

              it("can withdraw Eth from a single funder", async () => {
                  // get the initial balance of the smart contract and the transaction account
                  // after the 'fund()' method is called
                  const initialContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const initialDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // const demo = await fundMeContract.signer.getBalance()

                  // call the withdraw method to withdraw all the token from the smart contract
                  // & wait for the transaction to confirm
                  const transactionResponse = await fundMeContract.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // compute the gas price from the transaction receipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // the balance of the smart contract and the transaction account after withdrawal
                  const finalContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const finalDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // testing
                  // the smart contract should have zero balance
                  expect(finalContractBalance.toString()).equal("0")

                  // withdrawing account should now have intialAccountBalance + initialContractBalance - transaction gasCost
                  // as final balance
                  expect(finalDeployerBalance.toString()).equal(
                      initialContractBalance
                          .add(initialDeployerBalance)
                          .sub(gasCost)
                          .toString()
                  )
              })

              it("can withdraw Eth from a single funder using the Modified withdraw function", async () => {
                  // get the initial balance of the smart contract and the transaction account
                  // after the 'fund()' method is called
                  const initialContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const initialDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // const demo = await fundMeContract.signer.getBalance()

                  // call the withdraw method to withdraw all the token from the smart contract
                  // & wait for the transaction to confirm
                  const transactionResponse =
                      await fundMeContract.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // compute the gas price from the transaction receipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // the balance of the smart contract and the transaction account after withdrawal
                  const finalContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const finalDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // testing
                  // the smart contract should have zero balance
                  expect(finalContractBalance.toString()).equal("0")

                  // withdrawing account should now have intialAccountBalance + initialContractBalance - transaction gasCost
                  // as final balance
                  expect(finalDeployerBalance.toString()).equal(
                      initialContractBalance
                          .add(initialDeployerBalance)
                          .sub(gasCost)
                          .toString()
                  )
              })

              it("can withdraw Eth from multiple funder", async () => {
                  const listOfAccounts = await ethers.getSigners()
                  for (let index = 1; index < 6; index++) {
                      const newContractInstance = await fundMeContract.connect(
                          listOfAccounts[index]
                      )
                      await newContractInstance.fund({ value: sendEth })
                  }

                  // get the initial balance of the smart contract and the transaction account
                  // after MULTIPLE 'fund()' method is called

                  // p/s: all the contract instances shall record the same CONTRACT BALANCES
                  // since the value is received from the SAME DEPLOYED SMART CONTRACT
                  const initialContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const initialDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // call the withdraw method to withdraw all the token from the smart contract
                  // & wait for the transaction to confirm
                  const transactionResponse = await fundMeContract.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // compute the gas price from the transaction receipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // the balance of the smart contract and the transaction account after withdrawal
                  const finalContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const finalDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // testing
                  // the smart contract should have zero balance
                  expect(finalContractBalance.toString()).equal("0")

                  // withdrawing account should now have intialAccountBalance + initialContractBalance - transaction gasCost
                  // as final balance
                  expect(finalDeployerBalance.toString()).equal(
                      initialContractBalance
                          .add(initialDeployerBalance)
                          .sub(gasCost)
                          .toString()
                  )

                  // the s_funders array inside the smart contract is emptied everytime the withdraw function is called
                  // hence when we try to access the first array item, an error SHALL BE RETURNED
                  await expect(fundMeContract.getFunder(0)).to.be.reverted
                  for (let index = 1; index < 6; index++) {
                      expect(
                          await fundMeContract.getAddressToAmountFunded(
                              listOfAccounts[index].address
                              // .toString()
                          )
                      ).equal("0")
                  }
              })
              it("can withdraw Eth from multiple funder using the Modified withdraw function", async () => {
                  const listOfAccounts = await ethers.getSigners()
                  for (let index = 1; index < 6; index++) {
                      const newContractInstance = await fundMeContract.connect(
                          listOfAccounts[index]
                      )
                      await newContractInstance.fund({ value: sendEth })
                  }

                  // get the initial balance of the smart contract and the transaction account
                  // after MULTIPLE 'fund()' method is called

                  // p/s: all the contract instances shall record the same CONTRACT BALANCES
                  // since the value is received from the SAME DEPLOYED SMART CONTRACT
                  const initialContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const initialDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // call the withdraw method to withdraw all the token from the smart contract
                  // & wait for the transaction to confirm
                  const transactionResponse =
                      await fundMeContract.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // compute the gas price from the transaction receipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // the balance of the smart contract and the transaction account after withdrawal
                  const finalContractBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const finalDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  // testing
                  // the smart contract should have zero balance
                  expect(finalContractBalance.toString()).equal("0")

                  // withdrawing account should now have intialAccountBalance + initialContractBalance - transaction gasCost
                  // as final balance
                  expect(finalDeployerBalance.toString()).equal(
                      initialContractBalance
                          .add(initialDeployerBalance)
                          .sub(gasCost)
                          .toString()
                  )

                  // the s_funders array inside the smart contract is emptied everytime the withdraw function is called
                  // hence when we try to access the first array item, an error SHALL BE RETURNED
                  await expect(fundMeContract.getFunder(0)).to.be.reverted
                  for (let index = 1; index < 6; index++) {
                      expect(
                          await fundMeContract.getAddressToAmountFunded(
                              listOfAccounts[index].address
                              // .toString()
                          )
                      ).equal("0")
                  }
              })

              it("can only be called by the contract owner", async () => {
                  const signersArr = await ethers.getSigners()
                  // index 0 is the owner, every signer other than index 0 is considered an attacker
                  const attacker = signersArr[1]
                  const attackerContractInstance = await fundMeContract.connect(
                      attacker
                  )
                  await expect(
                      attackerContractInstance.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
              it("can only be called by the contract owner using the Modified withdraw function", async () => {
                  const signersArr = await ethers.getSigners()
                  // index 0 is the owner, every signer other than index 0 is considered an attacker
                  const attacker = signersArr[1]
                  const attackerContractInstance = await fundMeContract.connect(
                      attacker
                  )
                  await expect(
                      attackerContractInstance.cheaperWithdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })
      })
