using System.Collections.Immutable;
using GameServer.Api.Constants;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Hubs;

[Authorize(AuthPolicies.Player)]
internal sealed class GameHub(ILobbyService lobbyService, IGameService gameService, ILogger<LobbyHub> logger) : Hub<IGameClient>
{
    /// <summary>
    /// Called when a player state changes.
    /// </summary>
    /// <param name="state">New player state</param>
    // ReSharper disable once UnusedMember.Global
    public void PlayerStateUpdate(GamePlayerStateUpdate state)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            throw new HubException("User identifier is not a valid GUID");
        }

        var lobbyId = gameService.GetLobbyIdByUserId(userId);
        if (!lobbyId.HasValue)
        {
            logger.LogWarning("Lobby ID not found for user {UserId}", userId);
            throw new HubException("Lobby ID not found");
        }

        gameService.UpdatePlayerState(lobbyId.Value, userId, state.MapToGamePlayerState());
    }

    /// <summary>
    /// Called when the host world state changes.
    /// </summary>
    /// <param name="states">New object states</param>
    // ReSharper disable once UnusedMember.Global
    public void WorldStateUpdate(IEnumerable<GameObjectStateUpdate> states)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            throw new HubException("User identifier is not a valid GUID");
        }

        var lobbyId = gameService.GetLobbyIdByUserId(userId);
        if (!lobbyId.HasValue)
        {
            logger.LogWarning("Lobby ID not found for user {UserId}", userId);
            throw new HubException("Lobby ID not found");
        }

        gameService.UpdateObjectStates(lobbyId.Value, states.Select(GameMappers.MapToGameObjectState).ToImmutableList());
    }

    public override async Task OnConnectedAsync()
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            throw new HubException("User identifier is not a valid GUID");
        }

        logger.LogInformation("Game connection {ConnectionId} for user {UserId} connected", Context.ConnectionId, userId);
        var lobbyResult = await lobbyService.GetLobbyByUserIdAsync(userId, Context.ConnectionAborted);

        if (!lobbyResult.TryPickT0(out var lobby, out var errors))
            errors.Switch(
                _ => throw new HubException("Lobby not found"),
                error => throw new HubException($"Error retrieving lobby: {error.Value}"));

        await Groups.AddToGroupAsync(Context.ConnectionId, lobby.Id.ToString(), Context.ConnectionAborted);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            return;
        }

        logger.LogInformation("Game connection {ConnectionId} for user {UserId} disconnected", Context.ConnectionId, userId);

        var lobbyResult = await lobbyService.GetLobbyByIdAsync(userId);

        if (!lobbyResult.TryPickT0(out var lobby, out var errors))
            errors.Switch(
                _ => throw new HubException("Lobby not found"),
                error => throw new HubException($"Error retrieving lobby: {error.Value}"));

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, lobby.Id.ToString());

        await base.OnDisconnectedAsync(exception);
    }
}