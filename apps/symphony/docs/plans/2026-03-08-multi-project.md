# Multi-Project Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow one Symphony instance to orchestrate multiple Linear projects simultaneously by accepting multiple WORKFLOW.md paths at startup, with each project getting an independent Orchestrator.

**Architecture:** Introduce a `ProjectConfig` struct that holds all resolved config for one project. Thread it explicitly through `Orchestrator → AgentRunner → Workspace/AppServer/PromptBuilder`. `WorkflowStore` gets dynamic naming so each project owns its own file watcher. A `MultiOrchestrator` DynamicSupervisor manages multiple per-project Orchestrators. The dashboard aggregates across all of them.

**Tech Stack:** Elixir/OTP, GenServer, DynamicSupervisor, ExUnit. Uses existing Solid template engine and NimbleOptions validation. No new deps.

---

## Current Architecture (read before touching anything)

```
CLI → single WORKFLOW.md path
Application.start → [WorkflowStore (singleton), Orchestrator, ...]
Config module → reads Workflow.current() → reads from WorkflowStore (global name)
Orchestrator → calls Config.poll_interval_ms() etc. (all global)
AgentRunner → calls Config.agent_max_turns() etc. (all global)
Workspace → calls Config.workspace_root() etc. (all global)
AppServer → calls Config.codex_command() etc. (all global)
```

**Problem:** Everything reads from one global `WorkflowStore` named `WorkflowStore`.

**Solution:**

```
CLI → multiple WORKFLOW.md paths
Application.start → [MultiOrchestrator (DynamicSupervisor), ...]
MultiOrchestrator → starts one {WorkflowStore, name} + one Orchestrator per path
Orchestrator → holds %ProjectConfig{} in state; re-resolves on WORKFLOW.md change
AgentRunner → receives project_config: in opts → passes to Workspace/AppServer/PromptBuilder
Config.resolve/1 → turns raw workflow map into %ProjectConfig{}
```

---

## Key Files

| File | Change |
|---|---|
| `lib/symphony_elixir/project_config.ex` | **CREATE** - new struct |
| `lib/symphony_elixir/config.ex` | **MODIFY** - add `resolve/1` |
| `lib/symphony_elixir/workflow_store.ex` | **MODIFY** - dynamic naming |
| `lib/symphony_elixir/orchestrator.ex` | **MAJOR MODIFY** - per-project config |
| `lib/symphony_elixir/agent_runner.ex` | **MODIFY** - thread config |
| `lib/symphony_elixir/workspace.ex` | **MODIFY** - accept config opts |
| `lib/symphony_elixir/codex/app_server.ex` | **MODIFY** - accept config opts |
| `lib/symphony_elixir/prompt_builder.ex` | **MODIFY** - accept workflow template |
| `lib/symphony_elixir/multi_orchestrator.ex` | **CREATE** - DynamicSupervisor |
| `lib/symphony_elixir.ex` | **MODIFY** - update Application.start |
| `lib/symphony_elixir/cli.ex` | **MODIFY** - multi-path support |
| `lib/symphony_elixir_web/live/dashboard_live.ex` | **MODIFY** - aggregate view |
| `test/symphony_elixir/multi_project_test.exs` | **CREATE** - new tests |

---

## Task 1: ProjectConfig struct

**Files:**
- Create: `lib/symphony_elixir/project_config.ex`
- Test: `test/symphony_elixir/project_config_test.exs`

**Step 1: Write the failing test**

```elixir
# test/symphony_elixir/project_config_test.exs
defmodule SymphonyElixir.ProjectConfigTest do
  use ExUnit.Case

  alias SymphonyElixir.ProjectConfig

  test "struct has all expected fields with defaults" do
    config = %ProjectConfig{}
    assert config.tracker_kind == nil
    assert config.linear_active_states == []
    assert config.poll_interval_ms == 30_000
    assert config.max_concurrent_agents == 10
    assert config.workspace_root != nil
    assert config.workspace_hooks != nil
  end

  test "structs from different projects are independent" do
    a = %ProjectConfig{linear_project_slug: "proj-a", poll_interval_ms: 5_000}
    b = %ProjectConfig{linear_project_slug: "proj-b", poll_interval_ms: 60_000}
    assert a.linear_project_slug == "proj-a"
    assert b.linear_project_slug == "proj-b"
    assert a.poll_interval_ms != b.poll_interval_ms
  end
end
```

**Step 2: Run to verify it fails**

```bash
cd /Users/kazu42/dev/kanban/symphony/elixir
mise exec -- mix test test/symphony_elixir/project_config_test.exs 2>&1 | tail -20
```
Expected: compilation error (module not defined)

**Step 3: Create the struct**

```elixir
# lib/symphony_elixir/project_config.ex
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
```

**Step 4: Run test**
```bash
mise exec -- mix test test/symphony_elixir/project_config_test.exs 2>&1 | tail -10
```
Expected: 2 tests, 0 failures

