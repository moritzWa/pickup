import { TransferType } from "src/core/infra/postgres/entities";

export const getSymbolForTransferType = (t: TransferType) => {
    if (t === TransferType.Sent) return "-";
    if (t === TransferType.Received) return "+";
    return "<>";
};
