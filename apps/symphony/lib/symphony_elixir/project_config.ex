defmodule SymphonyElixir.ProjectConfig do
  @moduledoc """
  Resolved configuration for a single project/WORKFLOW.md.
  All values are pre-resolved (env vars expanded, defaults applied).
  """

  @default_active_states ["Todo", "In Progress"]
  @default_terminal_states ["Closed", "Cancelled", "Canceled", "Duplicate", "Done"]
  @default_workspace_root Path.join(System.tmp_dir!(), "symphony_workspaces")

  defstruct [
    workflow_path: nil,
    tracker_kind: nil,
    linear_endpoint: "https://api.linear.app/graphql",
    linear_api_token: nil,
    linear_project_slug: nil,
    linear_assignee: nil,
    linear_active_states: @default_active_states,
    linear_terminal_states: @default_terminal_states,
    poll_interval_ms: 30_000,
    workspace_root: @default_workspace_root,
    workspace_hooks: %{
      after_create: nil,
      before_run: nil,
      after_run: nil,
      before_remove: nil,
      timeout_ms: 60_000
    },
    max_concurrent_agents: 10,
    max_concurrent_agents_by_state: %{},
    max_retry_backoff_ms: 300_000,
    agent_max_turns: 20,
    codex_command: "codex app-server",
    codex_turn_timeout_ms: 3_600_000,
    codex_read_timeout_ms: 5_000,
    codex_stall_timeout_ms: 300_000,
    codex_approval_policy: %{
      "reject" => %{"sandbox_approval" => true, "rules" => true, "mcp_elicitations" => true}
    },
    codex_thread_sandbox: "workspace-write",
    codex_turn_sandbox_policy: nil,
    workflow_prompt: nil
  ]

  @type t :: %__MODULE__{}
end
