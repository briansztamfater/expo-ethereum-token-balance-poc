import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WalletConnectProvider, { useWalletConnect } from 'react-native-walletconnect';
import axios from 'axios';

const ETHERSCAN_API_KEY = 'REPLACE_WITH_YOUR_ETHERSCAN_API_KEY';
const TOKEN_CONTRACT_ADDRESS = '0xFab46E002BbF0b4509813474841E0716E6730136';

const WalletConnectExample = () => {
  const [tokenContractAddress, setTokenContractAddress] = useState('');
  const [ethBalance, setEthBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(NaN);
  const [isLoadingEthBalance, setIsLoadingEthBalance] = useState(false);
  const [isLoadingTokenBalance, setIsLoadingTokenBalance] = useState(false);

  const {
    createSession,
    killSession,
    session,
  } = useWalletConnect();
  
  const fetchEthBalance = useCallback(async (account: string) => {
    setIsLoadingEthBalance(true);

    const response = await axios(
      `https://api-kovan.etherscan.io/api?module=account&action=balance&address=${account}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
    );
    const balanceInWei = response.data.result;
    const balanceInEther = Number(balanceInWei) / 1000000000000000000; // TODO: Use Web3 utils library for unit conversion

    setEthBalance(balanceInEther);
    setIsLoadingEthBalance(false);
  }, [ETHERSCAN_API_KEY]);

  const fetchTokenBalance = useCallback(async (tokenContractAddress: string, account: string) => {
    setIsLoadingTokenBalance(true);

    const response = await axios(
      `https://api-kovan.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${tokenContractAddress}&address=${account}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
    );
    const balanceInDecimals = response.data.result; // We'll assume the token has 18 decimals for the sake of this PoC's simplicity
    const balance = Number(balanceInDecimals) / 1000000000000000000; // TODO: Use Web3 utils library for unit conversion

    setTokenBalance(balance);
    setIsLoadingTokenBalance(false);
  }, [ETHERSCAN_API_KEY, tokenContractAddress]);

  useEffect(() => {
    if (session.length) {
      const account = session[0].accounts[0]; // Using just the first account for the sake of this PoC's simplicity
      fetchEthBalance(account);
    }
  }, [session]);

  const hasWallet = !!session.length;
  const account: string = session[0]?.accounts[0];
  return (
    <View style={styles.walletConnect}>
      {!hasWallet && (
        <Button title="Connect Wallet" onPress={createSession} />
      )}
      {hasWallet && (
        <View style={styles.inputContainer}>
          <View style={styles.tokenContractInputContainer}>
            <TextInput
              style={styles.tokenContractInput}
              onChangeText={text => setTokenContractAddress(text)}
              value={tokenContractAddress}
              placeholder="ERC20 Token Contract Address"
              onSubmitEditing={() => fetchTokenBalance(tokenContractAddress, account)}
              autoCorrect={false}
              autoCompleteType="off"
              textContentType="none"
            />
            <TouchableOpacity style={styles.tokenContractAutofill} onPress={() => setTokenContractAddress(TOKEN_CONTRACT_ADDRESS)}>
              <Text style={styles.dot}>·</Text>
            </TouchableOpacity>
          </View>
          <Text ellipsizeMode="middle" numberOfLines={1}>{`Account 1 (${account})`}</Text>
          <Text style={styles.balanceText}>
            {isLoadingEthBalance && <ActivityIndicator size="small" />}
            {!Number.isNaN(ethBalance) ? `${ethBalance.toFixed(4)} ETH` : ''}
          </Text>
          <Text style={styles.balanceText}>
            {isLoadingTokenBalance && <ActivityIndicator size="small" />}
            {!Number.isNaN(tokenBalance) ? `${Number(tokenBalance).toFixed(2)} ERC20 TOKEN` : ''}
          </Text>
        </View>
      )}
      {hasWallet && (
        <View style={styles.footer}>
          <Button
            title="Disconnect Wallet"
            onPress={() => {
              setEthBalance(0);
              setTokenContractAddress('');
              setTokenBalance(NaN);
              setIsLoadingEthBalance(false);
              setIsLoadingTokenBalance(false);
              killSession();
            }}
          />
        </View>
      )}
    </View>
  );
};

export default function App() {
  return (
    <WalletConnectProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <WalletConnectExample />
      </SafeAreaView>
    </WalletConnectProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25
  },
  walletConnect: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25
  },
  inputContainer: {
    width:'100%'
  },
  tokenContractInputContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    height: 35,
    width: '100%',
  },
  tokenContractInput: {
    flex: 1,
    fontSize: 18,
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
    marginRight: 2.5
  },
  tokenContractAutofill: {
    height: '100%',
    aspectRatio: 1,
    backgroundColor: 'lightgray',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2.5
  },
  dot: {
    fontSize: 25,
    fontWeight: 'bold',
    paddingBottom: 2
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 0
  }
});
