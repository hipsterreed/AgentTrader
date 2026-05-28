// Multi-turn tool-call loop for OpenAI Responses API. Pattern:
//   1. Call model (non-streaming) with full input.
//   2. If the response contains function_call items, dispatch each, append the
//      call + its function_call_output to input, loop.
//   3. When the response has no tool calls, re-issue the SAME input with
//      stream:true and hand the stream to ElevenLabs for TTS.
//
// The final-turn re-stream is wasteful (one extra non-streamed call before the
// streamed answer) but keeps the loop dead simple and lets the existing
// session.sendResponse(stream) pipe stay untouched.

import OpenAI from "openai";
import { AGENT_TRADER_PROMPT } from "../prompts/agent-trader";
import { TOOL_DEFS, dispatch } from "../alpaca/tools";
import type { SessionState } from "../alpaca/session-state";

const MODEL = process.env.AGENT_MODEL ?? "gpt-4o-mini";
const MAX_TOOL_ITERATIONS = 6;

type TranscriptMsg = { role: "user" | "agent" | "assistant" | "system"; content: string };

// Input item shape for Responses API (mixed message + function_call + function_call_output).
type InputItem =
  | { role: "user" | "assistant" | "system"; content: string }
  | {
      type: "function_call";
      call_id: string;
      name: string;
      arguments: string;
    }
  | {
      type: "function_call_output";
      call_id: string;
      output: string;
    };

export async function runTurn(opts: {
  openai: OpenAI;
  transcript: TranscriptMsg[];
  signal?: AbortSignal;
  state: SessionState;
  // Hand the final streaming response to ElevenLabs.
  sendResponse: (stream: AsyncIterable<unknown>) => void;
}): Promise<void> {
  const { openai, transcript, signal, state, sendResponse } = opts;

  // Seed input from transcript.
  const input: InputItem[] = transcript.map((m) => ({
    role: m.role === "agent" ? ("assistant" as const) : (m.role as "user" | "system" | "assistant"),
    content: m.content,
  }));

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const resp = (await openai.responses.create(
      {
        model: MODEL,
        instructions: AGENT_TRADER_PROMPT,
        input: input as never,
        tools: TOOL_DEFS as never,
        tool_choice: "auto",
        stream: false,
      },
      { signal },
    )) as unknown as {
      output: Array<{
        type: string;
        call_id?: string;
        name?: string;
        arguments?: string;
      }>;
    };

    const toolCalls = (resp.output ?? []).filter((o) => o.type === "function_call");

    if (toolCalls.length === 0) {
      // Final answer turn — re-stream for TTS.
      const stream = (await openai.responses.create(
        {
          model: MODEL,
          instructions: AGENT_TRADER_PROMPT,
          input: input as never,
          stream: true,
        },
        { signal },
      )) as unknown as AsyncIterable<unknown>;
      sendResponse(stream);
      return;
    }

    // Execute each tool call and append result.
    for (const tc of toolCalls) {
      const name = tc.name ?? "";
      const callId = tc.call_id ?? "";
      const rawArgs = tc.arguments ?? "{}";
      console.log(`[tool] ${name}(${rawArgs})`);
      let output: unknown;
      try {
        output = await dispatch(name, rawArgs, state);
      } catch (err) {
        output = { error: (err as Error).message };
      }
      input.push({
        type: "function_call",
        call_id: callId,
        name,
        arguments: rawArgs,
      });
      input.push({
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(output),
      });
    }
  }

  // Iteration ceiling — bail with a spoken fallback.
  const stream = (await openai.responses.create(
    {
      model: MODEL,
      instructions: AGENT_TRADER_PROMPT,
      input: [
        ...input,
        {
          role: "system",
          content:
            "You hit the tool iteration ceiling. Briefly tell the user something went wrong and ask them to try again.",
        },
      ] as never,
      stream: true,
    },
    { signal },
  )) as unknown as AsyncIterable<unknown>;
  sendResponse(stream);
}
