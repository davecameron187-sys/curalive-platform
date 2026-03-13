import { useEffect, useState } from "react";
import { trpc } from "../lib/trpc";
import { CheckCircle2, Loader2, AlertCircle, Phone, Shield, Monitor, Video, Globe } from "lucide-react";

type JoinMethod = "phone" | "teams" | "zoom" | "web";
type PageStatus = "loading" | "choose" | "confirming" | "success" | "already" | "error";

const JOIN_OPTIONS: { method: JoinMethod; label: string; description: string; icon: typeof Phone; color: string; borderColor: string; bgColor: string }[] = [
  {
    method: "phone",
    label: "Phone Dial-In",
    description: "Dial in with your personal PIN — no operator needed",
    icon: Phone,
    color: "text-violet-400",
    borderColor: "border-violet-500/40",
    bgColor: "bg-violet-500/10",
  },
  {
    method: "teams",
    label: "Microsoft Teams",
    description: "Join via Microsoft Teams meeting link",
    icon: Monitor,
    color: "text-indigo-400",
    borderColor: "border-indigo-500/40",
    bgColor: "bg-indigo-500/10",
  },
  {
    method: "zoom",
    label: "Zoom",
    description: "Join via Zoom meeting link",
    icon: Video,
    color: "text-blue-400",
    borderColor: "border-blue-500/40",
    bgColor: "bg-blue-500/10",
  },
  {
    method: "web",
    label: "Web Browser",
    description: "Join directly from your browser — no downloads needed",
    icon: Globe,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
  },
];

