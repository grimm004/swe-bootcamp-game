using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Hubs;

public class LobbyHub(ILogger<LobbyHub> logger) : Hub
{
    /// <summary>
    /// Adds the connection to the specified lobby group.
    /// </summary>
    /// <param name="lobbyId">Lobby GUID</param>
    public async Task AddToLobbyGroup(string lobbyId)
    {
        // todo: check the user is in the lobby and reconcile reconnections - perhaps perform this automatically on connection
        logger.LogInformation("Connection {ConnectionId} added to lobby {LobbyId}", Context.ConnectionId, lobbyId);
        await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
    }

    /// <summary>
    /// Called when the host starts the game.
    /// </summary>
    /// <param name="lobbyId">Lobby GUID</param>
    public async Task StartGame(string lobbyId)
    {
        // todo: check the user is the host
        logger.LogInformation("Game started in lobby {LobbyId}", lobbyId);
        // todo: update lobby status to in progress
        await Clients.Group(lobbyId).SendAsync("GameStarted");
    }

    // Optionally, override OnConnectedAsync/OnDisconnectedAsync to add/remove users to/from groups.
    public override async Task OnConnectedAsync()
    {
        logger.LogInformation("Connection {ConnectionId} connected", Context.ConnectionId);
        // You might add the connection to a group corresponding to the lobby
        // todo: use Context.User
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        logger.LogInformation("Connection {ConnectionId} disconnected", Context.ConnectionId);
        // Clean up groups and notify others, if needed.
        await base.OnDisconnectedAsync(exception);
    }
}