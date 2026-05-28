import { useState } from "react";

type PaymentStatus =
  | "idle"
  | "authenticating"
  | "creating"
  | "approving"
  | "completing"
  | "success"
  | "cancelled"
  | "error";

async function approvePayment(paymentId: string): Promise<void> {
  const res = await fetch("/.netlify/functions/pi-approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Onay basarisiz");
  }
}

async function completePayment(paymentId: string, txid: string): Promise<void> {
  const res = await fetch("/.netlify/functions/pi-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, txid }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Tamamlama basarisiz");
  }
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  idle: "",
  authenticating: "Kimlik dogrulanıyor...",
  creating: "Odeme baslatılıyor...",
  approving: "Sunucu onaylıyor...",
  completing: "Islem tamamlanıyor...",
  success: "Odeme basarılı!",
  cancelled: "Odeme iptal edildi.",
  error: "Bir hata olustu.",
};

export default function Home() {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [txid, setTxid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePayment = async () => {
    setStatus("authenticating");
    setErrorMsg(null);
    setTxid(null);

    try {
      Pi.init({ version: "2.0", sandbox: true });

      await Pi.authenticate(["username", "payments"], async (incompletePayment) => {
        try {
          await approvePayment(incompletePayment.identifier);
          if (incompletePayment.transaction?.txid) {
            await completePayment(
              incompletePayment.identifier,
              incompletePayment.transaction.txid
            );
          }
        } catch {
        }
      });

      setStatus("creating");

      Pi.createPayment(
        { amount: 0.01, memo: "Test Odemesi", metadata: { type: "test" } },
        {
          onReadyForServerApproval: async (paymentId) => {
            setStatus("approving");
            try {
              await approvePayment(paymentId);
            } catch (err) {
              setStatus("error");
              setErrorMsg(err instanceof Error ? err.message : "Onay hatası");
            }
          },
          onReadyForServerCompletion: async (paymentId, completedTxid) => {
            setStatus("completing");
            try {
              await completePayment(paymentId, completedTxid);
              setTxid(completedTxid);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setErrorMsg(err instanceof Error ? err.message : "Tamamlama hatası");
            }
          },
          onCancel: () => {
            setStatus("cancelled");
          },
          onError: (err) => {
            setStatus("error");
            setErrorMsg(err.message);
          },
        }
      );
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Kimlik dogrulama hatası");
    }
  };

  const isLoading = ["authenticating", "creating", "approving", "completing"].includes(status);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
      padding: "1rem",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "1rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        width: "100%",
        maxWidth: "360px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "50%",
            background: "#facc15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(250,204,21,0.4)",
          }}>
            <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#fff" }}>π</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827" }}>Pi Odeme Testi</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
            Pi Browser'da asagidaki butona tiklayarak odeme akisini test edin.
          </p>
        </div>

        {status === "success" && (
          <div style={{
            width: "100%",
            borderRadius: "0.75rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "1rem",
          }}>
            <p style={{ color: "#15803d", fontWeight: "600", fontSize: "0.875rem" }}>Odeme tamamlandi</p>
            {txid && (
              <p style={{ color: "#16a34a", fontSize: "0.75rem", wordBreak: "break-all", marginTop: "0.25rem" }}>
                Islem ID: {txid}
              </p>
            )}
          </div>
        )}

        {status === "cancelled" && (
          <div style={{
            width: "100%",
            borderRadius: "0.75rem",
            background: "#fefce8",
            border: "1px solid #fef08a",
            padding: "1rem",
          }}>
            <p style={{ color: "#a16207", fontWeight: "600", fontSize: "0.875rem" }}>Odeme iptal edildi</p>
          </div>
        )}

        {status === "error" && (
          <div style={{
            width: "100%",
            borderRadius: "0.75rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "1rem",
          }}>
            <p style={{ color: "#b91c1c", fontWeight: "600", fontSize: "0.875rem" }}>Hata olustu</p>
            {errorMsg && <p style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errorMsg}</p>}
          </div>
        )}

        {isLoading && (
          <div style={{
            width: "100%",
            borderRadius: "0.75rem",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "1rem",
          }}>
            <p style={{ color: "#1d4ed8", fontWeight: "600", fontSize: "0.875rem" }}>
              {STATUS_LABELS[status]}
            </p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "1rem",
            background: isLoading ? "#fde68a" : "#facc15",
            color: "#fff",
            fontWeight: "700",
            fontSize: "1.125rem",
            borderRadius: "0.75rem",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            boxShadow: "0 2px 8px rgba(250,204,21,0.3)",
          }}
        >
          {isLoading ? STATUS_LABELS[status] : "0.01 Pi Ode"}
        </button>

        <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
          Sandbox modu aktif — gercek Pi harcanmaz
        </p>
      </div>
    </div>
  );
}
