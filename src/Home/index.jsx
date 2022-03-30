import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  ListGroup,
  ListGroupItem,
  Row,
  Spinner,
} from "reactstrap";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState,useCallback } from "react";
import ConnectWallet from "../connectWallet";
import { CHAIN_LIST, SC_DD2, SC_MasterChef, SC_WETH } from "../utils/connect";
import { formatEther, parseUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import DD2Abi from "../ABI/DD2.json";
import MasterChefAbi from "../ABI/MasterChef.json";
import WETHAbi from "../ABI/WETH.json";
import Popup from "../components/Popup";
import { useEagerConnect, useInactiveListener } from "../utils/listener";
import moment from "moment";
import { useQueryHistory } from "../utils/query";
import {
  getContractDD2,
  getContractMasterChef,
  getContractWETH,
  getContractMulticall
} from "../utils/contract";
const Home = () => {
  const { chainId, library, account, deactivate } = useWeb3React();
  const clearBigNumber = BigNumber.from(0);
  const [balanceWETH, setBalanceWETH] = useState(clearBigNumber);
  const [approve, setApprove] = useState(false);
  const [activeHarvest, setActiveHarvest] = useState(false);
  const [activeApprove, setActiveApprove] = useState(false);
  const [activeStake, setActiveStake] = useState(false);
  const [activeWithdraw, setActiveWithdraw] = useState(false);
  const [pendingDD2, setPeddingDD2] = useState(clearBigNumber);
  const [balanceDD2, setBalanceDD2] = useState(clearBigNumber);
  const [totalWETH, setTotalWETH] = useState(clearBigNumber);
  const [yourStake, setYourStake] = useState(clearBigNumber);
  const [openStakePopup, setOpenStakePopup] = useState(false);
  const [openWithdrawPopup, setOpenWithdrawPopup] = useState(false);
  const [listHistory, setListHistory] = useState([]);
  const handleFetchData = useQueryHistory();
  console.log(handleFetchData)
  const toggleStake = () => {
    setOpenStakePopup(!openStakePopup);
  };
  const toggleWithdraw = () => {
    setOpenWithdrawPopup(!openWithdrawPopup);
  };
  const formatNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  const triedEager = useEagerConnect();
  const statusState = activeHarvest && activeApprove && activeStake && activeWithdraw;
  useInactiveListener(!triedEager);
  useEffect(() => {
    (async function () {
      if (
        (library && !statusState) ||
        statusState
      ) {
        getDataInfo();
      }
      if (!account) {
        setPeddingDD2(clearBigNumber);
        setBalanceDD2(clearBigNumber);
        setTotalWETH(clearBigNumber);
        setBalanceWETH(clearBigNumber);
        setYourStake(clearBigNumber);
      }
    })();
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    account,
    library,
    chainId,
    activeHarvest,
    activeApprove,
    activeStake,
    activeWithdraw,
  ]);

  const getDataInfo = async () => {
    if (library && account) {
      const multicallContract = getContractMulticall(library);
      let iFaceWETH = new ethers.utils.Interface(WETHAbi);
      let iFaceDD2 = new ethers.utils.Interface(DD2Abi);
      let iFaceMasterChef = new ethers.utils.Interface(MasterChefAbi);

      const callDatas = [
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("balanceOf", [account]),
        },
        {
          target: SC_MasterChef,
          callData: iFaceMasterChef.encodeFunctionData("pendingDD2", [account]),
        },
        {
          target: SC_DD2,
          callData: iFaceDD2.encodeFunctionData("balanceOf", [account]),
        },
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("totalSupply", []),
        },
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("allowance", [
            account,
            SC_MasterChef,
          ]),
        },
        {
          target: SC_MasterChef,
          callData: iFaceMasterChef.encodeFunctionData("userInfo", [account]),
        },
      ];
      const multiResults = await multicallContract.aggregate(callDatas);
      let decodedResults = [];
      if (multiResults) {
        const _multiResults = multiResults.returnData;
        decodedResults.push(
          iFaceWETH.decodeFunctionResult("balanceOf", _multiResults[0])
        );
        decodedResults.push(
          iFaceMasterChef.decodeFunctionResult("pendingDD2", _multiResults[1])
        );
        decodedResults.push(
          iFaceDD2.decodeFunctionResult("balanceOf", _multiResults[2])
        );
        decodedResults.push(
          iFaceWETH.decodeFunctionResult("totalSupply", _multiResults[3])
        );
        decodedResults.push(
          iFaceWETH.decodeFunctionResult("allowance", _multiResults[4])
        );
        decodedResults.push(
          iFaceMasterChef.decodeFunctionResult("userInfo", _multiResults[5])
        );
      }

      setBalanceWETH(decodedResults[0][0]);
      setPeddingDD2(decodedResults[1][0]);
      setBalanceDD2(decodedResults[2][0]);
      setTotalWETH(decodedResults[3][0]);
      setApprove(decodedResults[4][0].toString() !== "0");
      setYourStake(decodedResults[5].amount);
      
    }
  };
  const fetchData = useCallback(async () => {
    try {
      const response = await handleFetchData();

      setListHistory(response?.data.historyEntities);
    } catch (e) {
      console.log(e);
    }
  }, [handleFetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData,account]);

  useEffect(() => {
    if (!library) return;
    const masterChefContract = getContractMasterChef(library);
    masterChefContract.on("Deposit", fetchData).on("Withdraw", fetchData);
    return () => {
      masterChefContract
        .removeAllListeners("Deposit")
        .removeAllListeners("Withdraw");
    };
  }, [fetchData]);


  const onClickHarvest = async () => {
    console.log("sa");
    setActiveHarvest(true);
    const masterChefContract = getContractMasterChef(library);
    await masterChefContract
      .withdraw(0)
      .then(async (res) => {
        await res.wait();
        setActiveHarvest(false);
        alert("succes harvest");
      })
      .catch((err) => {
        alert(err.message);
        setActiveHarvest(false);
      });
  };

  const onSubmitStake = async (value) => {
    if (value <= balanceWETH.toString()) {
      setActiveStake(true);
      setOpenStakePopup(false);
      const masterChefContract = getContractMasterChef(library);
      masterChefContract
        .deposit(parseUnits(value, 18))
        .then(async (res) => {
          await res.wait();
          alert("Stake success !");
          setActiveStake(false);
        })
        .catch((err) => {
          alert(err.message);
          setOpenStakePopup(false);
        });
    }
  };
  const onSubmitWithdraw = async (value) => {
    if (value > formatEther(yourStake)) {
     alert('error');
      return;
    }
    // UI
    setActiveWithdraw(true);
    setOpenStakePopup(false);
    // Call
    const masterChefContract = getContractMasterChef(library);

    masterChefContract
      .withdraw(parseUnits(value, 18))
      .then(async (res) => {
        await res.wait();
        alert("Withdraw  success !");
          setActiveWithdraw(false);
      })
      .catch((err) => {
        alert(err.message);
        setActiveWithdraw(false);
      });
  };

  const onSubmitApprove = async (e) => {
    setActiveApprove(true);
    const myContract = getContractWETH(library);
    myContract
      .approve(SC_MasterChef, balanceWETH.toString())
      .then(async (res) => {
        await res.wait();
        alert("succes ");
        setApprove(true);
        setActiveApprove(false);
      })
      .catch((err) => {
        alert(err.message);
        setActiveApprove(false);
      });
  };
  function PopupStake(props) {
    return <Popup title="Stake" {...props} currency="WETH" />;
  }

  function PopupWithdraw(props) {
    return <Popup title="Withdraw" {...props} currency="DD2" />;
  }
  const styleWrap = {
    maxWidth:'600px',
    margin:'auto'
  }
  return (
    <div style={styleWrap}>
      <Container>
        <Card>
          <CardHeader>
            <Row className="justify-content-between align-items-center">
              <Col>
                <b>Web3</b>
              </Col>
              <Col className="text-right">
                {account ? (
                  <Badge
                    href="#"
                    color="danger"
                    className="ml-2"
                    onClick={() => {
                      deactivate();
                    }}
                  >
                    Logout
                  </Badge>
                ) : (
                  <ConnectWallet />
                )}
              </Col>
            </Row>
          </CardHeader>
          <CardBody>
            <Row>
              <Col sm={6}>
                Wallet address:{" "}
                <b>
                  {account
                    ? account.slice(0, 6) + "..." + account.slice(-4)
                    : ""}
                </b>
              </Col>
              <Col sm={6}>
                Balance: <b>{formatNumber.format(formatEther(balanceWETH))}</b>
              </Col>
              <Col className="mt-2">
                Network: <b>{CHAIN_LIST[chainId]}</b>
              </Col>
            </Row>
            <Row className="justify-content-between align-items-center">
              <Col>
                Token earned:{" "}
                <b>{formatNumber.format(formatEther(pendingDD2))} DD2</b>
              </Col>
              <Col className="text-sm-right" sm="4" xs={12}>
                <Button
                  color="primary"
                  onClick={onClickHarvest}
                  disabled={activeHarvest || !account}
                >
                  Harvest{" "}
                  {activeHarvest && <Spinner size="sm" color="primary" />}
                </Button>
              </Col>
            </Row>

            <Row className="mt-3">
              {!approve ? (
                <Col>
                  <Button
                    size="lg"
                    color="primary"
                    block
                    disabled={activeApprove || !account}
                    onClick={() => {
                      onSubmitApprove();
                    }}
                  >
                    Approve
                  </Button>
                </Col>
              ) : (
                <>
                  <Col>
                    <Button
                      size="lg"
                      className="w-100"
                      color="primary"
                      onClick={() => {
                        toggleStake();
                      }}
                      disabled={activeStake}
                    >
                      Stake
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      size="lg"
                      className="w-100"
                      onClick={() => {
                        toggleWithdraw();
                      }}
                      disabled={activeWithdraw}
                    >
                      Withdraw{" "}
                    </Button>
                  </Col>
                </>
              )}
            </Row>
            <Row>
              <Col className="mt-2">
                Your Stake: {`${formatEther(yourStake)} WETH`}
              </Col>
            </Row>
            <Row>
              <Col className="mt-2">
                Total Stake:{" "}
                {`${formatNumber.format(formatEther(totalWETH))} WETH`}
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
        <CardHeader>
          <Row className="justify-content-between align-items-center">
            <Col>
              <b>Transaction History</b>
            </Col>
          </Row>
        </CardHeader>
        <CardBody style={{ overflowY: "scroll", maxHeight: "40vh" }}>
          <Col>
            <ListGroup className="mt-3" horizontal>
              <ListGroupItem action>Action</ListGroupItem>
              <ListGroupItem action>Amount</ListGroupItem>
              <ListGroupItem action>Time</ListGroupItem>
            </ListGroup>
            {listHistory && listHistory.length ? (
              listHistory.map((h) => (
                <ListGroup className="mt-3" horizontal key={h.id}>
                  <ListGroupItem action>{h.type}</ListGroupItem>
                  <ListGroupItem action>
                    {formatNumber.format(formatEther(h.amount))}
                  </ListGroupItem>
                  <ListGroupItem action>
                    {moment
                      .unix(Number(h.time))
                      .format("kk:mm DD/MM/YYYY")}
                  </ListGroupItem>
                </ListGroup>
              ))
            ) : (
              <h4 style={{ textAlign: "center" }} className="mt-3">
                Not Transaction
              </h4>
            )}
          </Col>
        </CardBody>
      </Card>
        <PopupStake
          show={openStakePopup}
          balance={formatEther(balanceWETH)}
          onToggle={toggleStake}
          onSubmit={onSubmitStake}
        />
        <PopupWithdraw
          show={openWithdrawPopup}
          balance={formatEther(pendingDD2)}
          onToggle={toggleWithdraw}
          onSubmit={onSubmitWithdraw}
        />
      </Container>
    </div>
  );
};
export default Home;
