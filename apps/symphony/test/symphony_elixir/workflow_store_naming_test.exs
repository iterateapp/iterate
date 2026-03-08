defmodule SymphonyElixir.WorkflowStoreNamingTest do
  use ExUnit.Case, async: false

  alias SymphonyElixir.Workflow
  alias SymphonyElixir.WorkflowStore

  test "WorkflowStore can be started with a custom name and workflow_path" do
    workflow_path = Workflow.workflow_file_path()
    store_name = :"test_workflow_store_#{System.unique_integer([:positive])}"

    on_exit(fn ->
      case Process.whereis(store_name) do
        pid when is_pid(pid) -> GenServer.stop(pid)
        _ -> :ok
      end
    end)

    assert {:ok, _pid} = WorkflowStore.start_link(name: store_name, workflow_path: workflow_path)
    assert {:ok, %{config: _, prompt: _}} = WorkflowStore.current(store_name)
  end

  test "WorkflowStore with fixed path ignores global path changes" do
    tmp = System.tmp_dir!()
    path_a = Path.join(tmp, "wf_a_#{System.unique_integer()}.md")
    path_b = Path.join(tmp, "wf_b_#{System.unique_integer()}.md")

    # Write two different workflow files
    File.write!(path_a, "---\ntracker:\n  kind: linear\n  project_slug: proj-a\n---\nPrompt A")
    File.write!(path_b, "---\ntracker:\n  kind: linear\n  project_slug: proj-b\n---\nPrompt B")

    store_name = :"test_fixed_#{System.unique_integer([:positive])}"
    original_path = Workflow.workflow_file_path()

    on_exit(fn ->
      # Restore global path before cleaning up temp files
      Workflow.set_workflow_file_path(original_path)
      File.rm(path_a)
      File.rm(path_b)

      case Process.whereis(store_name) do
        pid when is_pid(pid) -> GenServer.stop(pid)
        _ -> :ok
      end
    end)

    {:ok, _} = WorkflowStore.start_link(name: store_name, workflow_path: path_a)
    {:ok, wf_a} = WorkflowStore.current(store_name)
    assert wf_a.prompt =~ "Prompt A"

    # Changing global path should NOT affect this store
    Workflow.set_workflow_file_path(path_b)
    Process.sleep(50)
    {:ok, wf_still_a} = WorkflowStore.current(store_name)
    assert wf_still_a.prompt =~ "Prompt A"
  end
end