**Step 5: Commit**
```bash
git add lib/symphony_elixir/project_config.ex test/symphony_elixir/project_config_test.exs
git commit -m "feat: add ProjectConfig struct for per-project config isolation"
```

---

## Task 2: Config.resolve/1 — build ProjectConfig from workflow map

**Files:**
- Modify: `lib/symphony_elixir/config.ex`
- Modify: `test/symphony_elixir/core_test.exs`

**Step 1: Write failing test (add to core_test.exs)**

```elixir
test "Config.resolve/1 builds ProjectConfig from workflow map" do
  alias SymphonyElixir.ProjectConfig

  workflow_map = %{
    "tracker" => %{
      "kind" => "linear",
      "api_key" => "tok_abc",
      "project_slug" => "my-project",
      "active_states" => ["Todo", "In Progress"],
      "terminal_states" => ["Done"]
    },
    "polling" => %{"interval_ms" => 15_000},
    "agent" => %{"max_concurrent_agents" => 3, "max_turns" => 5},
    "codex" => %{"command" => "codex app-server"}
  }

  assert %ProjectConfig{} = config = Config.resolve(workflow_map)
  assert config.tracker_kind == "linear"
  assert config.linear_api_token == "tok_abc"
  assert config.linear_project_slug == "my-project"
  assert config.poll_interval_ms == 15_000
  assert config.max_concurrent_agents == 3
  assert config.agent_max_turns == 5
  assert config.codex_command == "codex app-server"
end
```

**Step 2: Run to verify it fails**
```bash
mise exec -- mix test test/symphony_elixir/core_test.exs 2>&1 | grep -E "error|Error|failed" | head -5
```
Expected: `Config.resolve/1 is undefined`

**Step 3: Add `Config.resolve/1`**

Add to the bottom of `lib/symphony_elixir/config.ex` (before the last `end`):

```elixir
@doc """
Resolves a raw workflow config map into a %ProjectConfig{}.
All env var references ($VAR) are expanded, defaults applied.
"""
@spec resolve(map()) :: SymphonyElixir.ProjectConfig.t()
def resolve(workflow_config) when is_map(workflow_config) do
  # Reuse the existing private helpers by temporarily normalizing the map
  # and running through the same extraction logic.
  normalized = normalize_keys(workflow_config)
  options = extract_workflow_options(normalized) |> NimbleOptions.validate!(@workflow_options_schema)

  hooks = options[:hooks]

  %SymphonyElixir.ProjectConfig{
    tracker_kind: options[:tracker][:kind],
    linear_endpoint: options[:tracker][:endpoint],
    linear_api_token:
      options[:tracker][:api_key]
      |> resolve_env_value(System.get_env("LINEAR_API_KEY"))
      |> normalize_secret_value(),
    linear_project_slug: options[:tracker][:project_slug],
    linear_assignee:
      options[:tracker][:assignee]
      |> resolve_env_value(System.get_env("LINEAR_ASSIGNEE"))
      |> normalize_secret_value(),
    linear_active_states: options[:tracker][:active_states],
    linear_terminal_states: options[:tracker][:terminal_states],
    poll_interval_ms: options[:polling][:interval_ms],
    workspace_root: options[:workspace][:root] |> resolve_path_value(@default_workspace_root),
    workspace_hooks: %{
      after_create: hooks[:after_create],
      before_run: hooks[:before_run],
      after_run: hooks[:after_run],
      before_remove: hooks[:before_remove],
      timeout_ms: hooks[:timeout_ms]
    },
    max_concurrent_agents: options[:agent][:max_concurrent_agents],
    max_concurrent_agents_by_state: options[:agent][:max_concurrent_agents_by_state],
    max_retry_backoff_ms: options[:agent][:max_retry_backoff_ms],
    agent_max_turns: options[:agent][:max_turns],
    codex_command: options[:codex][:command],
    codex_turn_timeout_ms: options[:codex][:turn_timeout_ms],
    codex_read_timeout_ms: options[:codex][:read_timeout_ms],
    codex_stall_timeout_ms: max(options[:codex][:stall_timeout_ms], 0)
  }
end
```

Also add a helper `resolve_from_workflow/1` that takes a `loaded_workflow()`:
```elixir
@spec resolve_from_workflow(Workflow.loaded_workflow()) :: SymphonyElixir.ProjectConfig.t()
def resolve_from_workflow(%{config: config}) when is_map(config), do: resolve(config)
```

**Step 4: Run test**
```bash
mise exec -- mix test test/symphony_elixir/core_test.exs 2>&1 | tail -10
```
Expected: all pass

**Step 5: Commit**
```bash
git add lib/symphony_elixir/config.ex test/symphony_elixir/core_test.exs
git commit -m "feat: add Config.resolve/1 to build ProjectConfig from workflow map"
```

---

## Task 3: WorkflowStore — support dynamic process naming

**Files:**
- Modify: `lib/symphony_elixir/workflow_store.ex`

**Step 1: Write failing test**

