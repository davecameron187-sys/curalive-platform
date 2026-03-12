import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface LoadIRContactsButtonProps {
  eventId: string;
  onLoad: (contacts: Array<{ id: string; name: string; phone: string; company: string; role: "participant" | "moderator" | "host" }>) => void;
}

export function LoadIRContactsButton({ eventId, onLoad }: LoadIRContactsButtonProps) {
  const handleLoadIRContacts = async () => {
    try {
      const contacts = await trpc.occ.getIRContacts.query({ eventId });
      if (!contacts.length) {
        toast.info("No active IR contacts found");
        return;
      }

      const imported = contacts
        .map((c) => ({
          id: `ir-${c.id}`,
          name: c.name || "Unknown",
          phone: c.phoneNumber || "",
          company: c.company || "",
          role: "participant" as const,
        }))
        .filter((c) => c.phone.trim());

      onLoad(imported);
      toast.success(`Loaded ${imported.length} IR contacts`);
    } catch (error) {
      toast.error("Failed to load IR contacts");
      console.error("Load IR contacts error:", error);
    }
  };

  return (
    <button
      onClick={handleLoadIRContacts}
      className="flex items-center gap-1 bg-blue-800/40 hover:bg-blue-700/50 text-blue-300 text-[10px] font-semibold px-2 py-1 rounded transition-colors"
      title="Load active IR contacts from database"
    >
      <UserPlus className="w-3 h-3" />
      Load IR Contacts
    </button>
  );
}
