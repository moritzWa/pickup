import { FailureOrSuccess } from "../logic";
import { CodecError } from "../logic/errors";

export interface CodecEnvelope<TTag extends string, TData> {
    tag: TTag;
    payload: TData;
}

export interface ICodec<TData = never> {
    // returns a stringified envelope
    encode(data: TData): FailureOrSuccess<CodecError<"ENCODE">, string>;
    decode(envelope: string): FailureOrSuccess<CodecError<"DECODE">, TData>;
}
