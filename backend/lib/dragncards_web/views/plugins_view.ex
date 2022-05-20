defmodule DragnCardsWeb.PluginsView do
  use DragnCardsWeb, :view
  alias DragnCardsWeb.PluginsView

  def render("index.json", %{plugins: plugins}) do
    IO.puts("here 1")
    IO.inspect(plugins)
    %{data: Enum.map(plugins, fn plugin ->
      %{
        plugin_uuid: plugin.plugin_uuid,
        plugin_name: plugin.plugin_name,
        num_favorites: plugin.num_favorites,
        author_user_id: plugin.author_user_id,
      }
    end)}
    #%{data: render_many(plugins, PluginsView, "plugin.json")} # This wasn't working for some reason
  end

#  def render("show.json", %{plugin: plugin}) do
#    %{data: render_one(plugin, PluginsView, "plugin.json")}
#  end

#  def render("plugin.json", %{plugin: plugin}) do
#    %{
#      plugin_uuid: plugin.plugin_uuid,
#      plugin_name: plugin.plugin_name,
#      num_favorites: plugin.num_favorites,
#      user_id: plugin.user_id,
#    }
#  end
end
