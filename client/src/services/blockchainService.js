// Blockchain API integration for crypto wallets
// Supports: Ethereum, BSC, Polygon, Bitcoin, USDT (multiple networks)

const NETWORK_APIS = {
  ethereum: {
    name: 'Ethereum',
    explorer: 'https://api.etherscan.io/api',
    apiKey: 'YourApiKeyToken', // Free tier works without key for basic queries
    currency: 'ETH',
  },
  bsc: {
    name: 'Binance Smart Chain',
    explorer: 'https://api.bscscan.com/api',
    apiKey: 'YourApiKeyToken',
    currency: 'BNB',
  },
  polygon: {
    name: 'Polygon',
    explorer: 'https://api.polygonscan.com/api',
    apiKey: 'YourApiKeyToken',
    currency: 'MATIC',
  },
  bitcoin: {
    name: 'Bitcoin',
    explorer: 'https://blockchain.info',
    currency: 'BTC',
  },
  tron: {
    name: 'Tron',
    explorer: 'https://api.trongrid.io',
    currency: 'TRX',
  },
};

const blockchainService = {
  /**
   * Get wallet balance from blockchain
   */
  async getBalance(network, address) {
    try {
      const config = NETWORK_APIS[network.toLowerCase()];
      if (!config) {
        throw new Error(`Unsupported network: ${network}`);
      }

      if (network.toLowerCase() === 'bitcoin') {
        return await this.getBitcoinBalance(address);
      } else if (network.toLowerCase() === 'tron') {
        return await this.getTronBalance(address);
      } else {
        // EVM-compatible chains (Ethereum, BSC, Polygon)
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
   */
  async getTransactions(network, address, limit = 10) {
    try {
      const config = NETWORK_APIS[network.toLowerCase()];
      if (!config) {
        throw new Error(`Unsupported network: ${network}`);
      }

      if (network.toLowerCase() === 'bitcoin') {
        return await this.getBitcoinTransactions(address, limit);
      } else if (network.toLowerCase() === 'tron') {
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
   * EVM-compatible chains (Ethereum, BSC, Polygon)
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
        currency: config.currency,
        raw: data.result,
      };
    }

    throw new Error(data.message || 'Failed to fetch balance');
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
   * Tron
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

  async getTronTransactions(address, limit) {
    const url = `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data) {
      return {
        transactions: data.data.map(tx => ({
          hash: tx.txID,
          timestamp: tx.block_timestamp,
          type: tx.raw_data?.contract?.[0]?.type,
        })),
      };
    }

    return { transactions: [] };
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
