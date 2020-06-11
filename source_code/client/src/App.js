import React, { Component } from "react";
import IdentityLedger from "./IdentityLedger.json";
import getWeb3 from "./getWeb3";
import truffleContract from "truffle-contract";
import ipfs from "./ipfs";
import { encryptMessage, decryptMessage } from "./encrypt";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      storedValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      ipfsHash: null,
      sendIPFSHash: "",
      sendtoAddress: "",
      sendtoPublicKey: "",
      encryptedIPFSHash: "",
      receivedIPFS: ""
    };

    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handlePublicKeyChange = this.handlePublicKeyChange.bind(this);
    this.handleIPFSChange = this.handleIPFSChange.bind(this);
    this.handleIPFSSend = this.handleIPFSSend.bind(this);
    this.handleIPFSReceived = this.handleIPFSReceived.bind(this);
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const Contract = truffleContract(IdentityLedger);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      instance.inboxResponse().on("data", result => {
        this.setState({ receivedIPFS: result.args[0] });
      });

      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      alert(`Unable to load web3, accounts, or contract.`);
      console.error(error);
    }
  };

  handlePublicKeyChange(event) {
    this.setState({ sendtoPublicKey: event.target.value });
  }

  handleAddressChange(event) {
    this.setState({ sendtoAddress: event.target.value });
  }

  handleIPFSChange(event) {
    this.setState({ sendIPFSHash: event.target.value });
  }

  handleIPFSSend(event) {
    event.preventDefault();
    const contract = this.state.contract;
    const account = this.state.accounts[0];
    encryptMessage(this.state.sendtoPublicKey, this.state.sendIPFSHash).then(
      result => {
        this.setState({ encryptedIPFSHash: result });
        document.getElementById("new-notification-form").reset();
        this.setState({ showNotification: true });
        console.log(this.state.encryptedIPFSHash);
        contract
          .sendIPFS(this.state.sendtoAddress, this.state.encryptedIPFSHash, {
            from: account
          })
          .then(result => {
            console.log("hello");
            this.setState({ sendtoAddress: "" });
            this.setState({ sendIPFSHash: "" });
          });
      }
    );
  }

  handleIPFSReceived(event) {
    event.preventDefault();
    const contract = this.state.contract;
    const account = this.state.accounts[0];
    contract.checkInbox({ from: account });
  }

  convertToBuffer = async reader => {
    const buffer = await Buffer.from(reader.result);
    this.setState({ buffer });
  };

  captureFile = event => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => this.convertToBuffer(reader);
  };

  onIPFSSubmit = async event => {
    event.preventDefault();
    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      console.log(err, ipfsHash);
      this.setState({ ipfsHash: ipfsHash[0].hash });
    });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    const receivedIPFStoShow = this.state.receivedIPFS;
    return (
      <body>
        <div class="navbar">
          <h1> Identity Ledger on Blockchain </h1>
        </div>

        <div className="App">
          <table align="center" width="85%">
            <tr width="50%">
              <td width="70%" height="75" class="colname" align="center">
                Sender
              </td>
              <td width="30%" height="75" class="colname">
                Receiver
              </td>
            </tr>
            <tr width="50%">
              <td width="50%" class="partition">
                <h2> File Details </h2>
                <form
                  id="ipfs-hash-form"
                  className="scep-form"
                  onSubmit={this.onIPFSSubmit}
                >
                  <table align="center">
                    <th>
                      <button class="button button2">
                        {" "}
                        <input type="file" onChange={this.captureFile} />
                      </button>
                    </th>
                    <th>
                      <button class="button button2" type="submit">
                        Send
                      </button>
                    </th>
                  </table>
                </form>
                <h3>Hash Value: {this.state.ipfsHash}</h3>
                <h2 color="white"> Address Details</h2>
                <form
                  id="new-notification-form"
                  className="scep-form"
                  onSubmit={this.handleIPFSSend}
                >
                  <table align="center" cellspacing="15">
                    <th>
                      <label>
                        Receiver Address: &nbsp;
                        <input
                          class="heighttext"
                          type="text"
                          value={this.state.value}
                          onChange={this.handleAddressChange}
                        />
                      </label>
                    </th>
                    <th>
                      <label>
                        Public Key:
                        <input
                          class="heighttext"
                          type="text"
                          value={this.state.value}
                          onChange={this.handlePublicKeyChange}
                        />
                      </label>
                    </th>
                    <th>
                      <label class="address">
                        IPFS Address: &nbsp;
                        <input
                          type="text"
                          class="heighttext"
                          value={this.state.value}
                          onChange={this.handleIPFSChange}
                        />
                      </label>
                    </th>
                  </table>
                  <button
                    class="button button2"
                    value="Submit"
                    type="submit"
                    font-color="black"
                  >
                    Submit
                  </button>
                </form>
              </td>
              <td width="50%">
                <h2> Download File </h2>
                <button
                  class="button button2"
                  onClick={this.handleIPFSReceived}
                >
                  Download
                </button>
                <br></br> <br></br> <br></br>
                {receivedIPFStoShow.length > 0 && (
                  <textarea type="text" class="heighttext">
                    {receivedIPFStoShow}
                  </textarea>
                )}
              </td>
            </tr>
          </table>

          <br></br>
          <br></br>

          <br></br>
        </div>
      </body>
    );
  }
}
export default App;
