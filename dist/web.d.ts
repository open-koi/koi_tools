import { Common } from "./common";
export declare class Web extends Common {
    /**
     * Get top contents of user
     * @returns Array of user contents
     */
    myContent(): Promise<[any]>;
    /**
     *
     * @returns
     */
    getTopContent(): Promise<import("axios").AxiosResponse<unknown>>;
}
