using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;
using GameServer.Api.Constants;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Hubs;

[ExcludeFromCodeCoverage]
[Authorize(AuthPolicies.Player)]
internal sealed class LobbyHub(ILobbyService lobbyService, IGameService gameService, ILogger<LobbyHub> logger) : Hub<ILobbyClient>
{
    /// <summary>
    /// Called when the host starts the game.
    /// </summary>
    // ReSharper disable once UnusedMember.Global
    public async Task StartGame()
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            throw new HubException("User identifier is not a valid GUID");
        }

        var startGameResult = await lobbyService.StartGameAsync(userId, Context.ConnectionAborted);

        await startGameResult.Match<Task>(
            async lobby =>
            {
                gameService.StartGame(lobby.Id, lobby.HostId, lobby.Users.Select(u => u.Id).ToImmutableList());
                logger.LogInformation("Game started in lobby {LobbyId}", lobby.Id);
                await Clients.Group(lobby.Id.ToString()).GameStarted();
            },
            _ => throw new HubException("Lobby not found or user isn't host"),
            _ => throw new HubException("Game already started"),
            error => throw new HubException($"Error starting game: {error.Value}"));
    }

    public override async Task OnConnectedAsync()
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            logger.LogWarning("User identifier is not a valid GUID: {UserId}", Context.UserIdentifier);
            throw new HubException("User identifier is not a valid GUID");
        }

        logger.LogInformation("Lobby connection {ConnectionId} for user {UserId} connected", Context.ConnectionId, userId);
        var lobbyResult = await lobbyService.GetLobbyByUserIdAsync(userId, Context.ConnectionAborted);

        if (!lobbyResult.TryPickT0(out var lobby, out var errors))
            errors.Switch(
                _ => throw new HubException("Lobby not found"),
                error => throw new HubException($"Error retrieving lobby: {error.Value}"));

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

        logger.LogInformation("Lobby connection {ConnectionId} for user {UserId} disconnected", Context.ConnectionId, userId);

        var lobbyResult = await lobbyService.LeaveLobbyAsync(userId);

        if (!lobbyResult.TryPickT0(out var lobby, out var errors))
        {
            errors.Switch(
                _ => logger.LogWarning("Lobby not found for user {UserId}", userId),
                error => logger.LogWarning("Error retrieving lobby: {Error}", error.Value));

            if (Context.Items["LobbyId"] is not Guid lobbyId)
                return;

            var lobbyResultFromId = await lobbyService.GetLobbyByIdAsync(lobbyId);

            if (!lobbyResultFromId.TryPickT0(out lobby, out _))
            {
                logger.LogWarning("Lobby not found by ID {LobbyId}", lobbyId);
                await Clients.Group(lobbyId.ToString()).LobbyDisbanded();

                await base.OnDisconnectedAsync(exception);
                return;
            }

            if (!lobby.Users.Any())
            {
                await lobbyService.DisbandLobbyAsync(lobby.Id);
                await Clients.Group(lobby.Id.ToString()).LobbyDisbanded();
            }

            await base.OnDisconnectedAsync(exception);
            return;
        }

        if (!lobby.Users.Any() || lobby.HostId == userId)
        {
            await lobbyService.DisbandLobbyAsync(lobby.Id);
            await Clients.Group(lobby.Id.ToString()).LobbyDisbanded();
        }
        else
            await Clients.Group(lobby.Id.ToString()).PlayerLeft(userId.ToString());

        await base.OnDisconnectedAsync(exception);
    }
}