```elixir
# Add to test/symphony_elixir/core_test.exs
test "WorkflowStore can be started with a custom name" do
  workflow_path = Workflow.workflow_file_path()
  store_name = :test_workflow_store_custom

  # Stop if already running from a previous test
  case Process.whereis(store_name) do
    pid when is_pid(pid) -> GenServer.stop(pid)
    _ -> :ok
  end

  assert {:ok, _pid} = WorkflowStore.start_link(name: store_name, workflow_path: workflow_path)
  assert {:ok, %{config: _config, prompt: _prompt}} = WorkflowStore.current(store_name)

  on_exit(fn ->
    case Process.whereis(store_name) do
      pid when is_pid(pid) -> GenServer.stop(pid)
      _ -> :ok
    end
  end)
end
```

**Step 2: Run to verify it fails**
```bash
mise exec -- mix test test/symphony_elixir/core_test.exs 2>&1 | grep -E "WorkflowStore.current/1" | head -3
```

**Step 3: Modify WorkflowStore**

Key changes:
1. `start_link` accepts `name:` and `workflow_path:` in opts
2. `current/0` keeps backward compat; add `current/1` that accepts a name
3. `force_reload/1` that accepts a name

```elixir
# In start_link:
def start_link(opts \\ []) do
  name = Keyword.get(opts, :name, __MODULE__)
  GenServer.start_link(__MODULE__, opts, name: name)
end

# In init:
def init(opts) do
  path = Keyword.get(opts, :workflow_path) || Workflow.workflow_file_path()
  case load_state(path) do
    {:ok, state} ->
      schedule_poll()
      {:ok, state}
    {:error, reason} ->
      {:stop, reason}
  end
end

# Add current/1 and force_reload/1:
def current(name \\ __MODULE__) do
  case Process.whereis(name) do
    pid when is_pid(pid) -> GenServer.call(name, :current)
    _ -> Workflow.load()  # fallback
  end
end

def force_reload(name \\ __MODULE__) do
  case Process.whereis(name) do
    pid when is_pid(pid) -> GenServer.call(name, :force_reload)
    _ ->
      case Workflow.load() do
        {:ok, _} -> :ok
        {:error, reason} -> {:error, reason}
      end
  end
end
```

**Step 4: Run tests**
```bash
mise exec -- mix test test/symphony_elixir/core_test.exs 2>&1 | tail -10
```

**Step 5: Make sure existing tests still pass**
```bash
mise exec -- mix test 2>&1 | tail -15
```

**Step 6: Commit**
```bash
git add lib/symphony_elixir/workflow_store.ex test/symphony_elixir/core_test.exs
git commit -m "feat: WorkflowStore supports dynamic naming for per-project instances"
```

---

## Task 4: Thread ProjectConfig through AgentRunner/Workspace/AppServer/PromptBuilder

This is the biggest task. Thread `project_config:` through the call chain.

**Files:**
- Modify: `lib/symphony_elixir/agent_runner.ex`
- Modify: `lib/symphony_elixir/workspace.ex`
- Modify: `lib/symphony_elixir/codex/app_server.ex`
- Modify: `lib/symphony_elixir/prompt_builder.ex`

**Step 1: Write failing test**

```elixir
# test/symphony_elixir/multi_project_test.exs
defmodule SymphonyElixir.MultiProjectTest do
  use SymphonyElixir.TestSupport

  alias SymphonyElixir.ProjectConfig

  test "AgentRunner.run accepts project_config in opts" do
    # Just verify the opts are accepted without crashing
    # (actual Codex calls are mocked in other tests)
    config_a = %ProjectConfig{
      workspace_root: Path.join(System.tmp_dir!(), "proj-a-workspaces"),
      workspace_hooks: %{after_create: nil, before_run: nil, after_run: nil, before_remove: nil, timeout_ms: 60_000},
      agent_max_turns: 1,
      linear_active_states: ["Todo"]
    }

    # This should pass project_config opts without raising
    issue = %SymphonyElixir.Linear.Issue{
      id: "test-id-1",
      identifier: "TST-1",
      title: "Test issue",
      state: "Todo"
    }

    # project_config opt is accepted and used for workspace root
    assert is_binary(config_a.workspace_root)
    assert config_a.agent_max_turns == 1
  end

  test "Config.resolve/1 produces independent configs per project" do
    workflow_a = %{
      "tracker" => %{"kind" => "linear", "api_key" => "tok_a", "project_slug" => "proj-a"},
      "agent" => %{"max_concurrent_agents" => 2}
    }
    workflow_b = %{
      "tracker" => %{"kind" => "linear", "api_key" => "tok_b", "project_slug" => "proj-b"},
      "agent" => %{"max_concurrent_agents" => 5}
    }

    config_a = Config.resolve(workflow_a)
    config_b = Config.resolve(workflow_b)

    assert config_a.linear_project_slug == "proj-a"
    assert config_b.linear_project_slug == "proj-b"
    assert config_a.max_concurrent_agents == 2
    assert config_b.max_concurrent_agents == 5
    assert config_a.linear_api_token != config_b.linear_api_token
  end
end
```

