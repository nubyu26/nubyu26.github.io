interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPayment) => void;
}

interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

interface PiPayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  transaction?: {
    txid: string;
    verified: boolean;
    _link: string;
  };
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
}

interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

interface PiSDK {
  init: (config: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: PiPayment) => void
  ) => Promise<PiAuthResult>;
  createPayment: (
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ) => void;
}

declare const Pi: PiSDK;
