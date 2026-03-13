import { useEffect, useState } from "react";
import { trpc } from "../lib/trpc";
import { CheckCircle2, Loader2, AlertCircle, Phone, Shield } from "lucide-react";

export default function MailingListConfirm({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const confirmMutation = trpc.mailingList.confirmRegistration.useMutation();
  const trackMutation = trpc.mailingList.trackClick.useMutation();

  useEffect(() => {
    if (!params.token) {
      setStatus("error");
      setErrorMsg("Invalid registration link");
      return;
    }

    trackMutation.mutate({ token: params.token });

    confirmMutation.mutate({ token: params.token }, {
      onSuccess: (result) => {
        if (!result.success) {
          setStatus("error");
          setErrorMsg(result.error || "Registration failed");
          return;
        }
        setData(result);
        setStatus(result.alreadyRegistered ? "already" : "success");
      },
      onError: (err) => {
        setStatus("error");
        setErrorMsg(err.message || "Registration failed");
      },
    });
  }, [params.token]);

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {status === "loading" && (
          <div className="bg-[#111827] rounded-2xl border border-white/10 p-10 text-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Confirming your registration...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-[#111827] rounded-2xl border border-red-500/30 p-10 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Registration Failed</p>
            <p className="text-gray-400 text-sm mt-2">{errorMsg}</p>
            <p className="text-gray-600 text-xs mt-4">
              If this issue persists, please contact your event organiser.
            </p>
          </div>
        )}

        {(status === "success" || status === "already") && data && (
          <div className="bg-[#111827] rounded-2xl border border-green-500/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-900/40 to-[#111827] p-8 text-center border-b border-white/10">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
              <h1 className="text-white text-2xl font-bold">
                {status === "already" ? "Already Registered" : "Registration Confirmed!"}
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Welcome, {data.firstName} {data.lastName}
              </p>
              {data.eventTitle && (
                <p className="text-blue-400 text-sm mt-1 font-medium">{data.eventTitle}</p>
              )}
            </div>

            {/* PIN Display */}
            {data.accessPin && (
              <div className="p-6">
                <div className="bg-gradient-to-br from-violet-900/30 to-[#0a0d14] border-2 border-violet-500/40 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <span className="text-[11px] font-bold uppercase tracking-[3px] text-violet-400">
                      CuraLive Direct — Your Personal PIN
                    </span>
                  </div>
                  <div className="text-5xl font-black text-white font-mono tracking-[12px] my-4">
                    {data.accessPin}
                  </div>
                  <p className="text-sm text-violet-300/70">
                    Enter this PIN when you dial in — you'll be connected directly to the conference.
                  </p>
                </div>

                <div className="mt-4 bg-[#0f172a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">How to Join</span>
                  </div>
                  <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
                    <li>Dial the event number (see your confirmation email)</li>
                    <li>When prompted, enter your PIN: <strong className="text-white">{data.accessPin}</strong></li>
                    <li>You'll be connected directly — no operator needed</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="px-6 pb-6">
              <p className="text-xs text-gray-600 text-center">
                A confirmation email with full details has been sent to your inbox.
                Keep your PIN confidential — it is unique to your registration.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-700 mt-6">
          Powered by CuraLive · Secure Investor Events Platform
        </p>
      </div>
    </div>
  );
}