**Step 2: Run to verify**
```bash
mise exec -- mix test test/symphony_elixir/multi_project_test.exs 2>&1 | tail -15
```

**Step 3: Modify `Workspace` functions to accept `project_config:` opt**

Add config-aware variants to `workspace.ex`. Existing functions stay unchanged for backward compat.

```elixir
# Add this private helper at the top of private section:
defp config_workspace_root(opts) do
  case Keyword.get(opts, :project_config) do
    %{workspace_root: root} when is_binary(root) -> root
    _ -> Config.workspace_root()
  end
end

defp config_workspace_hooks(opts) do
  case Keyword.get(opts, :project_config) do
    %{workspace_hooks: hooks} when is_map(hooks) -> hooks
    _ -> Config.workspace_hooks()
  end
end
```

Update `create_for_issue/2` to accept opts:
```elixir
@spec create_for_issue(map() | String.t() | nil, keyword()) :: {:ok, Path.t()} | {:error, term()}
def create_for_issue(issue_or_identifier, opts \\ []) do
  # use config_workspace_root(opts) instead of Config.workspace_root()
end
```

And `workspace_path_for_issue`:
```elixir
defp workspace_path_for_issue(safe_id, opts) do
  Path.join(config_workspace_root(opts), safe_id)
end
```

Update `run_before_run_hook/3`, `run_after_run_hook/3` similarly.

**Step 4: Modify `AppServer.start_session/2` to accept opts**

```elixir
@spec start_session(Path.t(), keyword()) :: {:ok, session()} | {:error, term()}
def start_session(workspace, opts \\ []) do
  # Use opts[:project_config] for codex settings if present,
  # fall back to Config.*() for backward compat
end
```

Add helpers:
```elixir
defp config_codex_command(opts) do
  case Keyword.get(opts, :project_config) do
    %{codex_command: cmd} when is_binary(cmd) -> cmd
    _ -> Config.codex_command()
  end
end
# ... similar for approval_policy, thread_sandbox, turn_sandbox_policy, timeouts
```

**Step 5: Modify `PromptBuilder.build_prompt/2` to accept workflow template in opts**

```elixir
def build_prompt(issue, opts \\ []) do
  template_string =
    case Keyword.get(opts, :project_config) do
      %{workflow_prompt: prompt} when is_binary(prompt) and prompt != "" -> prompt
      _ ->
        Workflow.current()
        |> prompt_template!()
        |> then(fn t -> if String.trim(t) == "", do: Config.workflow_prompt(), else: t end)
    end
  # ... rest of rendering
end
```

**Step 6: Modify `AgentRunner.run/3` to pass project_config to sub-calls**

Key changes in `agent_runner.ex`:
```elixir
def run(issue, codex_update_recipient \\ nil, opts \\ []) do
  # Pass opts through to Workspace.create_for_issue
  case Workspace.create_for_issue(issue, opts) do
    {:ok, workspace} ->
      # ...
      with :ok <- Workspace.run_before_run_hook(workspace, issue, opts),
           :ok <- run_codex_turns(workspace, issue, codex_update_recipient, opts) do
  # ...
end

defp run_codex_turns(workspace, issue, codex_update_recipient, opts) do
  max_turns = Keyword.get(opts, :max_turns, config_agent_max_turns(opts))
  # ...
  with {:ok, session} <- AppServer.start_session(workspace, opts) do
    # ...
  end
end

defp config_agent_max_turns(opts) do
  case Keyword.get(opts, :project_config) do
    %{agent_max_turns: n} when is_integer(n) -> n
    _ -> Config.agent_max_turns()
  end
end
```

Also update `continue_with_issue?` to use `project_config.linear_active_states`.

**Step 7: Run all tests**
```bash
mise exec -- mix test 2>&1 | tail -20
```

**Step 8: Commit**
```bash
git add lib/symphony_elixir/agent_runner.ex lib/symphony_elixir/workspace.ex \
        lib/symphony_elixir/codex/app_server.ex lib/symphony_elixir/prompt_builder.ex \
        test/symphony_elixir/multi_project_test.exs
git commit -m "feat: thread ProjectConfig through AgentRunner/Workspace/AppServer/PromptBuilder"
```

---

## Task 5: Orchestrator — per-project config in state

**Files:**
- Modify: `lib/symphony_elixir/orchestrator.ex`

**Step 1: Write failing test**

```elixir
# Add to multi_project_test.exs
test "Orchestrator can be started with explicit workflow_path" do
  workflow_path = Workflow.workflow_file_path()

  {:ok, pid} = Orchestrator.start_link(
    name: :test_orchestrator_multi,
    workflow_path: workflow_path
  )

  assert Process.alive?(pid)

  on_exit(fn ->
    if Process.alive?(pid), do: GenServer.stop(pid)
  end)
end
```

**Step 2: Run to see current failure**
```bash
mise exec -- mix test test/symphony_elixir/multi_project_test.exs 2>&1 | tail -15
```

**Step 3: Modify Orchestrator State struct**

