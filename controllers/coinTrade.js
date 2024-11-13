const CoinTrade = require('../models/coinTrade');
const _ = require('lodash');
const moment = require('moment');
const { getCurrentPrice } = require('./tokenCoinController');
const { default: axios } = require('axios');
const path = require('path');
const fs = require('fs');
const tokenCoin = require('../models/tokenCoin');
const hre = require("hardhat");
const { exec } = require('child_process');

exports.getTradesByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    const trades = await CoinTrade.find({ project: projectId });

    if (!trades.length) {
      return res.status(404).json({ status: false, message: "No trades found for this project" });
    }

    // Create a Set to track unique user IDs
    const uniqueUsers = new Set();
    const uniqueTrades = [];

    trades.forEach(trade => {
      if (!uniqueUsers.has(trade.user.toString())) {
        uniqueUsers.add(trade.user.toString());
        uniqueTrades.push(trade);
      }
    });

    res.status(200).json({
      status: true,
      message: "Trades fetched successfully",
      trades: uniqueTrades
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching trades",
      error: error.message,
    });
  }
};

exports.getLatestTrades = async (req, res) => {
  try {
  
    const latestTrades = await CoinTrade.find({})
      .sort({ createdAt: -1 })
      .limit(10); 

    if (!latestTrades.length) {
      return res.status(404).json({ status: false, message: "No trades found" });
    }

    res.status(200).json({
      status: true,
      message: "Latest trades fetched successfully",
      trades: latestTrades
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching latest trades",
      error: error.message,
    });
  }
};


exports.getChartTradesByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    const trades = await CoinTrade.find({ project: projectId }).sort({createdAt:  1});

    if (!trades.length) {
      return res.status(404).json({ status: false, message: "No trades found for this project" });
    }
    // const _currentPrice = await getCurrentPrice(projectId);
    // console.log('_currentPrice',_currentPrice);
    
    const transactions =  trades.map((v,i) => {
      // console.log("price",(v.tokens/v.amount));
      // if(i == trades.length - 1){
      //   return { timestamp: v.timestamp, price: (1/parseFloat((v.tokens/v.amount)))*1e2, type: v.buy ? 'buy' : 'sell' , currentPrice: v.buy ? 1/(v.currentPrice/1e20) : (v.currentPrice/1e16) }
      // }
      // if(v.timestamp != trades[i+1].timestamp && i != trades.length - 1){
        return { timestamp: new Date(v.createdAt).getTime(), price: (1/parseFloat((v.tokens/v.amount)))*1e2, type: v.buy ? 'buy' : 'sell' , openPrice: (v.openPrice/1e18) , closePrice: (v.closePrice/1e18) }
      // }

      // return false;
    
    })
    // console.log(transactions);
    
    // [
    //   { timestamp: '2021-01-01T09:00:00', price: 50, type: 'buy' },
    //   { timestamp: '2021-01-01T09:05:00', price: 51, type: 'sell' },
    //   { timestamp: '2021-01-01T09:10:00', price: 52, type: 'buy' },
    //   { timestamp: '2021-01-01T09:15:00', price: 53, type: 'sell' },
    //   { timestamp: '2021-01-01T09:20:00', price: 54, type: 'buy' },
    //   { timestamp: '2021-01-01T09:25:00', price: 55, type: 'sell' },
    //   { timestamp: '2021-01-01T09:30:00', price: 56, type: 'buy' },
    // ];
    
    // Function to group transactions by time period
    // const groupByTimePeriod = (transactions, period) => {
    //   return _.groupBy(transactions, (transaction) => {
    //     return moment(transaction.timestamp).startOf(period).format();
    //   });
    // };
    // function getDateFormat(timestamp){
    //   return new Date(timestamp).getFullYear()+"-"+(new Date(timestamp).getMonth() < 10 ? "0"+(new Date(timestamp).getMonth()+1): new Date(timestamp).getMonth())+"-"+(new Date(timestamp).getDate() < 10 ? "0"+(new Date(timestamp).getDate()+1): new Date(timestamp).getDate())  
    // }

    
    // Function to calculate OHLC values
    // const calculateOHLC = (transactions) => {
      // console.log("received");
      // console.log(transactions);
      let _temp = [] ; 
      // let _final = [] ; 
      transactions.map((group,i) => {
        
        

        if(transactions.length == 1){
          let open =   group.openPrice ;  
          let low =   group.openPrice ;   
          let high =     group.closePrice ;
          let close =    group.closePrice  ; 
          _temp.push({
            time: parseInt(new Date(group.timestamp).getTime()),
            open,
            high,
            low,
            close,
          })
        
        }
        else{
          if(transactions[i+1]){
            if(group.timestamp != transactions[i+1].timestamp){
              let open =   group.openPrice ;  
              let low =   group.openPrice ;   
              let high =     group.closePrice ;
              let close =    group.closePrice  ; 
              _temp.push({
                time: parseInt(new Date(group.timestamp).getTime()),
                open,
                high,
                low,
                close,
              })
            }
          }
         
        }
     
        


          if(i == (transactions.length - 1)){
            return res.status(200).json({
              status: true,
              message: "Trades fetched successfully",
              ohlcValues: _temp
            });
          }
          
             
       
      });

    
      
       
   
    
    // Group transactions by desired time period (e.g., 5 minutes)
    // const groupedTransactions = groupByTimePeriod(transactions, 'minute');
    // console.log(groupedTransactions);
    // Calculate OHLC values for each group
    // const ohlcValues = _.flatMap(groupedTransactions, calculateOHLC);

    
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Error fetching trades",
      error: error.message,
    });
  }
};

