using GameServer.Api.Constants;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Mappers;
using GameServer.Domain.Models;
using GameServer.Domain.Services;

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
            _ => Results.Conflict(),
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
            _ => Results.Conflict(),
            _ => Results.BadRequest(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> LeaveLobby(
        Guid id, Guid userId, ILobbyService lobbyService, HttpContext context, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;

        if (user.Id != userId || user.Roles.Contains("admin"))
            return Results.Forbid();

        var lobbyResult = await lobbyService.LeaveLobbyAsync(userId, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Ok(lobby.MapToResponse()),
            _ => Results.NotFound(),
            Results.BadRequest);
    }
}