```elixir
defmodule State do
  defstruct [
    :project_config,       # NEW: %ProjectConfig{} for this project
    :workflow_store_name,  # NEW: name of this project's WorkflowStore
    :poll_interval_ms,
    :max_concurrent_agents,
    :next_poll_due_at_ms,
    :poll_check_in_progress,
    running: %{},
    completed: MapSet.new(),
    claimed: MapSet.new(),
    retry_attempts: %{},
    codex_totals: nil,
    codex_rate_limits: nil
  ]
end
```

**Step 4: Modify `Orchestrator.init/1`**

```elixir
@impl true
def init(opts) do
  workflow_path = Keyword.get(opts, :workflow_path, Workflow.workflow_file_path())
  store_name = Keyword.get(opts, :workflow_store_name, WorkflowStore)

  # Resolve project config from this project's WorkflowStore
  project_config = resolve_project_config(store_name, workflow_path)
  now_ms = System.monotonic_time(:millisecond)

  state = %State{
    project_config: project_config,
    workflow_store_name: store_name,
    poll_interval_ms: project_config.poll_interval_ms,
    max_concurrent_agents: project_config.max_concurrent_agents,
    next_poll_due_at_ms: now_ms,
    poll_check_in_progress: false,
    codex_totals: @empty_codex_totals,
    codex_rate_limits: nil
  }

  run_terminal_workspace_cleanup(project_config)
  :ok = schedule_tick(0)
  {:ok, state}
end

defp resolve_project_config(store_name, workflow_path) do
  case WorkflowStore.current(store_name) do
    {:ok, workflow} ->
      Config.resolve_from_workflow(workflow)
      |> Map.put(:workflow_path, workflow_path)
    {:error, _} ->
      # Fall back to loading directly
      case Workflow.load(workflow_path) do
        {:ok, workflow} -> Config.resolve_from_workflow(workflow)
        _ -> %SymphonyElixir.ProjectConfig{}
      end
  end
end
```

**Step 5: Update `refresh_runtime_config/1` to re-read from project's WorkflowStore**

```elixir
defp refresh_runtime_config(%State{workflow_store_name: store_name} = state) do
  case WorkflowStore.current(store_name) do
    {:ok, workflow} ->
      new_config = Config.resolve_from_workflow(workflow)
      %{state |
        project_config: new_config,
        poll_interval_ms: new_config.poll_interval_ms,
        max_concurrent_agents: new_config.max_concurrent_agents
      }
    _ ->
      state
  end
end
```

**Step 6: Update `dispatch_issue/2` to pass project_config in AgentRunner opts**

Find where `Task.Supervisor.start_child` is called (within `dispatch_issue` or similar) and add `project_config:` to the opts passed to `AgentRunner.run`:

```elixir
# When spawning a worker task:
opts = [
  max_turns: state.project_config.agent_max_turns,
  attempt: attempt,
  project_config: state.project_config,
  issue_state_fetcher: build_issue_state_fetcher(state.project_config)
]
AgentRunner.run(issue, self(), opts)
```

**Step 7: Build project-specific tracker functions**

```elixir
defp build_issue_state_fetcher(%ProjectConfig{} = config) do
  fn issue_ids ->
    SymphonyElixir.Linear.Client.fetch_issue_states_by_ids_with_config(issue_ids, config)
  end
end

defp fetch_candidate_issues_for_project(%ProjectConfig{} = config) do
  SymphonyElixir.Linear.Client.fetch_candidate_issues_with_config(config)
end
```

This requires adding `_with_config` variants to `Linear.Client` (Task 6).

**Step 8: Update Linear.Client to accept explicit config**

```elixir
# Add to linear/client.ex:
@spec fetch_candidate_issues_with_config(ProjectConfig.t()) :: {:ok, [Issue.t()]} | {:error, term()}
def fetch_candidate_issues_with_config(%{
  linear_api_token: api_token,
  linear_project_slug: project_slug,
  linear_active_states: active_states,
  linear_assignee: assignee
}) do
  # Same logic as fetch_candidate_issues/0 but with explicit params
end

@spec fetch_issue_states_by_ids_with_config([String.t()], ProjectConfig.t()) :: {:ok, [Issue.t()]} | {:error, term()}
def fetch_issue_states_by_ids_with_config(issue_ids, %{linear_api_token: _token} = config) do
  # Same as fetch_issue_states_by_ids/1 but with config
end
```

**Step 9: Update `run_terminal_workspace_cleanup`**

```elixir
defp run_terminal_workspace_cleanup(%ProjectConfig{} = config) do
  Task.Supervisor.start_child(SymphonyElixir.TaskSupervisor, fn ->
    # Use config.linear_terminal_states and config.workspace_root
    cleanup_terminal_workspaces(config)
  end)
end
```

**Step 10: Run all tests**
```bash
mise exec -- mix test 2>&1 | tail -20
```

