(() => {
  const contractJSON = JSON.parse(document.getElementById('contract').innerText)
  const error = document.getElementById('error')
  const connect = document.getElementById('connect')

  connect.disable = function(disabled) {
    connect.setAttribute('disabled', disabled)
    connect.disabled = disabled
    return disabled
  }

  connect.addEventListener('click', async (e) => {
    connect.disable(true)
    const { web3, connected, message, account, contract } = await install()
    if (!connected) {
      error.innerHTML = message
      return connect.disable(false)
    }

    for (let i = 0; i < 15; i++) {
      initBuyBox(i + 1, web3, account, contract)
    }
  });

  const initBuyBox = async (index, web3, account, contract) => {
    const ether = 1000000000000000000;
    const box = document.getElementById(`item-${index}`)
    const button = box.getElementsByTagName('button')[0]
    const quantity = box.getElementsByClassName('qty')[0]
    const price = box.getElementsByClassName('price')[0]

    button.disable = function(disabled) {
      button.setAttribute('disabled', disabled)
      button.disabled = disabled
      return disabled
    }

    //get cost
    const cost = await read(contract, account, 'collectionOffer', index)
    price.innerHTML = `${web3.utils.hexToNumberString(cost)/ether} MATIC`
    //get size and supply
    const size = await read(contract, account, 'collectionSize', index)
    const supply = await read(contract, account, 'collectionSupply', index)
    const qty = web3.utils.hexToNumberString(size) - web3.utils.hexToNumberString(supply);
    quantity.innerHTML = `${qty} left`

    button.addEventListener('click', async (e) => {
      e.preventDefault()
      button.disable(true)
      let txHash = ''
      try {
        txHash = await write(contract, account, 'buy', cost, index)
      } catch(e) {
        error.innerHTML = e.message
        return button.disable(false)
      }
    })
  }

  const read = async(contract, account, method, ...args) => {
    return await window.ethereum.request({
      method: "eth_call",
      params: [{
        to: contractJSON.address,
        from: account,
        data: contract.methods[method](...args).encodeABI(),
      }],
    })
  }

  const write = async(contract, account, method, value, ...args) => {
    const params = {
      to: contractJSON.address,
      from: account,
      value: String(value),
      data: contract.methods[method](...args).encodeABI(),
    }
    
    if (value) params.value = String(value)
    
    return await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [params]
    })
  }

  const install = async() => {
    if (!window.ethereum?.isMetaMask) {
      return { 
        connected: false, 
        message: 'Please install <a href="https://metamask.io/" target="_blank">MetaMask</a>' 
      }
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const networkId = await window.ethereum.request({ method: 'net_version' });
      if (networkId == contractJSON.chain_id) {
        const web3 = new Web3(window.ethereum);
        return {
          connected: true,
          account: accounts[0],
          web3: web3,
          contract: new web3.eth.Contract(
            contractJSON.abi,
            contractJSON.address
          )
        }
      }
      
      return { 
        connected: false, 
        message: `Please change network to ${contractJSON.chain_name}.` 
      }
    } catch (e) {
      return { connected: false, message: e.message }
    }
  }
})()