const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const plasmaChainCompiled = require('plasma-contracts').plasmaChainCompiled

chai.should()
chai.use(chaiAsPromised)

const HttpContractProvider = require('../../../../src/services/contract').HttpContractProvider
const app = require('../../../mock-app')

const ETH = 0
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

describe('HttpContractProvider', () => {
  let contract
  let operator

  before(async () => {
    // Reset and start Ethereum.
    await app.startEth()
    await app.reset()

    // Pick an account to be the operator.
    operator = (await app.services.web3.eth.getAccounts())[0]

    contract = new HttpContractProvider({ app: app })
    await contract.start()

    // Deploy and initialize the contract.
    const deployed = await contract.contract.deploy({
      data: plasmaChainCompiled.bytecode
    }).send({
      from: operator,
      gas: 6000000,
      gasPrice: '1'
    })
    contract.contract.options.address = deployed.options.address
    await contract.contract.methods.setup(operator).send({
      from: operator,
      gas: 6000000
    })
  })

  after(async () => {
    await app.stop()
    await app.stopEth()
  })

  it('should return the current block', async () => {
    const currentBlock = await contract.getCurrentBlock()
    currentBlock.should.equal(0)
  })

  it('should return the current operator', async () => {
    const returnedOperator = await contract.getOperator()
    returnedOperator.should.equal(operator)
  })

  it('should allow a user to create a deposit', async () => {
    await contract.deposit(ETH, 100, operator)
  })

  it('should allow the operator to submit a block', async () => {
    await contract.submitBlock(ZERO_HASH)
  })

  it('should allow a user to query a block', async () => {
    const hash = await contract.getBlock(0)
    hash.should.equal(ZERO_HASH)
  })
})