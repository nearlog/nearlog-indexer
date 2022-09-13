import { near, BigInt, json } from "@graphprotocol/graph-ts";
import { OptionEntity } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  log.info("receipt id: {}", [receipt.receipt.id.toBase58()]);
  for (let i = 0; i < actions.length; i++) {
    handleAction(actions[i], receipt);
  }
}

function handleAction(
  action: near.ActionValue,
  receiptWithOutcome: near.ReceiptWithOutcome
): void {
  if (action.kind != near.ActionKind.FUNCTION_CALL) {
    return;
  }
  const outcome = receiptWithOutcome.outcome;
  const functionCall = action.toFunctionCall();
  const methodName = functionCall.methodName;
  let timeStamp = receiptWithOutcome.block.header.timestampNanosec.toString();
  let receiptId = receiptWithOutcome.receipt.id.toBase58();

  if (methodName == "create") {
    for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
      let outcomeLog = outcome.logs[logIndex].toString();

      const jsonData = json.try_fromString(outcomeLog);
      if (jsonData._error) return;

      const jsonObject = jsonData.value.toObject();
      let params = jsonObject.get("params");

      if (params) {
        let paramsObject = params.toObject();
        let option_id = paramsObject.get("option_id");
        let option_type = paramsObject.get("option_type");
        let amount = paramsObject.get("amount");
        let strike = paramsObject.get("strike");
        let expiration = paramsObject.get("expiration");
        let premium = paramsObject.get("premium");

        if (option_id) {
          let optionId = `${option_id.toString()}`;
          let optionInfo = OptionEntity.load(optionId);
          if (!optionInfo) {
            optionInfo = new OptionEntity(optionId);
          }

          if (option_type) optionInfo.option_type = option_type.toString();
          if (amount) optionInfo.amount = amount.toString();
          if (strike) optionInfo.strike = strike.toString();
          if (expiration) optionInfo.expiration = expiration.toString();
          if (premium) optionInfo.premium = premium.toString();
        }
      }
    }
  }
}