exports.verifyTokenContract = async (req, res) => {
  try {
    const {
      contractaddress,
      tokenName,
      tokenSymbol,

    } = req.body;


 
    // const solFilePath = path.join(__dirname,'..', 'utils', 'Token.sol');

 
    // fs.readFile(solFilePath, 'utf8', async (err, sourceCode) => {
    //   if (err) {
    //     return res.status(500).json({
    //       status: false,
    //       message: 'Error reading Solidity file',
    //       error: err.message
    //     });
    //   }

    //   const data = {
    //     apikey: 'e8c9293402034bb2ae10a462cbfc63d1',
    //     module: 'contract',
    //     action: 'verifysourcecode',
    //     contractaddress: contractaddress,
    //     sourceCode: sourceCode, 
    //     codeformat: 'solidity-single-file',
    //     compilerversion: '0.8.20',
    //     optimizationUsed: 1,
    //     runs: 1,
    //     constructorArguements: [tokenName, tokenSymbol, "1000000000000000000000000000", "0xD306Ba98f7c567ef25b665AbD62bA16Ed4c21CA9"],
    //     evmversion: 'paris',
    //     licenseType: 'MIT',
    //   };
    // const command = `npx hardhat verify --network ${network} --contract ../contracts/Token:Token.sol ${contractSource} ${contractAddress} ${constructorArgsString}`;

        // hre.changeNetwork('core'); 
        const constructorArgs = [tokenName, tokenSymbol, "1000000000000000000000000000", "0xD306Ba98f7c567ef25b665AbD62bA16Ed4c21CA9"];
        // const response = await axios.post('https://openapi.coredao.org/api', data);
        const command = `npx hardhat verify --network core  --contract contracts/Token.sol:Token ${contractaddress} "${tokenName}" "${tokenSymbol}" 1000000000000000000000000000 "0xD306Ba98f7c567ef25b665AbD62bA16Ed4c21CA9"`
        exec(command, async (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
          }
      
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            res.status(500).json({
              status: false,
              message: "Error verifying token",
              error: stderr,
            });
            return;
          }
      
          // Output the result of the command
          await tokenCoin.findOneAndUpdate(
            { address: contractaddress }, 
            { verified: true }, 
            { new: true }
          );

          res.status(200).json({
            status: true,
            message: "Token verification initiated successfully",
            data: stdout
          });

        });
        
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error processing request",
      error: error.message,
    });
  }
};






