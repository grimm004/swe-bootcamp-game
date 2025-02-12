using GameServer.Api.Constants;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Mappers;
using GameServer.Domain.Models;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Endpoints;

public static class LobbyEndpoints
{
    private const string Route = "/lobbies";
    private const string Category = "LobbyEndpoints";

    public static IEndpointRouteBuilder MapLobbyEndpoints(this IEndpointRouteBuilder builder)
    {
        var lobbyRoute = builder.MapGroup(Route)
            .RequireAuthorization(AuthPolicies.Player);

        lobbyRoute.MapPost("", CreateLobby);
        lobbyRoute.MapGet("", GetLobbies);
        lobbyRoute.MapGet("/{id:guid}", GetLobby);
        lobbyRoute.MapDelete("/{id:guid}", DeleteLobby);
        lobbyRoute.MapPost("/{id:guid}/users", JoinLobby);
        lobbyRoute.MapDelete("/{id:guid}/users/{userId:guid}", LeaveLobby);

        return builder;
    }

    private static async Task<IResult> CreateLobby(
        ILobbyService lobbyService, ILoggerFactory loggerFactory, HttpContext context, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;

        var logger = loggerFactory.CreateLogger(Category);
        logger.LogInformation("Request to create lobby for: {Username}", user.Username);

        var lobbyResult = await lobbyService.CreateLobbyAsync(user.Id, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Created($"/lobbies/{lobby.Id}", lobby.MapToResponse()),
            Results.BadRequest);
    }

    private static async Task<IResult> GetLobbies([FromQuery(Name = "code")] string joinCode, ILobbyService lobbyService, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(joinCode))
            return Results.BadRequest("Invalid join code");

        var lobbyResult = await lobbyService.GetLobbyByJoinCodeAsync(joinCode, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Ok(new[] { lobby.MapToResponse() }),
            _ => Results.Ok(Array.Empty<LobbyResponse>()),
            Results.BadRequest);
    }

    private static async Task<IResult> GetLobby(
        Guid id, ILobbyService lobbyService, CancellationToken token)
    {
        var lobbyResult = await lobbyService.GetLobbyByIdAsync(id, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Ok(lobby.MapToResponse()),
            _ => Results.NotFound(),
            Results.BadRequest);
    }

    private static async Task<IResult> DeleteLobby(
        Guid id, ILobbyService lobbyService, CancellationToken token)
    {
        var lobbyResult = await lobbyService.DisbandLobbyAsync(id, token);

        return lobbyResult.Match<IResult>(
            _ => Results.NoContent(),
            _ => Results.NotFound(),
            Results.BadRequest);
    }

    private static async Task<IResult> JoinLobby(
        Guid id, JoinLobbyRequest request, ILobbyService lobbyService, HttpContext context, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;

        var lobbyResult = await lobbyService.JoinLobbyAsync(user.Id, request.JoinCode, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Ok(lobby.MapToResponse()),
            _ => Results.NotFound(),
            _ => Results.BadRequest(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> LeaveLobby(
        Guid id, Guid userId, ILobbyService lobbyService, HttpContext context, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;
        var lobbyResult = await lobbyService.GetLobbyByIdAsync(id, token);

        if (!lobbyResult.TryPickT0(out var lobby, out var error))
            return error.Match(
                _ => Results.NotFound(),
                _ => Results.BadRequest());

        if (user.Id != userId && user.Id != lobby.HostId && !user.Roles.Contains("admin"))
            return Results.Forbid();

        var lobbyDeleteResult = await lobbyService.LeaveLobbyAsync(userId, token);

        return lobbyDeleteResult.Match<IResult>(
            updatedLobby => Results.Ok(updatedLobby.MapToResponse()),
            _ => Results.NotFound(),
            Results.BadRequest);
    }
}
