import React, { useState, useCallback } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  pollId: string;
  question: string;
  options: PollOption[];
  status: "active" | "closed";
  totalVotes: number;
  userVoted?: boolean;
  userVoteId?: string;
}

/**
 * LivePolling Component
 * 
 * Real-time polling interface with Ably-powered vote aggregation.
 * Operators can launch polls and participants vote in real-time.
 */
export function LivePolling({ conferenceId }: { conferenceId: number }) {
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [pollHistory, setPollHistory] = useState<Poll[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Subscribe to poll updates
  useAblyChannel(
    `occ:polling:${conferenceId}`,
    "poll.updated",
    useCallback((message: Types.Message) => {
      const pollData = message.data;

      if (pollData.status === "active") {
        setCurrentPoll({
          pollId: pollData.pollId,
          question: pollData.question,
          options: pollData.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: opt.votes || 0,
          })),
          status: "active",
          totalVotes: pollData.totalVotes || 0,
        });
        setShowResults(false);
      } else if (pollData.status === "closed") {
        setCurrentPoll((prev) =>
          prev
            ? {
                ...prev,
                status: "closed",
                options: pollData.options.map((opt: any) => ({
                  id: opt.id,
                  text: opt.text,
                  votes: opt.votes || 0,
                })),
                totalVotes: pollData.totalVotes || 0,
              }
            : null
        );
        setShowResults(true);
      }
    }, [conferenceId])
  );

  const handleVote = (optionId: string) => {
    if (!currentPoll || currentPoll.status !== "active") {
      toast.error("Poll is not active");
      return;
    }

    // Publish vote to Ably
    // In a real implementation, this would call a tRPC mutation
    toast.success("Vote recorded!");

    setCurrentPoll((prev) =>
      prev
        ? {
            ...prev,
            options: prev.options.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
            totalVotes: prev.totalVotes + 1,
            userVoted: true,
            userVoteId: optionId,
          }
        : null
    );
  };

  const getPercentage = (votes: number, total: number) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  const getBarColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
    ];
    return colors[index % colors.length];
  };

  if (!currentPoll) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No active poll</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Poll Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold">{currentPoll.question}</h3>
          <div className="flex items-center gap-2">
            {currentPoll.status === "active" ? (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-500/20 text-gray-600 rounded-full">
                <Clock className="h-3 w-3" />
                Closed
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {currentPoll.totalVotes} vote{currentPoll.totalVotes !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Poll Options */}
      <div className="space-y-4 mb-6">
        {currentPoll.options.map((option, idx) => {
          const percentage = getPercentage(option.votes, currentPoll.totalVotes);
          const isUserVote = currentPoll.userVoteId === option.id;

          return (
            <div key={option.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{option.text}</p>
                  {isUserVote && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <span className="text-sm font-semibold">{percentage}%</span>
              </div>

              {/* Vote Bar */}
              <div className="relative h-8 bg-secondary rounded overflow-hidden">
                <div
                  className={`${getBarColor(idx)} h-full transition-all duration-300 flex items-center justify-end pr-2`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 10 && (
                    <span className="text-xs font-bold text-white">
                      {option.votes}
                    </span>
                  )}
                </div>
                {percentage <= 10 && percentage > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground">
                    {option.votes}
                  </span>
                )}
              </div>

              {/* Vote Button */}
              {currentPoll.status === "active" && !currentPoll.userVoted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(option.id)}
                  className="w-full mt-2"
                >
                  Vote for this option
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Results Toggle */}
      {currentPoll.status === "closed" && (
        <div className="p-4 bg-background rounded border border-border">
          <p className="text-sm text-muted-foreground">
            ✓ Poll closed. Final results displayed above.
          </p>
        </div>
      )}

      {/* Poll Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border mt-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Votes</p>
          <p className="text-2xl font-bold">{currentPoll.totalVotes}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Leading Option</p>
          <p className="text-sm font-semibold">
            {currentPoll.options.length > 0
              ? currentPoll.options.reduce((max, opt) =>
                  opt.votes > max.votes ? opt : max
                ).text
              : "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className="text-sm font-semibold capitalize">
            {currentPoll.status}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * PollManager Component
 * 
 * Operator interface for creating and managing polls.
 */
export function PollManager({ conferenceId }: { conferenceId: number }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    if (!question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    setIsCreating(true);

    // In a real implementation, this would call a tRPC mutation
    setTimeout(() => {
      toast.success("Poll created and launched!");
      setQuestion("");
      setOptions(["", ""]);
      setIsCreating(false);
    }, 500);
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Create New Poll</h3>

      <div className="space-y-4">
        {/* Question Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Poll Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What is your question?"
            className="w-full px-3 py-2 border border-border rounded bg-background"
          />
        </div>

        {/* Options */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Poll Options
          </label>
          <div className="space-y-2">
            {options.map((option, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-2 border border-border rounded bg-background"
                />
                {options.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(idx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="w-full mt-2"
          >
            + Add Option
          </Button>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreatePoll}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Launch Poll"}
        </Button>
      </div>
    </Card>
  );
}
