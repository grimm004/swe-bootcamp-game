using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Hubs;

internal sealed class GameHub(ILogger<LobbyHub> logger) : Hub
{
    /// <summary>
    /// Adds the connection to the game group for the specified lobby.
    /// </summary>
    /// <param name="lobbyId">Lobby GUID</param>
    public async Task AddToGameGroup(string lobbyId)
    {
        // todo: check the user is in the lobby and reconcile reconnections, perhaps perform this automatically on connection
        logger.LogInformation("Connection {ConnectionId} added to game for lobby {LobbyId}", Context.ConnectionId, lobbyId);
        await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
    }

    /// <summary>
    /// Called when a player state changes.
    /// </summary>
    /// <param name="lobbyId">Lobby GUID</param>
    /// <param name="playerId">Player GUID</param>
    /// <param name="state">New player state</param>
    /// <param name="deltaTime">Time since last state update</param>
    public async Task PlayerStateUpdate(string lobbyId, string playerId, string state, float deltaTime)
    {
        // todo: infer group from user identity context
        // for now, forward state to all players in the game. todo: maintain global state and send interpolated state on a fixed interval
        await Clients.Group(lobbyId).SendAsync("PlayerStateUpdate", playerId, state, deltaTime);
    }

    /// <summary>
    /// Called when the host world state changes.
    /// </summary>
    /// <param name="lobbyId">Lobby GUID</param>
    /// <param name="playerId">Player GUID</param>
    /// <param name="entityId">Entity ID</param>
    /// <param name="state">New player state</param>
    public async Task WorldStateUpdate(string lobbyId, string playerId, string state)
    {
        // todo: infer group from user identity context
        // todo: restrict to host player
        // for now, forward state to all players in the game. todo: maintain global state and send interpolated state on a fixed interval
        await Clients.Group(lobbyId).SendAsync("WorldStateUpdate", playerId, state);
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