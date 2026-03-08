defmodule SymphonyElixir.ProjectConfigTest do
  use ExUnit.Case

  alias SymphonyElixir.ProjectConfig

  test "struct has all expected fields with defaults" do
    config = %ProjectConfig{}
    assert config.tracker_kind == nil
    assert config.linear_active_states == ["Todo", "In Progress"]
    assert config.poll_interval_ms == 30_000
    assert config.max_concurrent_agents == 10
    assert is_binary(config.workspace_root)
    assert is_map(config.workspace_hooks)
    assert config.workspace_hooks.timeout_ms == 60_000
    assert config.agent_max_turns == 20
    assert config.codex_command == "codex app-server"
  end

  test "structs from different projects are independent" do
    a = %ProjectConfig{linear_project_slug: "proj-a", poll_interval_ms: 5_000}
    b = %ProjectConfig{linear_project_slug: "proj-b", poll_interval_ms: 60_000}
    assert a.linear_project_slug == "proj-a"
    assert b.linear_project_slug == "proj-b"
    assert a.poll_interval_ms != b.poll_interval_ms
  end

  test "struct fields cover all config areas" do
    config = %ProjectConfig{}
    # tracker
    assert Map.has_key?(config, :tracker_kind)
    assert Map.has_key?(config, :linear_api_token)
    assert Map.has_key?(config, :linear_project_slug)
    assert Map.has_key?(config, :linear_active_states)
    assert Map.has_key?(config, :linear_terminal_states)
    # workspace
    assert Map.has_key?(config, :workspace_root)
    assert Map.has_key?(config, :workspace_hooks)
    # agent
    assert Map.has_key?(config, :max_concurrent_agents)
    assert Map.has_key?(config, :agent_max_turns)
    assert Map.has_key?(config, :max_retry_backoff_ms)
    # codex
    assert Map.has_key?(config, :codex_command)
    assert Map.has_key?(config, :codex_approval_policy)
    assert Map.has_key?(config, :codex_thread_sandbox)
  end
end
