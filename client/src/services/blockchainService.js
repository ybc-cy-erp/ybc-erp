// Blockchain API integration for crypto wallets
// Supports: Ethereum, BSC, Polygon, Bitcoin, USDT (multiple networks)

const NETWORK_APIS = {
  ethereum: {
    name: 'Ethereum',
    explorer: 'https://api.etherscan.io/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'ETH',
  },
  bsc: {
    name: 'Binance Smart Chain',
    explorer: 'https://api.bscscan.com/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'BNB',
  },
  polygon: {
    name: 'Polygon',
    explorer: 'https://api.polygonscan.com/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'MATIC',
  },
  arbitrum: {
    name: 'Arbitrum',
    explorer: 'https://api.arbiscan.io/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'ETH',
  },
  optimism: {
    name: 'Optimism',
    explorer: 'https://api-optimistic.etherscan.io/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'ETH',
  },
  avalanche: {
    name: 'Avalanche',
    explorer: 'https://api.snowtrace.io/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'AVAX',
  },
  base: {
    name: 'Base',
    explorer: 'https://api.basescan.org/api',
    apiKey: 'YourApiKeyToken',
    nativeCurrency: 'ETH',
  },
  bitcoin: {
    name: 'Bitcoin',
    explorer: 'https://blockchain.info',
    nativeCurrency: 'BTC',
  },
  tron: {
    name: 'Tron',
    explorer: 'https://api.trongrid.io',
    nativeCurrency: 'TRX',
  },
};

// Token contract addresses
const TOKEN_CONTRACTS = {
  USDT: {
    ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    bsc: '0x55d398326f99059ff775485246999027b3197955',
    polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    arbitrum: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT on Arbitrum
    optimism: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', // USDT on Optimism
    avalanche: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // USDT.e on Avalanche
    base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC native on Base (USDT coming)
    tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // TRC-20 USDT
  },
  USDC: {
    ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    bsc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    polygon: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    arbitrum: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC native on Arbitrum
    optimism: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', // USDC on Optimism
    avalanche: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // USDC on Avalanche
    base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC native on Base
  },
};

