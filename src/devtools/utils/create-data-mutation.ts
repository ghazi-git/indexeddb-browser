import { createStore } from "solid-js/store";

import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";

export function createDataMutation<Params>(
  callback: (params: Params) => Promise<void>,
) {
  const initialValue: MutationIdle = {
    status: "idle",
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMsg: null,
  };
  const [mutation, setMutation] = createStore<Mutation>(
    structuredClone(initialValue),
  );
  const markAsLoading = () => {
    setMutation({
      status: "loading",
      isLoading: true,
      isSuccess: false,
      isError: false,
      errorMsg: null,
    });
  };
  const markAsSuccessful = () => {
    setMutation({
      status: "success",
      isLoading: false,
      isSuccess: true,
      isError: false,
      errorMsg: null,
    });
  };
  const markAsFailed = (msg: string) => {
    setMutation({
      status: "error",
      isLoading: false,
      isSuccess: false,
      isError: true,
      errorMsg: msg,
    });
  };
  const reset = () => setMutation(structuredClone(initialValue));

  async function mutate(params: Params) {
    markAsLoading();
    try {
      await callback(params);
      markAsSuccessful();
    } catch (e) {
      const msg = e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
      markAsFailed(msg);
      throw new Error(msg);
    }
  }

  return { mutation, mutate, reset };
}

export type Mutation =
  | MutationIdle
  | MutationLoading
  | MutationSuccess
  | MutationError;

interface MutationIdle {
  status: "idle";
  isLoading: false;
  isSuccess: false;
  isError: false;
  errorMsg: null;
}

interface MutationLoading {
  status: "loading";
  isLoading: true;
  isSuccess: false;
  isError: false;
  errorMsg: null;
}

interface MutationSuccess {
  status: "success";
  isLoading: false;
  isSuccess: true;
  isError: false;
  errorMsg: null;
}

interface MutationError {
  status: "error";
  isLoading: false;
  isSuccess: false;
  isError: true;
  errorMsg: string;
}
