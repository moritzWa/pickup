// forces a switch to exhaustively handle every case
export const guardSwitch = (val: never): never => {
    throw new Error(`error for value ${val}`);
};