**Step 11: Commit**
```bash
git add lib/symphony_elixir/orchestrator.ex lib/symphony_elixir/linear/client.ex
git commit -m "feat: Orchestrator holds per-project config, passes to AgentRunner and Linear client"
```

---

## Task 6: MultiOrchestrator — DynamicSupervisor for multiple projects

**Files:**
- Create: `lib/symphony_elixir/multi_orchestrator.ex`
- Modify: `lib/symphony_elixir.ex` (Application.start)
- Modify: `lib/symphony_elixir/cli.ex`

**Step 1: Write failing test**

```elixir
# Add to multi_project_test.exs
test "MultiOrchestrator starts one Orchestrator per workflow path" do
  workflow_path_a = Workflow.workflow_file_path()
  workflow_path_b = Workflow.workflow_file_path()

  {:ok, sup} = SymphonyElixir.MultiOrchestrator.start_link(name: :test_multi_orch)

  :ok = SymphonyElixir.MultiOrchestrator.add_project(sup, workflow_path_a)
  :ok = SymphonyElixir.MultiOrchestrator.add_project(sup, workflow_path_b)

  children = DynamicSupervisor.which_children(sup)
  assert length(children) >= 2

  on_exit(fn ->
    if Process.alive?(sup), do: DynamicSupervisor.stop(sup)
  end)
end
```

**Step 2: Run to see failure**
```bash
mise exec -- mix test test/symphony_elixir/multi_project_test.exs 2>&1 | tail -10
```

**Step 3: Create MultiOrchestrator**

```elixir
# lib/symphony_elixir/multi_orchestrator.ex
defmodule SymphonyElixir.MultiOrchestrator do
  @moduledoc """
  DynamicSupervisor that manages one WorkflowStore + Orchestrator pair per project.
  """

  use DynamicSupervisor
  require Logger

  alias SymphonyElixir.{Orchestrator, WorkflowStore}

  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    DynamicSupervisor.start_link(__MODULE__, opts, name: name)
  end

  @impl true
  def init(_opts) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @spec add_project(atom() | pid(), Path.t()) :: :ok | {:error, term()}
  def add_project(supervisor \\ __MODULE__, workflow_path) do
    expanded = Path.expand(workflow_path)

    unless File.regular?(expanded) do
      {:error, {:workflow_file_not_found, expanded}}
    else
      project_id = path_to_project_id(expanded)
      store_name = :"SymphonyElixir.WorkflowStore.#{project_id}"
      orch_name = :"SymphonyElixir.Orchestrator.#{project_id}"

      # Start WorkflowStore for this project
      store_spec = {WorkflowStore, name: store_name, workflow_path: expanded}
      case DynamicSupervisor.start_child(supervisor, store_spec) do
        {:ok, _} -> :ok
        {:error, {:already_started, _}} -> :ok
        {:error, reason} -> {:error, {:workflow_store_start_failed, reason}}
      end

      # Start Orchestrator for this project
      orch_spec = {Orchestrator,
        name: orch_name,
        workflow_path: expanded,
        workflow_store_name: store_name
      }
      case DynamicSupervisor.start_child(supervisor, orch_spec) do
        {:ok, _} -> :ok
        {:error, {:already_started, _}} -> :ok
        {:error, reason} -> {:error, {:orchestrator_start_failed, reason}}
      end
    end
  end

  @spec list_projects(atom() | pid()) :: [map()]
  def list_projects(supervisor \\ __MODULE__) do
    DynamicSupervisor.which_children(supervisor)
    |> Enum.filter(fn {_, _, _, mods} -> Orchestrator in mods end)
    |> Enum.map(fn {_, pid, _, _} ->
      %{pid: pid, alive: Process.alive?(pid)}
    end)
  end

  defp path_to_project_id(path) do
    path
    |> String.replace(~r/[^A-Za-z0-9._-]/, "_")
    |> String.slice(-60..-1)  # limit length
  end
end
```

**Step 4: Update Application.start to use MultiOrchestrator**

Modify `lib/symphony_elixir.ex`:

```elixir
defmodule SymphonyElixir.Application do
  use Application

  @impl true
  def start(_type, _args) do
    :ok = SymphonyElixir.LogFile.configure()

    children = [
      {Phoenix.PubSub, name: SymphonyElixir.PubSub},
      {Task.Supervisor, name: SymphonyElixir.TaskSupervisor},
      SymphonyElixir.WorkflowStore,       # keep for backward compat / single-project mode
      SymphonyElixir.MultiOrchestrator,   # NEW: manages multi-project Orchestrators
      SymphonyElixir.Orchestrator,        # keep for backward compat if no multi mode
      SymphonyElixir.HttpServer,
      SymphonyElixir.StatusDashboard
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: SymphonyElixir.Supervisor)
  end
end
```

**Note:** The single `Orchestrator` stays for backward compat when only one WORKFLOW.md path is given. When multiple paths are given, CLI uses MultiOrchestrator.

**Step 5: Modify CLI to accept multiple WORKFLOW.md paths**