export default function MailingListConfirm({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<JoinMethod | null>(null);

  const entryQuery = trpc.mailingList.getEntryByToken.useQuery(
    { token: params.token },
    { enabled: !!params.token, retry: false }
  );

  const confirmMutation = trpc.mailingList.confirmRegistration.useMutation();
  const trackMutation = trpc.mailingList.trackClick.useMutation();

  useEffect(() => {
    if (!params.token) {
      setStatus("error");
      setErrorMsg("Invalid registration link");
      return;
    }
    trackMutation.mutate({ token: params.token });
  }, [params.token]);

  useEffect(() => {
    if (entryQuery.data) {
      const result = entryQuery.data;
      if (!result.success) {
        setStatus("error");
        setErrorMsg(result.error || "Invalid registration link");
      } else if (result.alreadyRegistered) {
        setData(result);
        setStatus("already");
      } else {
        setData(result);
        setStatus("choose");
      }
    }
    if (entryQuery.error) {
      setStatus("error");
      setErrorMsg(entryQuery.error.message || "Failed to load registration");
    }
  }, [entryQuery.data, entryQuery.error]);

  const handleConfirm = () => {
    if (!selectedMethod) return;
    setStatus("confirming");
    confirmMutation.mutate(
      { token: params.token, joinMethod: selectedMethod },
      {
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
      }
    );
  };

  const joinMethodLabel = (method: string) => {
    const labels: Record<string, string> = { phone: "Phone Dial-In", teams: "Microsoft Teams", zoom: "Zoom", web: "Web Browser" };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {(status === "loading" || entryQuery.isLoading) && (
          <div className="bg-[#111827] rounded-2xl border border-white/10 p-10 text-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Loading registration...</p>
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

        {status === "confirming" && (
          <div className="bg-[#111827] rounded-2xl border border-white/10 p-10 text-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Confirming your registration...</p>
            <p className="text-gray-500 text-sm mt-2">Setting up your {selectedMethod && joinMethodLabel(selectedMethod)} access</p>
          </div>
        )}

        {status === "choose" && data && (
          <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900/40 to-[#111827] p-8 text-center border-b border-white/10">
              <h1 className="text-white text-2xl font-bold">How would you like to join?</h1>
              <p className="text-gray-400 text-sm mt-2">
                Welcome, {data.firstName} {data.lastName}
              </p>
              {data.eventTitle && (
                <p className="text-blue-400 text-sm mt-1 font-medium">{data.eventTitle}</p>
              )}
            </div>

            <div className="p-6 space-y-3">
              {JOIN_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedMethod === opt.method;
                return (
                  <button
                    key={opt.method}
                    onClick={() => setSelectedMethod(opt.method)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${opt.borderColor} ${opt.bgColor}`
                        : "border-white/10 hover:border-white/20 bg-[#0a0d14]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.bgColor}`}>
                      <Icon className={`w-6 h-6 ${opt.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${isSelected ? "text-white" : "text-gray-200"}`}>{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? `${opt.borderColor} ${opt.bgColor}` : "border-gray-600"
                    }`}>
                      {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${opt.color.replace("text-", "bg-")}`} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleConfirm}
                disabled={!selectedMethod}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-bold text-sm transition-colors"
              >
                {selectedMethod ? `Confirm & Register via ${joinMethodLabel(selectedMethod)}` : "Select a join method to continue"}
              </button>
            </div>
          </div>
        )}

        {status === "already" && data && (
          <div className="bg-[#111827] rounded-2xl border border-amber-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-900/40 to-[#111827] p-8 text-center border-b border-white/10">
              <CheckCircle2 className="w-14 h-14 text-amber-400 mx-auto mb-3" />
              <h1 className="text-white text-2xl font-bold">Already Registered</h1>
              <p className="text-gray-400 text-sm mt-2">
                Welcome back, {data.firstName} {data.lastName}
              </p>
              {data.joinMethod && (
                <p className="text-amber-400 text-sm mt-1 font-medium">
                  Joining via {joinMethodLabel(data.joinMethod)}
                </p>
              )}
            </div>
            <div className="px-6 py-6">
              <p className="text-xs text-gray-600 text-center">
                You have already completed your registration. Check your inbox for confirmation details.
              </p>
            </div>
          </div>
        )}

        {status === "success" && data && (
          <div className="bg-[#111827] rounded-2xl border border-green-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-green-900/40 to-[#111827] p-8 text-center border-b border-white/10">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
              <h1 className="text-white text-2xl font-bold">Registration Confirmed!</h1>
              <p className="text-gray-400 text-sm mt-2">
                Welcome, {data.firstName} {data.lastName}
              </p>
              {data.eventTitle && (
                <p className="text-blue-400 text-sm mt-1 font-medium">{data.eventTitle}</p>
              )}
            </div>

            <div className="p-6 space-y-4">
              {data.joinMethod && (
                <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Join Method</span>
                  </div>
                  <p className="text-white font-semibold">{joinMethodLabel(data.joinMethod)}</p>
                  {data.joinMethod === "phone" && (
                    <p className="text-gray-500 text-xs mt-1">Dial in using your personal PIN below.</p>
                  )}
                  {data.joinMethod === "teams" && (
                    <p className="text-gray-500 text-xs mt-1">A Microsoft Teams meeting link will be sent to you before the event.</p>
                  )}
                  {data.joinMethod === "zoom" && (
                    <p className="text-gray-500 text-xs mt-1">A Zoom meeting link will be sent to you before the event.</p>
                  )}
                  {data.joinMethod === "web" && (
                    <p className="text-gray-500 text-xs mt-1">A link to the CuraLive web attendee room will be sent before the event.</p>
                  )}
                </div>
              )}

              {data.accessPin && data.joinMethod === "phone" && (
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
              )}

              {data.accessPin && data.joinMethod === "phone" && (
                <div className="bg-[#0f172a] rounded-lg p-4">
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
              )}
            </div>

            <div className="px-6 pb-6">
              <p className="text-xs text-gray-600 text-center">
                A confirmation email with full details has been sent to your inbox.
                {data.joinMethod === "phone" && " Keep your PIN confidential — it is unique to your registration."}
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-700 mt-6">
          Powered by CuraLive · Secure Investor Events Platform
        </p>
      </div>
    </div>
  );
}
