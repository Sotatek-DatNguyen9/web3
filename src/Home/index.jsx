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
import { useEffect, useState } from "react";
import ConnectWallet from "../connectWallet";
import { CHAIN_LIST, SC_DD2, SC_MasterChef, SC_WETH } from "../utils/connect";
import { formatEther, parseUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import DD2Abi from "../ABI/DD2.json";
import MasterChefAbi from "../ABI/MasterChef.json";
import WETHAbi from "../ABI/WETH.json";
import Popup from "../components/Popup";
import { useEagerConnect, useInactiveListener } from "../utils/listener";
import {
  getContractDD2,
  getContractMasterChef,
  getContractWETH,
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
  const [openStakePopup, setOpenStakePopup] = useState(false);
  const [openWithdrawPopup, setOpenWithdrawPopup] = useState(false);

  const getBalanceWETH = async () => {
    const WETHContract = getContractWETH(library);
    const balance = await WETHContract.balanceOf(account);
    return balance;
  };
  const triedEager = useEagerConnect();
  useInactiveListener(!triedEager);

  const getPendingDD2 = async () => {
    const masterChefContract = getContractMasterChef(library);
    const pendding = await masterChefContract.pendingDD2(account);
    return pendding;
  };
  const getBalanceDD2 = async () => {
    const DD2Contract = getContractDD2(library);
    const balance = await DD2Contract.balanceOf(account);
    return balance;
  };
  const getTotalWETH = async () => {
    const WETHContract = getContractWETH(library);
    const balance = await WETHContract.totalSupply();
    return balance;
  };

  const getStatusApprove = async () => {
    const WETHContract = getContractWETH(library);
    const allowance = await WETHContract.allowance(account, SC_MasterChef);
    return allowance;
  };
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
  useEffect(() => {
    (async function () {
      if (library) {
        Promise.all([
          getPendingDD2(),
          getBalanceDD2(),
          getTotalWETH(),
          getBalanceWETH(),
          getStatusApprove(),
        ]).then((res) => {
          setPeddingDD2(res[0]);
          setBalanceDD2(res[1]);
          setTotalWETH(res[2]);
          setBalanceWETH(res[3]);
          setApprove(res[4] !== clearBigNumber);
        });
      }
      if (!account) {
        setPeddingDD2(clearBigNumber);
        setBalanceDD2(clearBigNumber);
        setTotalWETH(clearBigNumber);
        setBalanceWETH(clearBigNumber);
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
    console.log(value, balanceDD2.toString());
    if (value <= balanceDD2.toString()) {
      setActiveWithdraw(true);
      setOpenStakePopup(false);
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
    }
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
                Your Stake: {`${formatEther(balanceDD2)} DD2`}
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
