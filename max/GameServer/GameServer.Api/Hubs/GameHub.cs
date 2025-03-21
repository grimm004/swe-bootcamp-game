using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;
using GameServer.Api.Constants;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Hubs;

[ExcludeFromCodeCoverage]
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
            return;
        }

        gameService.UpdatePlayerState(userId, state.MapToGamePlayerState());
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
            return;
        }

        var gameState = gameService.GetGameStateByUserId(userId);
        if (gameState is null)
        {
            logger.LogWarning("Game not found for user {UserId}", userId);
            return;
        }

        if (gameState.HostId != userId)
        {
            logger.LogWarning("User {UserId} is not the host of the game", userId);
            return;
        }

        gameService.UpdateObjectStates(gameState.LobbyId, states.Select(GameMappers.MapToGameObjectState).ToImmutableList());
    }

    /// <summary>
    /// Called when non-host players perform an action.
    /// </summary>
    /// <param name="actions">Player actions</param>
    // ReSharper disable once UnusedMember.Global
    public async Task GamePlayerImpulseAction(IEnumerable<GamePlayerImpulseAction> actions)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            return;
        }

        var gameState = gameService.GetGameStateByUserId(userId);
        if (gameState is null)
        {
            logger.LogWarning("Game not found for user {UserId}", userId);
            return;
        }

        await Clients.User(gameState.HostId.ToString()).GamePlayerImpulseAction(actions);
    }

    public override async Task OnConnectedAsync()
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            return;
        }

        logger.LogInformation("Game connection {ConnectionId} for user {UserId} connected", Context.ConnectionId, userId);
        var lobbyResult = await lobbyService.GetLobbyByUserIdAsync(userId, Context.ConnectionAborted);

        if (!lobbyResult.TryPickT0(out var lobby, out var errors))
        {
            errors.Switch(
                _ => logger.LogWarning("Lobby not found for user {UserId}", userId),
                error => logger.LogWarning("Error retrieving lobby: {Error}", error.Value));
            return;
        }

        Context.Items["LobbyId"] = lobby.Id;
        Context.Items["HostId"] = lobby.HostId;

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

        Guid lobbyId;
        if (lobbyResult.TryPickT0(out var lobby, out var errors))
            lobbyId = lobby.Id;
        else
        {
            errors.Switch(
                _ => logger.LogWarning("Lobby not found for user {UserId}", userId),
                error => logger.LogWarning("Error retrieving lobby: {Error}", error.Value));

            if (Context.Items["LobbyId"] is not Guid id)
                return;

            lobbyId = id;
        }

        var gameState = gameService.RemovePlayer(userId);

        await Clients.Group(lobbyId.ToString()).PlayerLeft(userId.ToString());

        if (gameState?.HostId == userId || gameState is { Players.Count: < 2 })
        {
            gameService.StopGame(lobbyId);
            await Clients.Group(lobbyId.ToString()).GameStopped();
        }

        if (gameState is { Players.Count: < 2 })
            await lobbyService.OpenLobbyAsync(lobbyId);

        await base.OnDisconnectedAsync(exception);
    }
}