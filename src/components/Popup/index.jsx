import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Input,
  InputGroup,
  InputGroupAddon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";

const formatNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export default function Popup({
  title,
  currency,
  balance,
  show,
  onToggle,
  onSubmit,
}) {
  const closeBtn = (
    <button className="close" onClick={onToggle}>
      &times;
    </button>
  );
  const [value, setValue] = useState("");
  useEffect(() => {
    // Reset value when close popup
    setValue("");
  }, [show]);

  return (
    <Modal isOpen={show} toggle={onToggle} centered>
      <ModalHeader toggle={onToggle} close={closeBtn}>
        {title}
      </ModalHeader>
      <ModalBody>
        <Row className="justify-content-center">
          <Col>
            <InputGroup>
              <Input
                type="number"
                max={balance}
                placeholder="Input balance"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                }}
              />
            </InputGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            You balance: <b>{formatNumber.format(balance)}</b> {currency}
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button
          disabled={value.length === 0}
          color="primary"
          onClick={() => {
            onSubmit(value);
          }}
        >
          {title}
        </Button>{" "}
        <Button color="primary" onClick={onToggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