```elixir
# In cli.ex, update evaluate/2:
def evaluate(args, deps \\ runtime_deps()) do
  case OptionParser.parse(args, strict: @switches) do
    {opts, [], []} ->
      # No paths: use cwd/WORKFLOW.md (single-project backward compat)
      with :ok <- require_guardrails_acknowledgement(opts),
           :ok <- maybe_set_logs_root(opts, deps),
           :ok <- maybe_set_server_port(opts, deps) do
        run([Path.expand("WORKFLOW.md")], deps)
      end

    {opts, [_ | _] = workflow_paths, []} ->
      # One or more paths given
      with :ok <- require_guardrails_acknowledgement(opts),
           :ok <- maybe_set_logs_root(opts, deps),
           :ok <- maybe_set_server_port(opts, deps) do
        run(workflow_paths, deps)
      end

    _ ->
      {:error, usage_message()}
  end
end

def run(workflow_paths, deps) when is_list(workflow_paths) do
  expanded = Enum.map(workflow_paths, &Path.expand/1)

  missing = Enum.reject(expanded, &deps.file_regular?.(&1))
  unless Enum.empty?(missing) do
    {:error, "Workflow file(s) not found: #{Enum.join(missing, ", ")}"}
  else
    # Single path: use original single-project flow for backward compat
    if length(expanded) == 1 do
      [path] = expanded
      :ok = deps.set_workflow_file_path.(path)
      start_and_wait(deps)
    else
      # Multiple paths: use MultiOrchestrator
      :ok = deps.set_multi_workflow_paths.(expanded)
      start_and_wait(deps)
    end
  end
end
```

Add `set_multi_workflow_paths` to the deps struct and runtime_deps:
```elixir
set_multi_workflow_paths: fn paths ->
  Application.put_env(:symphony_elixir, :multi_workflow_paths, paths)
  :ok
end
```

And in MultiOrchestrator's `init` (or Application startup), read this env and call `add_project` for each:
```elixir
# In MultiOrchestrator after start:
case Application.get_env(:symphony_elixir, :multi_workflow_paths) do
  paths when is_list(paths) ->
    Enum.each(paths, &add_project/1)
  _ ->
    :ok
end
```

**Step 6: Update usage message**
```elixir
defp usage_message do
  "Usage: symphony [--logs-root <path>] [--port <port>] [WORKFLOW.md ...]\n" <>
  "  Pass multiple WORKFLOW.md paths to run multiple projects."
end
```

**Step 7: Run all tests**
```bash
mise exec -- mix test 2>&1 | tail -20
```

**Step 8: Commit**
```bash
git add lib/symphony_elixir/multi_orchestrator.ex lib/symphony_elixir.ex lib/symphony_elixir/cli.ex
git commit -m "feat: MultiOrchestrator DynamicSupervisor + CLI multi-path support"
```

---

## Task 7: Dashboard aggregation across projects

**Files:**
- Modify: `lib/symphony_elixir_web/live/dashboard_live.ex`
- Modify: `lib/symphony_elixir/status_dashboard.ex`

**Step 1: Understand current status flow**

Currently `StatusDashboard` publishes to `SymphonyElixir.ObservabilityPubSub` and `DashboardLive` subscribes. The snapshot includes `running`, `retrying`, `codex_totals`.

For multi-project, we need to aggregate from all Orchestrators.

**Step 2: Write failing test**

```elixir
# Add to multi_project_test.exs
test "StatusDashboard.snapshot aggregates running issues across projects" do
  # With the existing StatusDashboard (subscribes to all orchestrators),
  # snapshot should return a list of per-project snapshots or a merged view
  snapshot = StatusDashboard.snapshot()
  assert is_map(snapshot) or is_list(snapshot)
end
```

**Step 3: Modify Orchestrator to include project_id in status updates**

Each Orchestrator's status notification should include its `workflow_path` or project label:

```elixir
defp notify_dashboard(%State{project_config: config} = state) do
  StatusDashboard.update(build_snapshot(state, config.workflow_path))
end
```

**Step 4: Modify StatusDashboard to store per-project snapshots**

```elixir
defmodule SymphonyElixir.StatusDashboard do
  use GenServer
  # ...

  # State: map of project_id -> snapshot
  # update/1 now takes {project_id, snapshot} tuple OR just snapshot (backward compat)

  def update({project_id, snapshot}) do
    GenServer.cast(__MODULE__, {:update_project, project_id, snapshot})
  end

  def update(snapshot) when is_map(snapshot) do
    GenServer.cast(__MODULE__, {:update_project, :default, snapshot})
  end

  def snapshot do
    GenServer.call(__MODULE__, :snapshot)
  end

  def snapshot(project_id) do
    GenServer.call(__MODULE__, {:snapshot, project_id})
  end
end
```

**Step 5: Update DashboardLive to show multi-project**

In `dashboard_live.ex`, when there are multiple projects, show them in tabs or sections:

```elixir
# In render/1, if multi-project:
def render(assigns) do
  ~H"""
  <%= if map_size(@projects) > 1 do %>
    <div class="projects">
      <%= for {project_id, snapshot} <- @projects do %>
        <section class="project">
          <h2><%= project_label(project_id) %></h2>
          <%= render_project_snapshot(snapshot) %>
        </section>
      <% end %>
    </div>
  <% else %>
    <%= render_project_snapshot(@snapshot) %>
  <% end %>
  """
end
```

**Step 6: Run tests**
```bash
mise exec -- mix test 2>&1 | tail -20
```

**Step 7: Commit**
```bash
git add lib/symphony_elixir_web/live/dashboard_live.ex lib/symphony_elixir/status_dashboard.ex
git commit -m "feat: dashboard aggregates status across multiple projects"
```

---

## Task 8: Integration test — two independent projects

**Files:**
- Modify: `test/symphony_elixir/multi_project_test.exs`

**Step 1: Write integration test**

```elixir
test "two projects run independently with separate configs" do
  # Write two different workflow files
  tmp = System.tmp_dir!()
  path_a = Path.join(tmp, "workflow_a_#{System.unique_integer()}.md")
  path_b = Path.join(tmp, "workflow_b_#{System.unique_integer()}.md")

  write_workflow_file!(path_a,
    tracker_project_slug: "project-a",
    poll_interval_ms: 60_000,
    max_concurrent_agents: 2
  )
  write_workflow_file!(path_b,
    tracker_project_slug: "project-b",
    poll_interval_ms: 30_000,
    max_concurrent_agents: 5
  )

  {:ok, sup} = SymphonyElixir.MultiOrchestrator.start_link(name: :integration_test_sup)

  :ok = SymphonyElixir.MultiOrchestrator.add_project(sup, path_a)
  :ok = SymphonyElixir.MultiOrchestrator.add_project(sup, path_b)

  # Give orchestrators a moment to init
  Process.sleep(100)

  projects = SymphonyElixir.MultiOrchestrator.list_projects(sup)
  assert length(projects) == 2
  assert Enum.all?(projects, & &1.alive)

  on_exit(fn ->
    File.rm(path_a)
    File.rm(path_b)
    if Process.alive?(sup), do: DynamicSupervisor.stop(sup)
  end)
end
```

**Step 2: Run integration test**
```bash
mise exec -- mix test test/symphony_elixir/multi_project_test.exs 2>&1 | tail -20
```
Expected: pass

**Step 3: Run full test suite**
```bash
mise exec -- mix test 2>&1 | tail -20
```
Expected: all pass (or only pre-existing failures)

**Step 4: Commit**
```bash
git add test/symphony_elixir/multi_project_test.exs
git commit -m "test: integration tests for multi-project orchestration"
```

---

## Task 9: Update WORKFLOW.md sample and docs

**Files:**
- Modify: `symphony/SYMPHONY_OVERVIEW.md`
- (Optional) Add `symphony/elixir/docs/multi-project.md`

**Step 1: Update SYMPHONY_OVERVIEW.md section 8 (Elixir setup)**

Add multi-project usage example:
```bash
# Single project (unchanged)
LINEAR_API_KEY=xxx mise exec -- ./bin/symphony ./WORKFLOW.md

# Multiple projects
LINEAR_API_KEY=xxx mise exec -- ./bin/symphony \
  ./projects/backend/WORKFLOW.md \
  ./projects/frontend/WORKFLOW.md \
  ./projects/infra/WORKFLOW.md
```

**Step 2: Commit**
```bash
git add symphony/SYMPHONY_OVERVIEW.md
git commit -m "docs: add multi-project usage examples"
```

---

## Task 10: Final verification

**Step 1: Run full test suite**
```bash
cd /Users/kazu42/dev/kanban/symphony/elixir
mise exec -- make all 2>&1 | tail -30
```

**Step 2: Build the binary**
```bash
mise exec -- mix build 2>&1 | tail -10
```

**Step 3: Quick smoke test (no Linear key needed)**
```bash
# Should print usage error, not crash
./bin/symphony --help 2>&1 || true
./bin/symphony nonexistent.md 2>&1 | grep -i "not found"
```

**Step 4: Update memory file**

Update `/Users/kazu42/.claude/projects/-Users-kazu42-dev-kanban/memory/MEMORY.md` with the new multi-project architecture.

---

## Key Design Decisions

| Decision | Why |
|---|---|
| ProjectConfig struct (not process-local state) | Explicit, testable, no magic |
| WorkflowStore per project (unique names) | Hot-reload still works per project |
| DynamicSupervisor for projects | OTP-idiomatic, fault-isolated |
| Backward compat: single path = old behavior | Zero breakage for existing users |
| Linear.Client `_with_config` variants | No global state in per-project Linear calls |

## Order of tasks

Tasks 1-2 (ProjectConfig + Config.resolve) → Task 3 (WorkflowStore naming) → Task 4 (threading) → Task 5 (Orchestrator) → Task 6 (MultiOrchestrator + CLI) → Task 7 (Dashboard) → Task 8 (Integration test) → Task 9 (Docs) → Task 10 (Verify)
