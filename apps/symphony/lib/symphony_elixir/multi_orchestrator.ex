defmodule SymphonyElixir.MultiOrchestrator do
  @moduledoc """
  DynamicSupervisor that manages one {WorkflowStore, Orchestrator} pair per project.
  Each project is identified by its WORKFLOW.md file path.
  """

  use DynamicSupervisor
  require Logger

  alias SymphonyElixir.{Orchestrator, WorkflowStore}

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    DynamicSupervisor.start_link(__MODULE__, opts, name: name)
  end

  @impl true
  def init(_opts) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @doc """
  Add a project by its WORKFLOW.md path. Starts a dedicated WorkflowStore and
  Orchestrator for the project. Idempotent — safe to call multiple times with
  the same path.
  """
  @spec add_project(Path.t()) :: :ok | {:error, term()}
  @spec add_project(atom() | pid(), Path.t()) :: :ok | {:error, term()}
  def add_project(supervisor \\ __MODULE__, workflow_path) do
    expanded = Path.expand(workflow_path)

    unless File.regular?(expanded) do
      {:error, {:workflow_file_not_found, expanded}}
    else
      project_id = path_to_id(expanded)
      store_name = :"SymphonyElixir.WorkflowStore.#{project_id}"
      orch_name = :"SymphonyElixir.Orchestrator.#{project_id}"

      with :ok <- start_workflow_store(supervisor, store_name, expanded),
           :ok <- start_orchestrator(supervisor, orch_name, store_name, expanded) do
        :ok
      end
    end
  end

  @doc """
  List all active project Orchestrator PIDs managed by this supervisor.
  """
  @spec list_projects(atom() | pid()) :: [%{pid: pid(), alive: boolean()}]
  def list_projects(supervisor \\ __MODULE__) do
    DynamicSupervisor.which_children(supervisor)
    |> Enum.filter(fn {_, _, _, mods} -> Orchestrator in List.wrap(mods) end)
    |> Enum.map(fn {_, pid, _, _} ->
      %{pid: pid, alive: is_pid(pid) and Process.alive?(pid)}
    end)
  end

  # Private

  defp start_workflow_store(supervisor, store_name, workflow_path) do
    spec = {WorkflowStore, name: store_name, workflow_path: workflow_path}

    case DynamicSupervisor.start_child(supervisor, spec) do
      {:ok, _} ->
        :ok

      {:error, {:already_started, _}} ->
        :ok

      {:error, reason} ->
        Logger.error("Failed to start WorkflowStore for #{workflow_path}: #{inspect(reason)}")
        {:error, {:workflow_store_start_failed, reason}}
    end
  end

  defp start_orchestrator(supervisor, orch_name, store_name, workflow_path) do
    spec = {Orchestrator, name: orch_name, workflow_path: workflow_path, workflow_store_name: store_name}

    case DynamicSupervisor.start_child(supervisor, spec) do
      {:ok, _} ->
        :ok

      {:error, {:already_started, _}} ->
        :ok

      {:error, reason} ->
        Logger.error("Failed to start Orchestrator for #{workflow_path}: #{inspect(reason)}")
        {:error, {:orchestrator_start_failed, reason}}
    end
  end

  defp path_to_id(path) when is_binary(path) do
    path
    |> String.replace(~r/[^A-Za-z0-9._-]/, "_")
    |> String.slice(-64..-1//1)
  end
end
