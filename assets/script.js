'use strict';

(function () {
    var ethAddress = '0x99cbe93AFee15456a1115540e7F534F6629bAB3f';
    var ropstenAddress = '0x6342A5c056F71E7E3a6Bf89560Dc1F97210bDb51';
    var goerliAddress = '0x6011b6573fA152ded3d3188Ee6a90842BEa38b42';
    var shastaAddress = 'TRSMhoz5cfzw3jYyMHLBKXrXrpdTHy1MyY';
    var networkEth = 1;
    var networkRopsten = 3;
    var networkGoerli = 5;
    var networkTron = 'https://api.trongrid.io';
    var networkTronStack = 'https://api.tronstack.io';
    var networkShasta = 'https://api.shasta.trongrid.io';
    var abi = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_ref",
                    "type": "address"
                }
            ],
            "name": "buy",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "dividendsOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "refDividendsOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "reinvest",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_tokens",
                    "type": "uint256"
                }
            ],
            "name": "sell",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    var eth = true;
    var network = null;
    var contract;
    var account = null;
    var accountEth = null;
    var accountTokens = null;

    window.onload = function () {
        document.getElementById('eth').onclick = function () {
            setEth(true);
        };
        document.getElementById('trx').onclick = function () {
            setEth(false);
        };
        document.getElementById('connect').onclick = connect;
        document.getElementById('buy').onclick = buy;
        document.getElementById('sell').onclick = sell;
        document.getElementById('reinvest').onclick = reinvest;
        document.getElementById('withdraw').onclick = withdraw;

        if (window.tronWeb) {
            addEventListener('message', function (event) {
                if (event.data.message && !eth) {
console.log(event);
                    load();
                }
            });
        }
        if (window.ethereum) {
            document.getElementById('startMessage').innerHTML = 'loading...';
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js';
            script.onload = function () {
                window.web3 = new Web3(ethereum);
                load();
                if (ethereum.on) {
                    ethereum.on('chainChanged', function () {
                        if (eth) {
                            load();
                        }
                    });
                    ethereum.on('accountsChanged', function () {
                        if (eth) {
                            load();
                        }
                    });
                }
            };
            document.body.appendChild(script);
        } else if (window.tronWeb) {
            setEth(false);
        }

        document.getElementById('buyValue').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                buy();
            }
        };
        document.getElementById('refAddress').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                buy();
            }
        };
        document.getElementById('sellValue').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                sell();
            }
        };
    };

    function setEth(isEth) {
        network = null;
        contract = null;
        account = null;
        eth = isEth;
        document.getElementById('eth').className = eth ? 'active' : '';
        document.getElementById('trx').className = eth ? '' : 'active';
        var list = document.getElementsByClassName('currency');
        for (var i = 0; i < list.length; i++) {
            list[i].innerHTML = eth ? 'ETH' : 'TRX';
        }
        clearContractBalance();
        clearAccount();
        document.getElementById('logs').innerHTML = '';
        if (eth && !window.ethereum) {
            printContractLink(networkEth);
            document.getElementById('startMessage').innerHTML = 'install ' +
                '<a href="https://metamask.io/download.html" target="_blank" rel="noopener">' +
                'metamask</a> or use ' +
                '<a href="https://opera.com" target="_blank" rel="noopener">opera</a>';
        } else if (!eth && !window.tronWeb) {
            printContractLink(networkShasta);
            document.getElementById('startMessage').innerHTML = 'install ' +
                '<a href="https://chrome.google.com/webstore/detail/tronlink/' +
                'ibnejdfjmmkpcnlpebklmnkoeoihofec" target="_blank" rel="noopener">tronlink</a>';
        } else {
            load();
        }
    }

    function load() {
        if (eth) {
            web3.eth.getChainId().then(function (newNetwork) {
                newNetwork = Number(newNetwork);
                if (newNetwork !== networkEth && newNetwork !== networkRopsten &&
                    newNetwork !== networkGoerli) {
                    network = null;
                    account = null;
                    document.getElementById('connect').style.display = 'block';
                    document.getElementById('startMessage').innerHTML =
                        'switch to the main, ropsten or goerli network';
                    printContractLink(networkEth);
                    clearContractBalance();
                    clearAccount();
                    document.getElementById('logs').innerHTML = '';
                    return;
                }
                if (network !== newNetwork) {
                    network = newNetwork;
                    account = null;
                    if (network === networkEth) {
                        contract = new web3.eth.Contract(abi, ethAddress);
                    } else if (network === networkRopsten) {
                        contract = new web3.eth.Contract(abi, ropstenAddress);
                    } else if (network === networkGoerli) {
                        contract = new web3.eth.Contract(abi, goerliAddress);
                    }
                    document.getElementById('startMessage').innerHTML = '';
                    printContractLink(network);
                    clearContractBalance();
                    loadContractBalance();
                    document.getElementById('logs').innerHTML = '';
                    contract.events.allEvents().on('data', function () {
                        if (eth && network !== null) {
                            loadContractBalance();
                            if (account !== null) {
                                loadAccount();
                            }
                        }
                    });
                }

                web3.eth.getAccounts().then(function (accounts) {
                    if (accounts.length === 0) {
                        account = null;
                        document.getElementById('connect').style.display = 'block';
                        clearAccount();
                        document.getElementById('logs').innerHTML = '';
                        return;
                    }
                    if (accounts[0] === account) {
                        return;
                    }
                    account = accounts[0];
                    document.getElementById('connect').style.display = 'none';
                    clearAccount();
                    loadAccount();
                    logAccount();
                }).catch(function (error) {
                    console.error(error);
                    if (error.message) {
                        error = error.message;
                    }
                    alert(error);
                });
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
            });
        } else {
            document.getElementById('connect').style.display = 'block';
            var newAccount = tronWeb.defaultAddress.base58;
            var newNetwork = tronWeb.solidityNode.host;
            printContractLink(networkShasta);
            if (!newAccount) {
                network = null;
                contract = null;
                account = null;
                document.getElementById('startMessage').innerHTML = 'open tronlink';
                printContractLink(networkShasta);
                clearContractBalance();
                clearAccount();
                document.getElementById('logs').innerHTML = '';
                return;
            }
            if (newNetwork !== networkShasta) {
                network = null;
                contract = null;
                account = null;
                document.getElementById('startMessage').innerHTML = 'switch to the shasta network';
                printContractLink(networkShasta);
                clearContractBalance();
                clearAccount();
                document.getElementById('logs').innerHTML = '';
                return;
            }
            if (newNetwork !== network) {
                network = newNetwork;
                var address;
                if (network === networkShasta) {
                    address = shastaAddress;
                }
                tronWeb.contract().at(address).then(function (tronContract) {
                    contract = tronContract;
                    loadContractBalance();
                    loadAccount();
                    contract.Transfer().watch(function (error, result) {
                        if (!error && !eth && network !== null) {
                            loadContractBalance();
                            loadAccount();
                        }
                    });
                    contract.Withdraw().watch(function (error, result) {
                        if (!error && !eth && network !== null) {
                            loadContractBalance();
                            loadAccount();
                        }
                    });
                }).catch(function (error) {
                    network = null;
                    console.error(error);
                    if (error.message) {
                        error = error.message;
                    }
                    alert(error);
                });
                document.getElementById('startMessage').innerHTML = '';
                clearContractBalance();
                document.getElementById('logs').innerHTML = '';
                account = newAccount;
                logAccount();
            } else {
                if (account !== newAccount) {
                    logAccount();
                    account = newAccount;
                }
                if (contract) {
                    loadContractBalance();
                    loadAccount();
                }
            }
        }
    }

    function connect() {
        if (eth) {
            if (!window.ethereum) {
                alert('ethereum is not supported');
                return;
            }
            var f;
            startLoading();
            if (!ethereum.request) {
                f = ethereum.enable();
            } else {
                f = ethereum.request({method: 'eth_requestAccounts'});
            }
            f.then(function () {
                return web3.eth.getChainId();
            }).then(function (newNetwork) {
                stopLoading();
                newNetwork = Number(newNetwork);
                if (newNetwork !== networkEth && newNetwork !== networkRopsten &&
                    newNetwork !== networkGoerli) {
                    alert('switch to the main, ropsten or goerli network');
                }
            }).catch(error);
        } else {
            if (!window.tronWeb) {
                alert('tron is not supported');
            } else if (!tronWeb.defaultAddress.base58) {
                alert('unlock tronlink');
            } else {
                var newNetwork = tronWeb.solidityNode.host;
                if (newNetwork !== networkShasta) {
                    alert('switch to the shasta network');
                }
            }
        }
    }

    function buy() {
        document.getElementById('buyValueHint').innerHTML = '';
        document.getElementById('refAddressHint').innerHTML = '';
        if (!check()) {
            return;
        }
        if (accountEth && accountEth.isZero()) {
            document.getElementById('buyValueHint').innerHTML = 'you have no ' + eth ? 'eth' : 'trx';
            return;
        }
        var value = new BigNumber(document.getElementById('buyValue').value);
        if (value.isNaN()) {
            document.getElementById('buyValueHint').innerHTML = 'enter a number';
            document.getElementById('buyValue').focus();
            return;
        }
        if (value.isNegative() || value.isZero()) {
            document.getElementById('buyValueHint').innerHTML = 'enter a positive number';
            document.getElementById('buyValue').focus();
            return;
        }
        if (accountEth && value.isGreaterThan(accountEth)) {
            document.getElementById('buyValueHint').innerHTML =
                'enter a number less than ' + accountEth.toFixed(6, BigNumber.ROUND_FLOOR);
            document.getElementById('buyValue').focus();
            return;
        }
        var address = document.getElementById('refAddress').value;
        if (address !== '') {
            if (eth) {
                if (!web3.utils.isAddress(address)) {
                    document.getElementById('refAddressHint').innerHTML = 'enter correct address';
                    document.getElementById('refAddress').focus();
                    return;
                }
            } else {
                if (!tronWeb.isAddress(address)) {
                    document.getElementById('refAddressHint').innerHTML = 'enter correct address';
                    document.getElementById('refAddress').focus();
                    return;
                }
            }
        }
        startLoading();
        if (address !== '') {
            if (eth) {
                contract.methods.balanceOf(address).call().then(function (balance) {
                    if (new BigNumber(balance).shiftedBy(-18).isLessThan(10)) {
                        stopLoading();
                        document.getElementById('refAddressHint').innerHTML = 'not a referral';
                        document.getElementById('refAddress').focus();
                    } else {
                        doEthTx();
                    }
                }).catch(error);
            } else {
                contract.balanceOf(address).call().then(function (balance) {
                    if (new BigNumber(balance).shiftedBy(-18).isLessThan(10)) {
                        stopLoading();
                        document.getElementById('refAddressHint').innerHTML = 'not a referral';
                        document.getElementById('refAddress').focus();
                    } else {
                        doTronTx();
                    }
                }).catch(error);
            }
        } else {
            if (eth) {
                address = '0x0000000000000000000000000000000000000000';
                doEthTx();
            } else {
                address = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
                doTronTx();
            }
        }

        function doEthTx() {
            var message;
            contract.methods.buy(address).send({
                from: account,
                value: value.shiftedBy(18)
            }).on('transactionHash', function (hash) {
                stopLoading();
                document.getElementById('buyValue').value = '';
                document.getElementById('refAddress').value = '';
                message = logTx('purchase for ' + value + ' ETH', hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadContractBalance();
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        }

        function doTronTx() {
            var message;
            contract.buy(address).send({
                callValue: value.shiftedBy(6)
            }).then(function (hash) {
                stopLoading();
                document.getElementById('buyValue').value = '';
                document.getElementById('refAddress').value = '';
                message = logTx('purchase for ' + value + ' TRON', hash);
            }).catch(error);
        }
    }

    function sell() {
        document.getElementById('sellValueHint').innerHTML = '';
        if (!check()) {
            return;
        }
        if (accountTokens && accountTokens.isZero()) {
            document.getElementById('sellValueHint').innerHTML = 'you have no tokens';
            document.getElementById('buyValue').focus();
            return;
        }
        var value = new BigNumber(document.getElementById('sellValue').value);
        if (value.isNaN()) {
            document.getElementById('sellValueHint').innerHTML = 'enter a number';
            document.getElementById('sellValue').focus();
            return;
        }
        if (value.isNegative() || value.isZero()) {
            document.getElementById('sellValueHint').innerHTML = 'enter a positive number';
            document.getElementById('sellValue').focus();
            return;
        }
        if (accountTokens && value.isGreaterThan(accountTokens)) {
            document.getElementById('sellValueHint').innerHTML =
                'enter a number less than ' + accountTokens.toFixed(6, BigNumber.ROUND_FLOOR);
            document.getElementById('sellValue').focus();
            return;
        }
        startLoading();
        var message;
        if (eth) {
            contract.methods.sell(value.shiftedBy(18).toFixed(0)).send({
                from: account
            }).on('transactionHash', function (hash) {
                stopLoading();
                document.getElementById('sellValue').value = '';
                message = logTx('sale of ' + value + ' PIT', hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        } else {
            contract.sell(value.shiftedBy(18).toFixed(0)).send().then(function (hash) {
                stopLoading();
                document.getElementById('sellValue').value = '';
                message = logTx('sale of ' + value + ' PIT', hash);
            }).catch(error);
        }
    }

    function withdraw() {
        if (!check()) {
            return;
        }
        startLoading();
        var message;
        if (eth) {
            contract.methods.withdraw().send({
                from: account
            }).on('transactionHash', function (hash) {
                stopLoading();
                message = logTx('withdrawal', hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadContractBalance();
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        } else {
            contract.withdraw().send().then(function (hash) {
                stopLoading();
                message = logTx('withdrawal', hash);
            }).catch(error);
        }
    }

    function reinvest() {
        if (!check()) {
            return;
        }
        startLoading();
        var message;
        if (eth) {
            contract.methods.reinvest().send({
                from: account
            }).on('transactionHash', function (hash) {
                stopLoading();
                message = logTx('reinvest', hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        } else {
            contract.reinvest().send().then(function (hash) {
                stopLoading();
                message = logTx('reinvest', hash);
            }).catch(error);
        }
    }


    function printContractLink(network) {
        if (eth) {
            if (network === networkEth) {
                document.getElementById('contract').innerHTML = ethAddress;
                document.getElementById('contract').href =
                    'https://etherscan.io/address/' + ethAddress;
            } else if (network === networkRopsten) {
                document.getElementById('contract').innerHTML = ropstenAddress;
                document.getElementById('contract').href =
                    'https://ropsten.etherscan.io/address/' + ropstenAddress;
            } else if (network === networkGoerli) {
                document.getElementById('contract').innerHTML = goerliAddress;
                document.getElementById('contract').href =
                    'https://goerli.etherscan.io/address/' + goerliAddress;
            }
        } else {
            if (network === networkShasta) {
                document.getElementById('contract').innerHTML = shastaAddress;
                document.getElementById('contract').href =
                    'https://shasta.tronscan.org/#/contract/' + shastaAddress;
            }
        }
    }

    function clearContractBalance() {
        document.getElementById('contractBalance').title = '';
        document.getElementById('contractBalance').innerHTML = '...';
    }

    function loadContractBalance() {
        if (eth) {
            web3.eth.getBalance(contract.options.address).then(function (balance) {
                balance = new BigNumber(balance).shiftedBy(-18);
                printValue(balance, document.getElementById('contractBalance'));
            }).catch(error);
        } else {
            tronWeb.trx.getUnconfirmedBalance(contract.address).then(function (balance) {
                balance = new BigNumber(balance).shiftedBy(-6);
                printValue(balance, document.getElementById('contractBalance'));
            }).catch(error);
        }
    }

    function clearAccount() {
        accountEth = null;
        accountTokens = null;
        document.getElementById('balance').title = '';
        document.getElementById('balance').innerHTML = '...';
        document.getElementById('buyValueHint').innerHTML = '';
        document.getElementById('buyValue').value = '';
        document.getElementById('refAddressHint').innerHTML = '';
        document.getElementById('refAddress').value = '';
        document.getElementById('sellValueHint').innerHTML = '';
        document.getElementById('sellValue').value = '';
        document.getElementById('dividend').title = '';
        document.getElementById('dividend').innerHTML = '...';
        document.getElementById('refDividend').title = '';
        document.getElementById('refDividend').innerHTML = '...';
    }

    function loadAccount() {
        var refDividend;
        if (eth) {
            contract.methods.refDividendsOf(account).call().then(function (dividends) {
                refDividend = new BigNumber(dividends).shiftedBy(-19);
                printValue(refDividend, document.getElementById('refDividend'));
                return contract.methods.dividendsOf(account).call();
            }).then(function (dividends) {
                if (dividends === '1') {
                    dividends = '0';
                }
                dividends = new BigNumber(dividends).shiftedBy(-19).plus(refDividend);
                printValue(dividends, document.getElementById('dividend'));
            }).catch(error);
            contract.methods.balanceOf(account).call().then(function (balance) {
                accountTokens = new BigNumber(balance).shiftedBy(-18);
                printValue(accountTokens, document.getElementById('balance'));
            }).catch(error);
            web3.eth.getBalance(account).then(function (balance) {
                accountEth = new BigNumber(balance).shiftedBy(-18);
            }).catch(error);
        } else {
            contract.refDividendsOf(account).call().then(function (dividends) {
                refDividend = new BigNumber(dividends).shiftedBy(-19);
                printValue(refDividend, document.getElementById('refDividend'));
                return contract.dividendsOf(account).call();
            }).then(function (dividends) {
                if (dividends === '1') {
                    dividends = '0';
                }
                dividends = new BigNumber(dividends).shiftedBy(-19).plus(refDividend);
                printValue(dividends, document.getElementById('dividend'));
            }).catch(error);
            contract.balanceOf(account).call().then(function (balance) {
                accountTokens = new BigNumber(balance).shiftedBy(-18);
                printValue(accountTokens, document.getElementById('balance'));
            }).catch(error);
            tronWeb.trx.getUnconfirmedBalance(account).then(function (balance) {
                accountEth = new BigNumber(balance).shiftedBy(-6);
            }).catch(error);
        }
    }

    function logAccount() {
        var p = document.createElement('p');
        p.className = 'onestring';
        var span = document.createElement('span');
        span.innerHTML = 'account ';
        p.appendChild(span);
        var a = document.createElement('a');
        if (eth) {
            a.innerHTML = web3.utils.toChecksumAddress(account);
            if (network === networkEth) {
                a.href = 'https://etherscan.io/address/' + account;
            } else if (network === networkRopsten) {
                a.href = 'https://ropsten.etherscan.io/address/' + account;
            } else if (network === networkGoerli) {
                a.href = 'https://goerli.etherscan.io/address/' + account;
            }
        } else {
            a.innerHTML = account;
            if (network === networkShasta) {
                a.href = 'https://shasta.tronscan.org/#/address/' + account;
            }
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        var div = document.getElementById('logs');
        div.insertBefore(p, div.firstChild);
    }

    function logTx(message, hash) {
        var p = document.createElement('p');
        p.classList.add('onestring');
        var span = document.createElement('span');
        span.innerHTML = message + ', tx ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = hash;
        if (eth) {
            if (network === networkEth) {
                a.href = 'https://etherscan.io/tx/' + hash;
            } else if (network === networkRopsten) {
                a.href = 'https://ropsten.etherscan.io/tx/' + hash;
            } else if (network === networkGoerli) {
                a.href = 'https://goerli.etherscan.io/tx/' + hash;
            }
        } else {
            if (network === networkShasta) {
                a.href = 'https://shasta.tronscan.org/#/transaction/' + hash;
            }
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        span = document.createElement('span');
        if (eth) {
            span.innerHTML = ' - unconfirmed';
        }
        p.appendChild(span);
        var logs = document.getElementById('logs');
        logs.insertBefore(p, logs.firstChild);
        return span;
    }

    function printNetwork() {
        var p = document.createElement('p');
        if (eth) {
            if (network === networkEth) {
                p.innerHTML = 'ethereum mainnet';
            } else if (network === networkRopsten) {
                p.innerHTML = 'ethereum ropsten test network';
            } else if (network === networkGoerli) {
                p.innerHTML = 'ethereum goerli test network';
            }
        } else {
            if (network === networkShasta) {
                p.innerHTML = 'tron shasta test network';
            }
        }
        var logs = document.getElementById('logs');
        logs.insertBefore(p, logs.firstChild);
    }


    function check() {
        if (eth && !window.ethereum) {
            alert('ethereum is not supported');
        } else if (!eth && !window.tronWeb) {
            alert('tron is not supported');
        } else if (network === null) {
            if (eth) {
                alert('switch to the main, ropsten or goerli network');
            } else {
                alert('switch to the shasta network');
            }
        } else if (account === null) {
            connect();
        } else {
            return true;
        }
        return false;
    }

    function error(error) {
        stopLoading();
        console.error(error);
        if (error.message) {
            error = error.message;
        }
        alert('error: ' + error);
    }

    function printValue(value, element) {
        if (value.isZero()) {
            element.title = '';
            element.innerHTML = '0';
        } else {
            element.title = value.toFixed(18);
            if (value.isGreaterThan(0.001)) {
                element.innerHTML = value.toFixed(3, BigNumber.ROUND_DOWN);
            } else if (value.isGreaterThan(0.000001)) {
                element.innerHTML = value.toFixed(6, BigNumber.ROUND_DOWN);
            } else {
                element.innerHTML = value.toExponential(3, BigNumber.ROUND_DOWN);
            }
        }
    }

    function startLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    function stopLoading() {
        document.getElementById('loading').style.display = 'none';
    }
})();