const blockchainService = {
  /**
   * Get wallet balance from blockchain
   * @param {string} network - Network name (ethereum, bsc, polygon, bitcoin, tron)
   * @param {string} address - Wallet address
   * @param {string} currency - Currency to check (ETH, USDT, BTC, etc.)
   */
  async getBalance(network, address, currency = null) {
    try {
      const config = NETWORK_APIS[network.toLowerCase()];
      if (!config) {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Determine if we need to fetch token or native currency
      const isToken = currency && currency !== config.nativeCurrency;

      if (network.toLowerCase() === 'bitcoin') {
        return await this.getBitcoinBalance(address);
      } else if (network.toLowerCase() === 'tron') {
        if (isToken && TOKEN_CONTRACTS[currency]?.tron) {
          return await this.getTronTokenBalance(address, currency);
        }
        return await this.getTronBalance(address);
      } else {
        // EVM-compatible chains (Ethereum, BSC, Polygon)
        if (isToken && TOKEN_CONTRACTS[currency]?.[network.toLowerCase()]) {
          return await this.getEVMTokenBalance(network, address, currency);
        }
        return await this.getEVMBalance(network, address);
      }
    } catch (error) {
      console.error(`Failed to fetch balance for ${network}:`, error);
      return {
        balance: null,
        error: error.message,
      };
    }
  },

  /**
   * Get wallet transactions from blockchain
   * @param {string} network - Network name
   * @param {string} address - Wallet address
   * @param {number} limit - Number of transactions to fetch
   * @param {string} currency - Currency to filter (optional, for tokens)
   */
  async getTransactions(network, address, limit = 10, currency = null) {
    try {
      const config = NETWORK_APIS[network.toLowerCase()];
      if (!config) {
        throw new Error(`Unsupported network: ${network}`);
      }

      if (network.toLowerCase() === 'bitcoin') {
        return await this.getBitcoinTransactions(address, limit);
      } else if (network.toLowerCase() === 'tron') {
        const isToken = currency && currency !== 'TRX';
        if (isToken) {
          return await this.getTronTokenTransactions(address, currency, limit);
        }
        return await this.getTronTransactions(address, limit);
      } else {
        return await this.getEVMTransactions(network, address, limit);
      }
    } catch (error) {
      console.error(`Failed to fetch transactions for ${network}:`, error);
      return {
        transactions: [],
        error: error.message,
      };
    }
  },

  /**
   * EVM-compatible chains (Ethereum, BSC, Polygon) - Native currency
   */
  async getEVMBalance(network, address) {
    const config = NETWORK_APIS[network.toLowerCase()];
    const url = `${config.explorer}?module=account&action=balance&address=${address}&tag=latest`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      // Convert from Wei to native currency (ETH/BNB/MATIC)
      const balance = parseFloat(data.result) / 1e18;
      return {
        balance,
        currency: config.nativeCurrency,
        raw: data.result,
      };
    }

    throw new Error(data.message || 'Failed to fetch balance');
  },

  /**
   * EVM Token balance (ERC-20, BEP-20, etc.)
   */
  async getEVMTokenBalance(network, address, currency) {
    const config = NETWORK_APIS[network.toLowerCase()];
    const contractAddress = TOKEN_CONTRACTS[currency][network.toLowerCase()];
    
    if (!contractAddress) {
      throw new Error(`No contract address for ${currency} on ${network}`);
    }

    // For networks with deprecated V1 API (Arbitrum, Optimism, Base), use alternative method
    const deprecatedNetworks = ['arbitrum', 'optimism', 'base'];
    
    if (deprecatedNetworks.includes(network.toLowerCase())) {
      return await this.getEVMTokenBalanceViaRPC(network, address, contractAddress, currency);
    }

    const url = `${config.explorer}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      // Most tokens use 6 decimals (USDT, USDC) except some use 18
      const decimals = currency === 'USDT' || currency === 'USDC' ? 6 : 18;
      const balance = parseFloat(data.result) / Math.pow(10, decimals);
      return {
        balance,
        currency,
        raw: data.result,
      };
    }

    // If API fails, try RPC fallback
    if (data.message === 'NOTOK' || data.status === '0') {
      return await this.getEVMTokenBalanceViaRPC(network, address, contractAddress, currency);
    }

    throw new Error(data.message || 'Failed to fetch token balance');
  },

  /**
   * Fallback method using public RPC nodes for token balance
   */
  async getEVMTokenBalanceViaRPC(network, address, contractAddress, currency) {
    const rpcUrls = {
      ethereum: 'https://eth.llamarpc.com',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      optimism: 'https://mainnet.optimism.io',
      base: 'https://mainnet.base.org',
      polygon: 'https://polygon-rpc.com',
      bsc: 'https://bsc-dataseed.binance.org',
      avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    };

    const rpcUrl = rpcUrls[network.toLowerCase()];
    if (!rpcUrl) {
      throw new Error(`No RPC URL for ${network}`);
    }

    // ERC-20 balanceOf(address) function signature
    const data = `0x70a08231000000000000000000000000${address.slice(2).toLowerCase()}`;

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: data,
          },
          'latest',
        ],
      }),
    });

    const result = await response.json();

    if (result.result) {
      const decimals = currency === 'USDT' || currency === 'USDC' ? 6 : 18;
      const balance = parseInt(result.result, 16) / Math.pow(10, decimals);
      return {
        balance,
        currency,
        raw: result.result,
      };
    }

    throw new Error('Failed to fetch token balance via RPC');
  },

  async getEVMTransactions(network, address, limit) {
    const config = NETWORK_APIS[network.toLowerCase()];
    const url = `${config.explorer}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return {
        transactions: data.result.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: parseFloat(tx.value) / 1e18,
          currency: config.currency,
          timestamp: parseInt(tx.timeStamp) * 1000,
          blockNumber: tx.blockNumber,
          isError: tx.isError === '1',
        })),
      };
    }

    throw new Error(data.message || 'Failed to fetch transactions');
  },

  /**
   * Bitcoin
   */
  async getBitcoinBalance(address) {
    const url = `https://blockchain.info/q/addressbalance/${address}`;
    const response = await fetch(url);
    const satoshis = await response.text();
    
    // Convert satoshis to BTC
    const balance = parseFloat(satoshis) / 1e8;

    return {
      balance,
      currency: 'BTC',
      raw: satoshis,
    };
  },

  async getBitcoinTransactions(address, limit) {
    const url = `https://blockchain.info/rawaddr/${address}?limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();

    return {
      transactions: data.txs.map(tx => ({
        hash: tx.hash,
        time: tx.time * 1000,
        result: tx.result / 1e8, // satoshis to BTC
        balance: tx.balance / 1e8,
      })),
    };
  },

  /**
   * Tron - Native TRX
   */
  async getTronBalance(address) {
    const url = `https://api.trongrid.io/v1/accounts/${address}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data[0]) {
      const balance = (data.data[0].balance || 0) / 1e6; // Sun to TRX
      return {
        balance,
        currency: 'TRX',
        raw: data.data[0].balance,
      };
    }

    throw new Error('Failed to fetch Tron balance');
  },

  /**
   * Tron TRC-20 Token (USDT, etc.)
   */
  async getTronTokenBalance(address, currency) {
    const contractAddress = TOKEN_CONTRACTS[currency]?.tron;
    
    if (!contractAddress) {
      throw new Error(`No contract address for ${currency} on Tron`);
    }

    // TronGrid API for TRC-20 token balance
    const url = `https://api.trongrid.io/v1/accounts/${address}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data[0]) {
      const account = data.data[0];
      
      // Find TRC20 token balance in the account data
      if (account.trc20) {
        const tokenData = account.trc20.find(token => 
          Object.keys(token)[0] === contractAddress
        );
        
        if (tokenData) {
          const balance = parseFloat(tokenData[contractAddress]) / 1e6; // USDT has 6 decimals
          return {
            balance,
            currency,
            raw: tokenData[contractAddress],
          };
        }
      }
      
      // No balance found, return 0
      return {
        balance: 0,
        currency,
        raw: '0',
      };
    }

    throw new Error('Failed to fetch Tron token balance');
  },

  async getTronTransactions(address, limit) {
    const url = `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=${limit}&only_confirmed=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return {
        transactions: data.data.map(tx => {
          // Parse TRX transfer
          let value = 0;
          let from = '';
          let to = '';
          
          if (tx.raw_data?.contract?.[0]) {
            const contract = tx.raw_data.contract[0];
            if (contract.type === 'TransferContract') {
              const params = contract.parameter.value;
              value = (params.amount || 0) / 1e6; // Sun to TRX
              from = this.base58ToAddress(params.owner_address);
              to = this.base58ToAddress(params.to_address);
            }
          }

          return {
            hash: tx.txID,
            from,
            to,
            value,
            currency: 'TRX',
            timestamp: tx.block_timestamp,
            blockNumber: tx.blockNumber,
            isError: !tx.ret || tx.ret[0]?.contractRet !== 'SUCCESS',
          };
        }),
      };
    }

    return { transactions: [] };
  },

  async getTronTokenTransactions(address, currency, limit) {
    const contractAddress = TOKEN_CONTRACTS[currency]?.tron;
    if (!contractAddress) {
      throw new Error(`No contract for ${currency} on Tron`);
    }

    // TRC-20 transfers (USDT)
    const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=${limit}&contract_address=${contractAddress}&only_confirmed=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return {
        transactions: data.data.map(tx => ({
          hash: tx.transaction_id,
          from: tx.from,
          to: tx.to,
          value: parseFloat(tx.value) / 1e6, // USDT has 6 decimals
          currency: currency,
          timestamp: tx.block_timestamp,
          blockNumber: tx.block,
          isError: false,
        })),
      };
    }

    return { transactions: [] };
  },

  // Helper to convert Tron base58 address to readable format
  base58ToAddress(base58) {
    // TronGrid returns hex addresses, just return as-is
    return base58;
  },

  /**
   * Compare blockchain balance with database balance
   */
  compareBalances(blockchainBalance, dbBalance) {
    if (blockchainBalance === null) {
      return {
        match: false,
        difference: null,
        status: 'error',
        message: 'Не вдалося отримати баланс з блокчейну',
      };
    }

    const diff = Math.abs(blockchainBalance - dbBalance);
    const match = diff < 0.0001; // Tolerance for rounding

    return {
      match,
      difference: blockchainBalance - dbBalance,
      status: match ? 'match' : 'mismatch',
      message: match 
        ? '✅ Баланс співпадає' 
        : `⚠️ Розбіжність: ${diff.toFixed(8)}`,
    };
  },
};

export default blockchainService;
